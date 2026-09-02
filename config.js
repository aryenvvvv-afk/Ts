"use strict";

/*
 * =========================================================
 * Object Tracker
 * config.js
 *
 * Central configuration file.
 * बाकी सभी JS files इसी configuration को use करेंगे.
 * =========================================================
 */

const APP_CONFIG = {

    /* =====================================================
       APP
    ===================================================== */

    app: {

        name: "Object Tracker",

        version: "2.0.0",

        debug: true

    },


    /* =====================================================
       VIDEO
    ===================================================== */

    video: {

        /*
         * Video को browser के available size के अंदर
         * रखा जाएगा.
         */
        objectFit: "contain",

        /*
         * Tracking processing interval.
         * Lower value = अधिक frequent processing.
         */
        processingInterval: 33,

        /*
         * Default FPS fallback.
         */
        defaultFPS: 30,

        /*
         * Maximum video dimensions used internally.
         * Original uploaded video को बदला नहीं जाता.
         */
        maxProcessingWidth: 1280,

        maxProcessingHeight: 720

    },


    /* =====================================================
       TRACKERS
    ===================================================== */

    tracker: {

        /*
         * Unlimited trackers.
         */
        maxTrackers: Infinity,

        /*
         * Default tracker.
         */
        defaultShape: "square",

        defaultColor: "#ff0000",

        defaultSize: 90,

        minSize: 25,

        maxSize: 500,

        borderWidth: 3,


        /*
         * Available shapes.
         */
        shapes: [
            "square",
            "circle",
            "triangle"
        ],


        /*
         * Position smoothing.
         *
         * 0 = very slow
         * 1 = very fast
         */
        defaultSensitivity: 0.65,

        minSensitivity: 0,

        maxSensitivity: 1,


        /*
         * Tracker target lost होने पर दूसरे object
         * को पकड़ने की अनुमति नहीं है.
         */
        allowTargetSwitch: false,


        /*
         * Target को temporarily खोने पर tracker
         * कितने frames तक last known position पर रहेगा.
         */
        maxLostFrames: 12,


        /*
         * Target matching.
         *
         * Locked tracker केवल अपने assigned target
         * की identity / position को follow करेगा.
         */
        useTargetIdentity: true,

        usePositionContinuity: true,

        useSizeContinuity: true,

        useAppearanceContinuity: true,


        /*
         * दूसरे similar object पर jump रोकने के लिए
         * maximum allowed movement between frames.
         */
        maxJumpDistance: 220,


        /*
         * Search radius बढ़ाने/घटाने के लिए sensitivity.
         */
        minLockRadius: 35,

        maxLockRadius: 180

    },


    /* =====================================================
       TRACKING ENGINE
    ===================================================== */

    tracking: {

        enabled: true,

        autoStartAfterLock: true,

        processWhilePlayingOnly: true,


        /*
         * Object detector settings.
         */
        detector: {

            mode: "video",

            maxObjects: 50,

            minConfidence: 0.25,

            minTrackingConfidence: 0.20

        },


        /*
         * Target association.
         */
        association: {

            /*
             * Target ID को सबसे ज्यादा importance.
             */
            idWeight: 0.50,

            /*
             * Previous position से distance.
             */
            positionWeight: 0.25,

            /*
             * Object size similarity.
             */
            sizeWeight: 0.10,

            /*
             * Visual similarity.
             */
            appearanceWeight: 0.15,


            /*
             * Minimum score required to accept
             * a detection as the locked target.
             */
            minimumScore: 0.58,


            /*
             * अगर score इससे कम है तो tracker
             * target को lost मानेगा.
             */
            lostScore: 0.45

        }

    },


    /* =====================================================
       COORDINATES
    ===================================================== */

    coordinates: {

        /*
         * All tracker positions are stored in
         * VIDEO-NATIVE coordinates.
         *
         * इससे mobile / desktop / resize के बाद
         * tracker की actual position नहीं बदलती.
         */
        coordinateSpace: "video",

        useNormalizedCoordinates: true,

        clampToVideo: true,

        accountForObjectFit: true,

        accountForLetterbox: true

    },


    /* =====================================================
       EDIT MODE
    ===================================================== */

    editor: {

        enabledByDefault: false,

        dragEnabled: true,

        resizeEnabled: true,

        deleteEnabled: true,

        colorEnabled: true,

        shapeEnabled: true,

        lockEnabled: true,

        unlockEnabled: true,

        multiTrackerEnabled: true,


        /*
         * नया tracker video के center में
         * बनाया जाएगा.
         */
        createAtCenter: true,


        /*
         * Tracker को object पर drop करने के बाद
         * automatic lock नहीं होगा.
         *
         * User को manually Lock दबाना होगा.
         */
        autoLockOnDrop: false

    },


    /* =====================================================
       UI
    ===================================================== */

    ui: {

        elements: {

            video: "video",

            videoInput: "videoInput",

            videoStage: "videoStage",

            trackerLayer: "trackerLayer",

            emptyState: "emptyState",

            videoLoading: "videoLoading",

            videoError: "videoError",

            trackingStatus: "trackingStatus",

            editModeButton: "editModeButton",

            addTrackerButton: "addTrackerButton",

            playButton: "playButton",

            pauseButton: "pauseButton",

            stopButton: "stopButton",

            lockButton: "lockButton",

            unlockButton: "unlockButton",

            deleteButton: "deleteButton",

            resetButton: "resetButton",

            trackerShape: "trackerShape",

            trackerColor: "trackerColor",

            sensitivity: "sensitivity",

            sensitivityValue: "sensitivityValue",

            trackerCount: "trackerCount",

            selectedTracker: "selectedTracker",

            lockedTracker: "lockedTracker",

            confidenceValue: "confidenceValue",

            editorHelp: "editorHelp"

        }

    },


    /* =====================================================
       WORKER
    ===================================================== */

    worker: {

        enabled: true,

        file: "tracking-worker.js",

        terminateOnReset: true

    },


    /* =====================================================
       DEBUG
    ===================================================== */

    debug: {

        showTrackingBoxes: false,

        showTargetId: false,

        showConfidence: false,

        logTracking: false,

        logCoordinates: false,

        logVideoEvents: false

    }

};


/* =========================================================
   DEFAULT CONFIG EXPORT
========================================================= */

if (
    typeof window !== "undefined"
) {

    window.APP_CONFIG = APP_CONFIG;

}


/* =========================================================
   COMMON CONFIG ALIAS
========================================================= */

if (
    typeof globalThis !== "undefined"
) {

    globalThis.APP_CONFIG = APP_CONFIG;

}


/* =========================================================
   SAFE CONFIG HELPERS
========================================================= */

const Config = {

    get(path, fallback = undefined) {

        const parts =
            String(path)
                .split(".")
                .filter(Boolean);


        let value =
            APP_CONFIG;


        for (
            const part of parts
        ) {

            if (
                value === null ||
                value === undefined ||
                !Object.prototype.hasOwnProperty.call(
                    value,
                    part
                )
            ) {

                return fallback;

            }


            value =
                value[part];

        }


        return value;

    },


    set(path, value) {

        const parts =
            String(path)
                .split(".")
                .filter(Boolean);


        if (!parts.length) {
            return false;
        }


        let target =
            APP_CONFIG;


        for (
            let i = 0;
            i < parts.length - 1;
            i++
        ) {

            const part =
                parts[i];


            if (
                !target[part] ||
                typeof target[part] !== "object"
            ) {

                target[part] = {};

            }


            target =
                target[part];

        }


        target[
            parts[parts.length - 1]
        ] = value;


        return true;

    },


    trackerShapes() {

        return [
            ...APP_CONFIG.tracker.shapes
        ];

    },


    clampSensitivity(value) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number)
        ) {

            return APP_CONFIG
                .tracker
                .defaultSensitivity;

        }


        return Math.max(
            APP_CONFIG.tracker.minSensitivity,

            Math.min(
                APP_CONFIG.tracker.maxSensitivity,
                number
            )
        );

    },


    clampTrackerSize(value) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number)
        ) {

            return APP_CONFIG
                .tracker
                .defaultSize;

        }


        return Math.max(
            APP_CONFIG.tracker.minSize,

            Math.min(
                APP_CONFIG.tracker.maxSize,
                number
            )
        );

    },


    isValidShape(shape) {

        return APP_CONFIG
            .tracker
            .shapes
            .includes(
                shape
            );

    }

};


/* =========================================================
   GLOBAL CONFIG HELPER
========================================================= */

if (
    typeof window !== "undefined"
) {

    window.Config =
        Config;

}


if (
    typeof globalThis !== "undefined"
) {

    globalThis.Config =
        Config;

}