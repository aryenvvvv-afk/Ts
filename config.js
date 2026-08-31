/* =========================================
   VIDEO OBJECT TRACKER
   config.js
   FILE 3 / 10
========================================= */

"use strict";


window.TrackerConfig = {

    /* =====================================
       APPLICATION
    ====================================== */

    app: {

        name: "Video Object Tracker",

        version: "2.0.0",

        debug: true

    },


    /* =====================================
       TRACKER
    ====================================== */

    tracker: {

        defaultStyle: "square",

        defaultColor: "#00ff66",

        defaultSize: 120,

        minSize: 20,

        maxSize: 500,

        resizeStep: 1,

        borderWidth: 3,

        maxTrackers: Infinity

    },


    /* =====================================
       TRACKING
    ====================================== */

    tracking: {

        /*
         * 0 = slower / smoother
         * 1 = faster / snappier
         */

        defaultSensitivity: 0.65,

        minSensitivity: 0,

        maxSensitivity: 1,


        /*
         * Initial radius used when locking
         * a tracker to an object.
         */

        searchRadius: 120,


        /*
         * How many frames an object can remain
         * in memory when temporarily lost.
         */

        memoryFrames: 20,


        /*
         * Minimum detected object size.
         */

        minTargetSize: 8,


        /*
         * Maximum number of detected targets
         * processed per frame.
         */

        maxTargets: 100,


        /*
         * Prevent a locked tracker from jumping
         * to a completely different object.
         */

        identityThreshold: 0.35,


        /*
         * Position matching weight.
         */

        positionWeight: 0.70,


        /*
         * Size matching weight.
         */

        sizeWeight: 0.20,


        /*
         * Motion matching weight.
         */

        motionWeight: 0.10,


        /*
         * Number of frames used for smoothing.
         */

        smoothingFrames: 4

    },


    /* =====================================
       VIDEO
    ====================================== */

    video: {

        /*
         * Video must remain inside the stage.
         */

        objectFit: "contain",

        autoplay: false,

        muted: true,

        playsInline: true,


        /*
         * Maximum processing width.
         *
         * Lower value = faster tracking.
         */

        processingWidth: 640,


        /*
         * Maximum processing height.
         */

        processingHeight: 640,


        /*
         * Video frame processing rate.
         */

        targetFPS: 30

    },


    /* =====================================
       OVERLAY
    ====================================== */

    overlay: {

        enabled: true,

        pointerEvents: true,

        responsive: true,

        maintainAspectRatio: true,

        coordinateMode: "video"

    },


    /* =====================================
       UI
    ====================================== */

    ui: {

        editModeOnStart: true,

        showStatus: true,

        showTrackerCount: true,

        showSelectedTracker: true,

        showLockStatus: true,

        showTime: true

    },


    /* =====================================
       TRACKER STYLES
    ====================================== */

    styles: {

        square: {

            name: "Square",

            type: "square"

        },


        circle: {

            name: "Circle",

            type: "circle"

        },


        triangle: {

            name: "Triangle",

            type: "triangle"

        }

    },


    /* =====================================
       COLORS
    ====================================== */

    colors: [

        "#00ff66",

        "#ff3333",

        "#3399ff",

        "#ffff00",

        "#ff00ff",

        "#00ffff",

        "#ffffff",

        "#ff8800"

    ],


    /* =====================================
       KEYBOARD
    ====================================== */

    keyboard: {

        deleteTracker: [
            "Delete",
            "Backspace"
        ],

        escape: "Escape",

        playPause: " ",

        editMode: "e"

    },


    /* =====================================
       PERFORMANCE
    ====================================== */

    performance: {

        useRequestVideoFrameCallback:
            true,

        useWorker:
            true,

        maximumProcessingTime:
            30,

        skipFramesWhenBusy:
            true

    },


    /* =====================================
       GET CONFIG VALUE
    ====================================== */

    get(
        path,
        fallback = undefined
    ) {

        const parts =
            String(path)
                .split(".");


        let current =
            this;


        for (
            const part of parts
        ) {

            if (
                current === null ||
                current === undefined
            ) {

                return fallback;

            }


            if (
                !Object.prototype
                    .hasOwnProperty
                    .call(
                        current,
                        part
                    )
            ) {

                return fallback;

            }


            current =
                current[part];

        }


        return current;

    },


    /* =====================================
       SET CONFIG VALUE
    ====================================== */

    set(
        path,
        value
    ) {

        const parts =
            String(path)
                .split(".");


        if (
            parts.length === 0
        ) {

            return false;

        }


        let current =
            this;


        for (
            let i = 0;
            i <
            parts.length - 1;
            i++
        ) {

            const part =
                parts[i];


            if (
                typeof current[part] !==
                "object" ||
                current[part] === null
            ) {

                current[part] =
                    {};

            }


            current =
                current[part];

        }


        current[
            parts[
                parts.length - 1
            ]
        ] =
            value;


        return true;

    },


    /* =====================================
       RESET
    ====================================== */

    reset() {

        /*
         * Configuration is intentionally
         * kept static during normal use.
         */

        return true;

    }

};