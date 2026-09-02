"use strict";

/*
 * =========================================================
 * tracking-worker.js
 * =========================================================
 *
 * Frame processing helper.
 *
 * यह file tracking engine को detections normalize करने,
 * target identity maintain करने और frame data तैयार करने
 * में मदद करती है.
 *
 * IMPORTANT:
 * Locked tracker के लिए targetId कभी बदलता नहीं है.
 * =========================================================
 */

class TrackingWorker {

    constructor(options = {}) {

        this.targetMemory = new Map();

        this.frameNumber = 0;

        this.maxHistory =
            Number.isFinite(options.maxHistory)
                ? options.maxHistory
                : 30;

    }


    /* =====================================================
       PROCESS FRAME
    ===================================================== */

    processFrame(
        detections,
        videoWidth,
        videoHeight
    ) {

        this.frameNumber++;


        if (
            !Array.isArray(detections)
        ) {

            return [];

        }


        const normalized = [];


        for (
            const detection
            of detections
        ) {

            const target =
                this.normalizeDetection(
                    detection,
                    videoWidth,
                    videoHeight
                );


            if (!target) {
                continue;
            }


            normalized.push(
                target
            );


            this.rememberTarget(
                target
            );

        }


        return normalized;

    }


    /* =====================================================
       NORMALIZE DETECTION
    ===================================================== */

    normalizeDetection(
        detection,
        videoWidth,
        videoHeight
    ) {

        if (!detection) {
            return null;
        }


        /*
         * Detector की stable ID.
         *
         * अलग-अलग detector implementations में
         * अलग नाम हो सकता है.
         */
        const rawId =
            detection.id ??
            detection.trackingId ??
            detection.trackId ??
            detection.objectId ??
            null;


        /*
         * बिना stable ID के detection को locked
         * tracking के लिए valid नहीं माना जाएगा.
         */
        if (
            rawId === null ||
            rawId === undefined
        ) {

            return null;

        }


        const id =
            String(rawId);


        const rect =
            this.extractRect(
                detection
            );


        if (!rect) {
            return null;
        }


        let center =
            this.extractCenter(
                detection,
                rect
            );


        if (!center) {

            center =
                {

                    x:
                        (
                            rect.left +
                            rect.right
                        ) / 2,

                    y:
                        (
                            rect.top +
                            rect.bottom
                        ) / 2

                };

        }


        /*
         * Detector pixel coordinates दे रहा है
         * तो उन्हें normalized 0..1 में बदलें.
         */
        if (
            videoWidth > 0 &&
            videoHeight > 0 &&
            (
                Math.abs(center.x) > 1 ||
                Math.abs(center.y) > 1
            )
        ) {

            center.x /=
                videoWidth;

            center.y /=
                videoHeight;

        }


        center.x =
            clamp(
                center.x,
                0,
                1
            );


        center.y =
            clamp(
                center.y,
                0,
                1
            );


        const confidence =
            clamp(
                Number(
                    detection.confidence ??
                    detection.score ??
                    1
                ),
                0,
                1
            );


        return {

            id,

            trackingId:
                id,

            center,

            rect,

            confidence,

            label:
                detection.label ??
                detection.className ??
                detection.category ??
                null,

            frame:
                this.frameNumber

        };

    }


    /* =====================================================
       EXTRACT RECT
    ===================================================== */

    extractRect(
        detection
    ) {

        const source =
            detection.rect ??
            detection.boundingBox ??
            detection.box ??
            detection.bounds ??
            detection;


        if (!source) {
            return null;
        }


        let left =
            Number(
                source.left ??
                source.x ??
                0
            );


        let top =
            Number(
                source.top ??
                source.y ??
                0
            );


        let width =
            Number(
                source.width ??
                0
            );


        let height =
            Number(
                source.height ??
                0
            );


        let right =
            Number(
                source.right
            );


        let bottom =
            Number(
                source.bottom
            );


        if (
            !Number.isFinite(right)
        ) {

            right =
                left +
                width;

        }


        if (
            !Number.isFinite(bottom)
        ) {

            bottom =
                top +
                height;

        }


        if (
            !Number.isFinite(left) ||
            !Number.isFinite(top) ||
            !Number.isFinite(right) ||
            !Number.isFinite(bottom)
        ) {

            return null;

        }


        /*
         * अगर detector pixel coordinates देता है,
         * तो rect normalized किया जाएगा.
         *
         * यह check center normalization के साथ
         * consistent है.
         */
        return {

            left,

            top,

            right,

            bottom,

            width:
                Math.max(
                    0,
                    right - left
                ),

            height:
                Math.max(
                    0,
                    bottom - top
                )

        };

    }


    /* =====================================================
       EXTRACT CENTER
    ===================================================== */

    extractCenter(
        detection,
        rect
    ) {

        const center =
            detection.center ??
            detection.position ??
            null;


        if (
            center &&
            Number.isFinite(
                Number(center.x)
            ) &&
            Number.isFinite(
                Number(center.y)
            )
        ) {

            return {

                x:
                    Number(
                        center.x
                    ),

                y:
                    Number(
                        center.y
                    )

            };

        }


        if (
            rect
        ) {

            return {

                x:
                    (
                        rect.left +
                        rect.right
                    ) / 2,

                y:
                    (
                        rect.top +
                        rect.bottom
                    ) / 2

            };

        }


        return null;

    }


    /* =====================================================
       REMEMBER TARGET
    ===================================================== */

    rememberTarget(
        target
    ) {

        if (!target) {
            return;
        }


        const id =
            String(
                target.id
            );


        let history =
            this.targetMemory.get(
                id
            );


        if (!history) {

            history = [];

            this.targetMemory.set(
                id,
                history
            );

        }


        history.push(
            {

                frame:
                    target.frame,

                center:
                    {
                        x:
                            target.center.x,

                        y:
                            target.center.y
                    },

                confidence:
                    target.confidence

            }
        );


        if (
            history.length >
            this.maxHistory
        ) {

            history.splice(
                0,
                history.length -
                this.maxHistory
            );

        }

    }


    /* =====================================================
       GET TARGET HISTORY
    ===================================================== */

    getTargetHistory(
        id
    ) {

        const history =
            this.targetMemory.get(
                String(id)
            );


        if (!history) {
            return [];
        }


        return history.map(
            item =>
                ({
                    ...item,
                    center:
                        {
                            ...item.center
                        }
                })
        );

    }


    /* =====================================================
       GET LAST TARGET
    ===================================================== */

    getLastTarget(
        id
    ) {

        const history =
            this.getTargetHistory(
                id
            );


        if (
            history.length === 0
        ) {

            return null;

        }


        return history[
            history.length - 1
        ];

    }


    /* =====================================================
       HAS TARGET
    ===================================================== */

    hasTarget(
        id
    ) {

        return this.targetMemory.has(
            String(id)
        );

    }


    /* =====================================================
       CLEAR TARGET
    ===================================================== */

    clearTarget(
        id
    ) {

        this.targetMemory.delete(
            String(id)
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    reset() {

        this.targetMemory.clear();

        this.frameNumber =
            0;

    }

}


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function clamp(
    value,
    min,
    max
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return min;

    }


    return Math.min(
        max,
        Math.max(
            min,
            number
        )
    );

}


/* =========================================================
   EXPORT
========================================================= */

if (
    typeof window !==
    "undefined"
) {

    window.TrackingWorker =
        TrackingWorker;

}