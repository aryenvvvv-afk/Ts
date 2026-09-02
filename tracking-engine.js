"use strict";

/*
 * =========================================================
 * tracking-engine.js
 * Object Tracker
 *
 * Responsible for:
 * - Frame-by-frame target matching
 * - Locked target identity preservation
 * - Preventing tracker from switching to another object
 * - Smoothing tracker movement
 * - Lost-target handling
 * =========================================================
 */

class TrackingEngine {

    constructor(options = {}) {

        this.videoController =
            options.videoController ||
            window.videoController ||
            null;

        this.trackerManager =
            options.trackerManager ||
            null;

        this.detector =
            options.detector ||
            null;


        this.running =
            false;

        this.processing =
            false;


        this.frameRequest =
            null;


        this.lastVideoTime =
            -1;


        this.frameNumber =
            0;


        this.sensitivity =
            Config.clampSensitivity(
                options.sensitivity ??
                APP_CONFIG.tracker.defaultSensitivity
            );


        /*
         * Latest detections.
         */
        this.detections =
            [];


        /*
         * Per-target history.
         *
         * यह identity continuity maintain करने में
         * मदद करता है.
         */
        this.targetHistory =
            new Map();


        /*
         * Events.
         */
        this.events =
            new SimpleEventEmitter();


        /*
         * Performance.
         */
        this.lastProcessTime =
            0;


        this.processingInterval =
            APP_CONFIG.video.processingInterval;


        /*
         * Bound loop.
         */
        this.boundFrame =
            this.processFrame.bind(this);

    }


    /* =====================================================
       INIT
    ===================================================== */

    init() {

        if (
            !this.videoController
        ) {

            this.videoController =
                window.videoController ||
                null;

        }


        if (
            !this.trackerManager
        ) {

            this.trackerManager =
                window.trackerManager ||
                null;

        }


        return Boolean(
            this.videoController
        );

    }


    /* =====================================================
       SETTERS
    ===================================================== */

    setVideoController(
        controller
    ) {

        this.videoController =
            controller;

    }


    setTrackerManager(
        manager
    ) {

        this.trackerManager =
            manager;

    }


    setDetector(
        detector
    ) {

        this.detector =
            detector;

    }


    setSensitivity(
        value
    ) {

        this.sensitivity =
            Config.clampSensitivity(
                value
            );


        return this.sensitivity;

    }


    /* =====================================================
       START
    ===================================================== */

    start() {

        if (
            this.running
        ) {

            return;

        }


        this.running =
            true;


        this.lastVideoTime =
            -1;


        this.frameNumber =
            0;


        this.events.emit(
            "start"
        );


        this.requestFrame();

    }


    /* =====================================================
       STOP
    ===================================================== */

    stop() {

        this.running =
            false;


        if (
            this.frameRequest !==
            null
        ) {

            cancelAnimationFrame(
                this.frameRequest
            );

            this.frameRequest =
                null;

        }


        this.processing =
            false;


        this.events.emit(
            "stop"
        );

    }


    /* =====================================================
       REQUEST FRAME
    ===================================================== */

    requestFrame() {

        if (
            !this.running
        ) {

            return;

        }


        this.frameRequest =
            requestAnimationFrame(
                this.boundFrame
            );

    }


    /* =====================================================
       PROCESS FRAME
    ===================================================== */

    async processFrame(
        timestamp
    ) {

        this.frameRequest =
            null;


        if (
            !this.running
        ) {

            return;

        }


        const video =
            this.videoController &&
            this.videoController.video;


        if (!video) {

            this.requestFrame();

            return;

        }


        /*
         * Processing केवल playing video के दौरान.
         */
        if (
            APP_CONFIG.tracking
                .processWhilePlayingOnly &&
            video.paused
        ) {

            this.requestFrame();

            return;

        }


        /*
         * Same video frame को दोबारा process मत करो.
         */
        if (
            video.currentTime ===
            this.lastVideoTime
        ) {

            this.requestFrame();

            return;

        }


        /*
         * Too frequent processing रोकें.
         */
        if (
            timestamp -
            this.lastProcessTime <
            this.processingInterval
        ) {

            this.requestFrame();

            return;

        }


        this.lastProcessTime =
            timestamp;


        this.lastVideoTime =
            video.currentTime;


        if (
            this.processing
        ) {

            this.requestFrame();

            return;

        }


        this.processing =
            true;


        try {

            const detections =
                await this.detect(video);


            this.detections =
                Array.isArray(
                    detections
                )
                    ? detections
                    : [];


            this.frameNumber++;


            this.updateTrackers(
                this.detections
            );


            this.events.emit(
                "frame",
                {

                    frame:
                        this.frameNumber,

                    time:
                        video.currentTime,

                    detections:
                        this.detections

                }
            );

        }
        catch (error) {

            console.error(
                "Tracking frame error:",
                error
            );


            this.events.emit(
                "error",
                error
            );

        }
        finally {

            this.processing =
                false;

            this.requestFrame();

        }

    }


    /* =====================================================
       DETECTION
    ===================================================== */

    async detect(
        video
    ) {

        /*
         * External detector available है तो उसे use करें.
         */
        if (
            this.detector
        ) {

            if (
                typeof this.detector.detectVideo ===
                "function"
            ) {

                return await this.detector.detectVideo(
                    video
                );

            }


            if (
                typeof this.detector.detect ===
                "function"
            ) {

                return await this.detector.detect(
                    video
                );

            }

        }


        /*
         * Global detector fallback.
         */
        if (
            window.objectDetector &&
            typeof window.objectDetector.detectVideo ===
            "function"
        ) {

            return await window.objectDetector.detectVideo(
                video
            );

        }


        /*
         * Detector available नहीं है.
         */
        return [];

    }


    /* =====================================================
       UPDATE TRACKERS
    ===================================================== */

    updateTrackers(
        detections
    ) {

        if (
            !this.trackerManager
        ) {

            return;

        }


        const trackers =
            this.trackerManager.all();


        for (
            const tracker
            of trackers
        ) {

            if (
                !tracker.locked
            ) {

                continue;

            }


            /*
             * EXACT target matching.
             *
             * यहां tracker दूसरे similar object
             * को choose नहीं कर सकता.
             */
            const target =
                this.findLockedTarget(
                    tracker,
                    detections
                );


            if (
                target
            ) {

                tracker.updateFromTarget(
                    target,
                    this.sensitivity
                );


                this.updateHistory(
                    target
                );

            }
            else {

                /*
                 * Target नहीं मिला.
                 *
                 * Tracker अपनी last confirmed
                 * position पर रहेगा.
                 */
                tracker.targetLost();

            }

        }

    }


    /* =====================================================
       FIND LOCKED TARGET
    ===================================================== */

    findLockedTarget(
        tracker,
        detections
    ) {

        if (
            !tracker ||
            !tracker.locked ||
            tracker.targetId === null
        ) {

            return null;

        }


        if (
            !Array.isArray(
                detections
            ) ||
            detections.length === 0
        ) {

            return null;

        }


        /*
         * STEP 1:
         *
         * सबसे पहले EXACT ID match.
         */
        const exactMatches =
            detections.filter(
                detection =>
                    tracker.matchesTarget(
                        detection
                    )
            );


        if (
            exactMatches.length === 0
        ) {

            /*
             * कोई दूसरा object स्वीकार नहीं.
             */
            return null;

        }


        /*
         * Usually एक ही exact ID होगी.
         *
         * अगर detector ने duplicate detection दी,
         * तो continuity score से best exact match चुनेंगे.
         */
        if (
            exactMatches.length === 1
        ) {

            const candidate =
                exactMatches[0];


            if (
                !this.isSafeTarget(
                    tracker,
                    candidate
                )
            ) {

                return null;

            }


            return candidate;

        }


        /*
         * Duplicate exact IDs.
         */
        let best =
            null;

        let bestScore =
            -Infinity;


        for (
            const candidate
            of exactMatches
        ) {

            if (
                !this.isSafeTarget(
                    tracker,
                    candidate
                )
            ) {

                continue;

            }


            const score =
                this.calculateContinuityScore(
                    tracker,
                    candidate
                );


            if (
                score >
                bestScore
            ) {

                bestScore =
                    score;

                best =
                    candidate;

            }

        }


        return best;

    }


    /* =====================================================
       SAFETY CHECK
    ===================================================== */

    isSafeTarget(
        tracker,
        candidate
    ) {

        if (
            !tracker ||
            !candidate
        ) {

            return false;

        }


        /*
         * Target ID must match EXACTLY.
         */
        if (
            !tracker.matchesTarget(
                candidate
            )
        ) {

            return false;

        }


        /*
         * Target center.
         */
        const center =
            tracker.getTargetCenter(
                candidate
            );


        if (!center) {

            return false;

        }


        /*
         * अगर last position available है,
         * तो अचानक बहुत बड़ा jump reject करें.
         *
         * इससे एक similar object के पास jump
         * करने की संभावना और कम होती है.
         */
        if (
            tracker.lastTargetCenter
        ) {

            const previous =
                tracker.lastTargetCenter;


            const dx =
                center.x -
                previous.x;


            const dy =
                center.y -
                previous.y;


            /*
             * normalized coordinates हैं,
             * इसलिए maxJumpDistance को normalized
             * range में convert करें.
             */
            const maxJump =
                APP_CONFIG.tracker.maxJumpDistance /
                1000;


            const movement =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            /*
             * बहुत बड़ा jump केवल तभी allow करें
             * जब target history reliable हो.
             */
            if (
                movement >
                maxJump
            ) {

                /*
                 * अगर detection लगातार उसी target ID
                 * के साथ आ रही है तो jump allow करें.
                 */
                const history =
                    this.targetHistory.get(
                        String(
                            tracker.targetId
                        )
                    );


                if (
                    !history ||
                    history.frames <
                    3
                ) {

                    return false;

                }

            }

        }


        return true;

    }


    /* =====================================================
       CONTINUITY SCORE
    ===================================================== */

    calculateContinuityScore(
        tracker,
        candidate
    ) {

        let score =
            0;


        /*
         * ID exact match.
         */
        if (
            tracker.matchesTarget(
                candidate
            )
        ) {

            score +=
                APP_CONFIG.tracking
                    .association
                    .idWeight;

        }
        else {

            return -Infinity;

        }


        /*
         * Position continuity.
         */
        if (
            tracker.lastTargetCenter
        ) {

            const center =
                tracker.getTargetCenter(
                    candidate
                );


            if (center) {

                const distanceValue =
                    pointDistance(
                        center,
                        tracker.lastTargetCenter
                    );


                const positionScore =
                    Math.max(
                        0,
                        1 -
                        distanceValue
                    );


                score +=
                    positionScore *
                    APP_CONFIG.tracking
                        .association
                        .positionWeight;

            }

        }


        /*
         * Confidence.
         */
        const confidence =
            clamp(
                toNumber(
                    candidate.confidence,
                    0
                ),
                0,
                1
            );


        score +=
            confidence *
            0.10;


        return score;

    }


    /* =====================================================
       HISTORY
    ===================================================== */

    updateHistory(
        target
    ) {

        if (!target) {
            return;
        }


        const id =
            target.id ??
            target.trackingId ??
            target.trackId ??
            null;


        if (
            id === null ||
            id === undefined
        ) {

            return;

        }


        const key =
            String(id);


        const previous =
            this.targetHistory.get(
                key
            );


        this.targetHistory.set(
            key,
            {

                frames:
                    previous
                        ? previous.frames + 1
                        : 1,

                lastSeenFrame:
                    this.frameNumber,

                center:
                    deepClone(
                        target.center ||
                        rectCenter(
                            target.rect
                        )
                    ),

                rect:
                    target.rect
                        ? deepClone(
                            target.rect
                        )
                        : null

            }
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    reset() {

        this.stop();


        this.detections =
            [];


        this.targetHistory.clear();


        this.lastVideoTime =
            -1;


        this.frameNumber =
            0;


        this.lastProcessTime =
            0;


        this.events.emit(
            "reset"
        );

    }


    /* =====================================================
       GET STATUS
    ===================================================== */

    getStatus() {

        return {

            running:
                this.running,

            processing:
                this.processing,

            frame:
                this.frameNumber,

            detections:
                this.detections.length,

            sensitivity:
                this.sensitivity

        };

    }

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

if (
    typeof window !==
    "undefined"
) {

    window.TrackingEngine =
        TrackingEngine;

}


/* =========================================================
   GLOBAL INSTANCE
========================================================= */

let trackingEngine =
    null;


function initializeTrackingEngine() {

    if (
        trackingEngine
    ) {

        return trackingEngine;

    }


    trackingEngine =
        new TrackingEngine({

            videoController:
                window.videoController ||
                null,

            trackerManager:
                window.trackerManager ||
                null

        });


    trackingEngine.init();


    window.trackingEngine =
        trackingEngine;


    return trackingEngine;

}


/* =========================================================
   AUTO INIT
========================================================= */

if (
    typeof document !==
    "undefined"
) {

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeTrackingEngine,
            {
                once: true
            }
        );

    }
    else {

        initializeTrackingEngine();

    }

}