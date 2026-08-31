"use strict";

/*
 * tracking-engine.js
 *
 * Target-lock tracking engine
 *
 * Goal:
 *   Tracker जिस object पर LOCK किया गया है,
 *   उसी object को follow करे और दूसरे समान objects
 *   पर switch न करे.
 *
 * Works with:
 *   - multiple trackers
 *   - multiple locked targets
 *   - local search
 *   - target template
 *   - motion prediction
 *   - lost-target protection
 *   - confidence filtering
 */

class TrackingEngine {

    constructor(options = {}) {

        this.video =
            options.video || null;

        this.canvas =
            options.canvas || null;

        this.worker =
            options.worker || null;

        this.trackers =
            new Map();

        this.running =
            false;

        this.frameNumber =
            0;

        this.lastTime =
            performance.now();

        this.fps =
            0;

        this.defaultSensitivity =
            Number.isFinite(options.sensitivity)
                ? options.sensitivity
                : 0.65;

        this.defaultSearchRadius =
            Number.isFinite(options.searchRadius)
                ? options.searchRadius
                : 90;

        this.maxLostFrames =
            Number.isFinite(options.maxLostFrames)
                ? options.maxLostFrames
                : 15;

        this.onUpdate =
            typeof options.onUpdate === "function"
                ? options.onUpdate
                : null;

        this.onStatus =
            typeof options.onStatus === "function"
                ? options.onStatus
                : null;

        this.onError =
            typeof options.onError === "function"
                ? options.onError
                : null;


        this.frameCanvas =
            document.createElement("canvas");

        this.frameContext =
            this.frameCanvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );


        this.workerReady =
            false;

        this.workerBusy =
            false;


        this._bindWorker();


        if (this.worker) {

            this._sendWorker({

                type:
                    "reset"

            });

        }

    }


    /* =================================================
       WORKER
    ================================================= */

    _bindWorker() {

        if (!this.worker) {
            return;
        }


        this.worker.onmessage =
            (event) => {

                const data =
                    event.data || {};


                if (
                    data.type ===
                    "ready"
                ) {

                    this.workerReady =
                        true;

                    return;
                }


                if (
                    data.type ===
                    "tracking-result"
                ) {

                    this.workerBusy =
                        false;

                    this._handleResults(
                        data.results || []
                    );

                    return;
                }


                if (
                    data.type ===
                    "error"
                ) {

                    this.workerBusy =
                        false;

                    this._emitError(
                        data.message ||
                        "Tracking worker error"
                    );

                }

            };

    }


    /* =================================================
       REGISTER TRACKER
    ================================================= */

    registerTracker(tracker) {

        if (
            !tracker ||
            tracker.id === undefined ||
            tracker.id === null
        ) {

            return false;

        }


        const id =
            String(
                tracker.id
            );


        const state = {

            id,

            locked:
                Boolean(
                    tracker.locked
                ),

            x:
                Number(
                    tracker.cx ??
                    tracker.x ??
                    0
                ),

            y:
                Number(
                    tracker.cy ??
                    tracker.y ??
                    0
                ),

            width:
                Number(
                    tracker.width ??
                    tracker.size ??
                    100
                ),

            height:
                Number(
                    tracker.height ??
                    tracker.size ??
                    100
                ),

            sensitivity:
                Number.isFinite(
                    tracker.sensitivity
                )
                    ? tracker.sensitivity
                    : this.defaultSensitivity,

            searchRadius:
                Number.isFinite(
                    tracker.searchRadius
                )
                    ? tracker.searchRadius
                    : this.defaultSearchRadius,

            template:
                null,

            lostFrames:
                0,

            confidence:
                0,

            vx:
                0,

            vy:
                0,

            lastX:
                Number(
                    tracker.cx ??
                    tracker.x ??
                    0
                ),

            lastY:
                Number(
                    tracker.cy ??
                    tracker.y ??
                    0
                ),

            lastWidth:
                Number(
                    tracker.width ??
                    tracker.size ??
                    100
                ),

            lastHeight:
                Number(
                    tracker.height ??
                    tracker.size ??
                    100
                ),

            lockedAt:
                0

        };


        this.trackers.set(
            id,
            state
        );


        return true;

    }


    /* =================================================
       REMOVE TRACKER
    ================================================= */

    removeTracker(id) {

        this.trackers.delete(
            String(id)
        );

    }


    /* =================================================
       UPDATE TRACKER
    ================================================= */

    updateTracker(tracker) {

        if (!tracker) {
            return false;
        }


        const id =
            String(
                tracker.id
            );


        let state =
            this.trackers.get(id);


        if (!state) {

            this.registerTracker(
                tracker
            );

            state =
                this.trackers.get(id);

        }


        if (
            Number.isFinite(
                tracker.cx
            )
        ) {

            state.x =
                tracker.cx;

        }

        else if (
            Number.isFinite(
                tracker.x
            )
        ) {

            state.x =
                tracker.x;

        }


        if (
            Number.isFinite(
                tracker.cy
            )
        ) {

            state.y =
                tracker.cy;

        }

        else if (
            Number.isFinite(
                tracker.y
            )
        ) {

            state.y =
                tracker.y;

        }


        if (
            Number.isFinite(
                tracker.size
            )
        ) {

            state.width =
                tracker.size;

            state.height =
                tracker.size;

        }


        if (
            Number.isFinite(
                tracker.width
            )
        ) {

            state.width =
                tracker.width;

        }


        if (
            Number.isFinite(
                tracker.height
            )
        ) {

            state.height =
                tracker.height;

        }


        if (
            Number.isFinite(
                tracker.sensitivity
            )
        ) {

            state.sensitivity =
                Math.max(
                    0,
                    Math.min(
                        1,
                        tracker.sensitivity
                    )
                );

        }


        if (
            Number.isFinite(
                tracker.searchRadius
            )
        ) {

            state.searchRadius =
                Math.max(
                    20,
                    tracker.searchRadius
                );

        }


        return true;

    }


    /* =================================================
       LOCK TRACKER
    ================================================= */

    async lockTracker(
        id,
        options = {}
    ) {

        const trackerId =
            String(id);


        let state =
            this.trackers.get(
                trackerId
            );


        if (!state) {

            state = {

                id:
                    trackerId,

                locked:
                    false,

                x:
                    Number(
                        options.x
                    ) || 0,

                y:
                    Number(
                        options.y
                    ) || 0,

                width:
                    Number(
                        options.width
                    ) || 100,

                height:
                    Number(
                        options.height
                    ) || 100,

                sensitivity:
                    Number.isFinite(
                        options.sensitivity
                    )
                        ? options.sensitivity
                        : this.defaultSensitivity,

                searchRadius:
                    Number.isFinite(
                        options.searchRadius
                    )
                        ? options.searchRadius
                        : this.defaultSearchRadius,

                template:
                    null,

                lostFrames:
                    0,

                confidence:
                    0,

                vx:
                    0,

                vy:
                    0,

                lastX:
                    Number(
                        options.x
                    ) || 0,

                lastY:
                    Number(
                        options.y
                    ) || 0,

                lastWidth:
                    Number(
                        options.width
                    ) || 100,

                lastHeight:
                    Number(
                        options.height
                    ) || 100,

                lockedAt:
                    0

            };


            this.trackers.set(
                trackerId,
                state
            );

        }


        /*
         * Capture the exact area underneath the
         * tracker at the moment of locking.
         *
         * This becomes the target's visual identity.
         */
        const template =
            await this._captureTemplate(
                state
            );


        if (!template) {

            this._emitStatus(
                "Unable to capture target"
            );

            return false;

        }


        state.template =
            template;


        state.locked =
            true;


        state.lostFrames =
            0;


        state.confidence =
            1;


        state.vx =
            0;


        state.vy =
            0;


        state.lockedAt =
            performance.now();


        this._emitStatus(
            "Target locked"
        );


        this._notifyTracker(
            state
        );


        return true;

    }


    /* =================================================
       UNLOCK TRACKER
    ================================================= */

    unlockTracker(id) {

        const state =
            this.trackers.get(
                String(id)
            );


        if (!state) {
            return false;
        }


        state.locked =
            false;


        state.template =
            null;


        state.lostFrames =
            0;


        state.confidence =
            0;


        state.vx =
            0;


        state.vy =
            0;


        this._notifyTracker(
            state
        );


        return true;

    }


    /* =================================================
       CAPTURE TEMPLATE
    ================================================= */

    async _captureTemplate(
        state
    ) {

        if (
            !this.video ||
            !this.video.videoWidth ||
            !this.video.videoHeight
        ) {

            return null;

        }


        const videoRect =
            this.video.getBoundingClientRect();


        if (
            !videoRect.width ||
            !videoRect.height
        ) {

            return null;

        }


        /*
         * Convert screen coordinates to actual
         * video coordinates.
         */
        const scaleX =
            this.video.videoWidth /
            videoRect.width;


        const scaleY =
            this.video.videoHeight /
            videoRect.height;


        const sourceX =
            Math.max(
                0,
                Math.round(
                    (
                        state.x -
                        state.width / 2
                    ) *
                    scaleX
                )
            );


        const sourceY =
            Math.max(
                0,
                Math.round(
                    (
                        state.y -
                        state.height / 2
                    ) *
                    scaleY
                )
            );


        const sourceWidth =
            Math.min(
                this.video.videoWidth -
                sourceX,
                Math.max(
                    8,
                    Math.round(
                        state.width *
                        scaleX
                    )
                )
            );


        const sourceHeight =
            Math.min(
                this.video.videoHeight -
                sourceY,
                Math.max(
                    8,
                    Math.round(
                        state.height *
                        scaleY
                    )
                )
            );


        if (
            sourceWidth <= 0 ||
            sourceHeight <= 0
        ) {

            return null;

        }


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            sourceWidth;

        canvas.height =
            sourceHeight;


        const context =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently:
                        true
                }
            );


        context.drawImage(

            this.video,

            sourceX,
            sourceY,

            sourceWidth,
            sourceHeight,

            0,
            0,

            sourceWidth,
            sourceHeight

        );


        const imageData =
            context.getImageData(
                0,
                0,
                sourceWidth,
                sourceHeight
            );


        return {

            data:
                imageData.data,

            width:
                sourceWidth,

            height:
                sourceHeight

        };

    }


    /* =================================================
       START
    ================================================= */

    start() {

        if (this.running) {
            return;
        }


        this.running =
            true;


        this._emitStatus(
            "Tracking"
        );


        this._loop();

    }


    /* =================================================
       STOP
    ================================================= */

    stop() {

        this.running =
            false;


        this.workerBusy =
            false;


        this._emitStatus(
            "Stopped"
        );

    }


    /* =================================================
       FRAME LOOP
    ================================================= */

    _loop() {

        if (!this.running) {
            return;
        }


        this._updateFPS();


        this._processCurrentFrame();


        requestAnimationFrame(
            () => this._loop()
        );

    }


    /* =================================================
       PROCESS CURRENT FRAME
    ================================================= */

    _processCurrentFrame() {

        if (
            !this.video ||
            this.video.readyState <
                2
        ) {

            return;

        }


        if (
            !this.worker ||
            this.workerBusy
        ) {

            return;

        }


        const lockedTrackers =
            Array.from(
                this.trackers.values()
            )
            .filter(
                tracker =>
                    tracker.locked &&
                    tracker.template
            );


        if (
            lockedTrackers.length === 0
        ) {

            return;

        }


        const width =
            this.video.videoWidth;


        const height =
            this.video.videoHeight;


        if (
            width <= 0 ||
            height <= 0
        ) {

            return;

        }


        this.frameCanvas.width =
            width;


        this.frameCanvas.height =
            height;


        this.frameContext.drawImage(
            this.video,
            0,
            0,
            width,
            height
        );


        const frame =
            this.frameContext.getImageData(
                0,
                0,
                width,
                height
            );


        /*
         * Each tracker gets its OWN job.
         *
         * No global object assignment.
         */
        const jobs =
            lockedTrackers.map(
                state => {

                    const predicted =
                        this._predictPosition(
                            state
                        );


                    const videoPosition =
                        this._screenToVideo(
                            predicted.x,
                            predicted.y
                        );


                    const template =
                        this._resizeTemplateForVideo(
                            state
                        );


                    return {

                        id:
                            state.id,

                        x:
                            videoPosition.x,

                        y:
                            videoPosition.y,

                        width:
                            template.width,

                        height:
                            template.height,

                        sensitivity:
                            state.sensitivity,

                        /*
                         * The search area is centered
                         * around THIS tracker's target.
                         */
                        searchRadius:
                            this._getSearchRadius(
                                state
                            ),

                        template:
                            template.data.buffer

                    };

                }
            );


        this.workerBusy =
            true;


        this.worker.postMessage(

            {

                type:
                    "track",

                frame:
                    frame.data.buffer,

                width:
                    width,

                height:
                    height,

                jobs:
                    jobs,

                frameNumber:
                    this.frameNumber++

            },

            [
                frame.data.buffer,

                ...jobs
                    .map(
                        job =>
                            job.template
                    )

            ]

        );

    }


    /* =================================================
       HANDLE RESULTS
    ================================================= */

    _handleResults(
        results
    ) {

        if (
            !Array.isArray(
                results
            )
        ) {

            return;

        }


        for (
            const result of results
        ) {

            const state =
                this.trackers.get(
                    String(
                        result.id
                    )
                );


            if (!state) {
                continue;
            }


            if (
                !state.locked
            ) {
                continue;
            }


            if (
                result.found
            ) {

                this._acceptResult(
                    state,
                    result
                );

            }

            else {

                this._handleLostTarget(
                    state,
                    result
                );

            }


            this._notifyTracker(
                state
            );

        }


        if (
            typeof this.onUpdate ===
            "function"
        ) {

            this.onUpdate(
                this.getTrackerStates()
            );

        }

    }


    /* =================================================
       ACCEPT RESULT
    ================================================= */

    _acceptResult(
        state,
        result
    ) {

        const newX =
            this._videoToScreenX(
                result.x
            );


        const newY =
            this._videoToScreenY(
                result.y
            );


        /*
         * Calculate movement.
         */
        const dx =
            newX -
            state.x;


        const dy =
            newY -
            state.y;


        /*
         * Update velocity.
         */
        state.vx =
            state.vx * 0.65 +
            dx * 0.35;


        state.vy =
            state.vy * 0.65 +
            dy * 0.35;


        /*
         * Higher sensitivity = faster response.
         */
        const sensitivity =
            Math.max(
                0,
                Math.min(
                    1,
                    state.sensitivity
                )
            );


        const followStrength =
            0.55 +
            sensitivity *
            0.40;


        /*
         * Smoothly move the tracker to the
         * SAME target.
         */
        state.lastX =
            state.x;


        state.lastY =
            state.y;


        state.x =
            state.x +
            dx *
            followStrength;


        state.y =
            state.y +
            dy *
            followStrength;


        /*
         * If the worker found a new bounding size,
         * update it slowly.
         */
        if (
            Number.isFinite(
                result.width
            ) &&
            result.width > 0
        ) {

            const targetWidth =
                this._videoSizeToScreen(
                    result.width
                );


            state.width =
                state.width * 0.70 +
                targetWidth * 0.30;

        }


        if (
            Number.isFinite(
                result.height
            ) &&
            result.height > 0
        ) {

            const targetHeight =
                this._videoHeightToScreen(
                    result.height
                );


            state.height =
                state.height * 0.70 +
                targetHeight * 0.30;

        }


        state.confidence =
            Number(
                result.confidence
            ) || 0;


        state.lostFrames =
            0;

    }


    /* =================================================
       LOST TARGET
    ================================================= */

    _handleLostTarget(
        state,
        result
    ) {

        state.lostFrames++;


        /*
         * CRITICAL:
         *
         * Do NOT move to result.x/result.y when
         * the target is lost.
         *
         * The tracker remains attached to the
         * last known target position.
         */
        if (
            state.lostFrames <=
            this.maxLostFrames
        ) {

            /*
             * Short-term prediction.
             */
            const prediction =
                Math.min(
                    state.lostFrames,
                    4
                );


            state.x +=
                state.vx *
                0.35 *
                prediction;


            state.y +=
                state.vy *
                0.35 *
                prediction;


            /*
             * Slowly reduce velocity.
             */
            state.vx *=
                0.75;

            state.vy *=
                0.75;


            state.confidence *=
                0.92;


            return;

        }


        /*
         * Even after being lost for a while,
         * DO NOT unlock or switch to another object.
         *
         * Keep the last position.
         */
        state.vx =
            0;

        state.vy =
            0;


        state.confidence =
            0;

    }


    /* =================================================
       PREDICT POSITION
    ================================================= */

    _predictPosition(
        state
    ) {

        const framesAhead =
            1;


        return {

            x:
                state.x +
                state.vx *
                framesAhead,

            y:
                state.y +
                state.vy *
                framesAhead

        };

    }


    /* =================================================
       SEARCH RADIUS
    ================================================= */

    _getSearchRadius(
        state
    ) {

        const sensitivity =
            Math.max(
                0,
                Math.min(
                    1,
                    state.sensitivity
                )
            );


        /*
         * Search radius grows with sensitivity,
         * but remains local.
         */
        return Math.max(

            30,

            Math.min(

                180,

                state.searchRadius *
                (
                    0.75 +
                    sensitivity *
                    0.75
                )

            )

        );

    }


    /* =================================================
       COORDINATE CONVERSION
    ================================================= */

    _screenToVideo(
        x,
        y
    ) {

        if (
            !this.video
        ) {

            return {

                x,
                y

            };

        }


        const rect =
            this.video.getBoundingClientRect();


        if (
            rect.width <= 0 ||
            rect.height <= 0
        ) {

            return {

                x,
                y

            };

        }


        return {

            x:
                x *
                (
                    this.video.videoWidth /
                    rect.width
                ),

            y:
                y *
                (
                    this.video.videoHeight /
                    rect.height
                )

        };

    }


    _videoToScreenX(
        x
    ) {

        if (
            !this.video
        ) {

            return x;

        }


        const rect =
            this.video.getBoundingClientRect();


        return (
            x *
            rect.width /
            this.video.videoWidth
        );

    }


    _videoToScreenY(
        y
    ) {

        if (
            !this.video
        ) {

            return y;

        }


        const rect =
            this.video.getBoundingClientRect();


        return (
            y *
            rect.height /
            this.video.videoHeight
        );

    }


    _videoSizeToScreen(
        size
    ) {

        if (
            !this.video ||
            !this.video.videoWidth
        ) {

            return size;

        }


        const rect =
            this.video.getBoundingClientRect();


        return (
            size *
            rect.width /
            this.video.videoWidth
        );

    }


    _videoHeightToScreen(
        size
    ) {

        if (
            !this.video ||
            !this.video.videoHeight
        ) {

            return size;

        }


        const rect =
            this.video.getBoundingClientRect();


        return (
            size *
            rect.height /
            this.video.videoHeight
        );

    }


    /* =================================================
       RESIZE TEMPLATE
    ================================================= */

    _resizeTemplateForVideo(
        state
    ) {

        const template =
            state.template;


        if (!template) {

            return {

                data:
                    new Uint8ClampedArray(),

                width:
                    0,

                height:
                    0

            };

        }


        /*
         * Template is already captured in video
         * pixel coordinates.
         *
         * Keep its original size.
         */
        return {

            data:
                template.data,

            width:
                template.width,

            height:
                template.height

        };

    }


    /* =================================================
       RESET
    ================================================= */

    reset() {

        for (
            const state of
            this.trackers.values()
        ) {

            state.locked =
                false;

            state.template =
                null;

            state.lostFrames =
                0;

            state.confidence =
                0;

            state.vx =
                0;

            state.vy =
                0;

        }


        this._emitStatus(
            "Ready"
        );


        if (this.worker) {

            this.worker.postMessage({

                type:
                    "reset"

            });

        }

    }


    /* =================================================
       FPS
    ================================================= */

    _updateFPS() {

        const now =
            performance.now();


        const delta =
            now -
            this.lastTime;


        if (
            delta >= 500
        ) {

            this.fps =
                Math.round(
                    1000 / delta
                );


            this.lastTime =
                now;

        }

    }


    /* =================================================
       GET FPS
    ================================================= */

    getFPS() {

        return this.fps;

    }


    /* =================================================
       GET TRACKER STATES
    ================================================= */

    getTrackerStates() {

        return Array.from(
            this.trackers.values()
        )
        .map(
            state => ({

                id:
                    state.id,

                locked:
                    state.locked,

                x:
                    state.x,

                y:
                    state.y,

                width:
                    state.width,

                height:
                    state.height,

                confidence:
                    state.confidence,

                lostFrames:
                    state.lostFrames,

                tracking:
                    state.locked &&
                    state.lostFrames <=
                    this.maxLostFrames

            })
        );

    }


    /* =================================================
       GET TRACKER
    ================================================= */

    getTracker(
        id
    ) {

        return this.trackers.get(
            String(id)
        );

    }


    /* =================================================
       NOTIFY TRACKER
    ================================================= */

    _notifyTracker(
        state
    ) {

        if (
            !this.onUpdate
        ) {

            return;

        }


        this.onUpdate({

            id:
                state.id,

            locked:
                state.locked,

            x:
                state.x,

            y:
                state.y,

            width:
                state.width,

            height:
                state.height,

            confidence:
                state.confidence,

            lostFrames:
                state.lostFrames,

            tracking:
                state.locked &&
                state.lostFrames <=
                this.maxLostFrames

        });

    }


    /* =================================================
       STATUS
    ================================================= */

    _emitStatus(
        status
    ) {

        if (
            typeof this.onStatus ===
            "function"
        ) {

            this.onStatus(
                status
            );

        }

    }


    /* =================================================
       ERROR
    ================================================= */

    _emitError(
        error
    ) {

        if (
            typeof this.onError ===
            "function"
        ) {

            this.onError(
                error
            );

        }

        else {

            console.error(
                "[TrackingEngine]",
                error
            );

        }

    }

}


/* =====================================================
   GLOBAL EXPORT
===================================================== */

if (
    typeof window !==
    "undefined"
) {

    window.TrackingEngine =
        TrackingEngine;

}


if (
    typeof module !==
    "undefined" &&
    module.exports
) {

    module.exports =
        TrackingEngine;

}