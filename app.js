"use strict";

/*
 * =========================================================
 * app.js
 * Main application controller
 * =========================================================
 */

class ObjectTrackerApp {

    constructor() {
        this.videoController = null;
        this.trackerManager = null;
        this.trackingEngine = null;

        this.editMode = true;
        this.selectedShape = "square";
        this.selectedColor = "#00ff66";

        this.initialized = false;
    }


    /* =====================================================
       INIT
    ===================================================== */

    init() {

        if (this.initialized) {
            return;
        }

        this.videoController =
            window.videoController ||
            (
                typeof initializeVideoController === "function"
                    ? initializeVideoController()
                    : null
            );

        this.trackerManager =
            window.trackerManager ||
            (
                typeof initializeTrackerManager === "function"
                    ? initializeTrackerManager()
                    : null
            );

        this.trackingEngine =
            window.trackingEngine ||
            (
                typeof initializeTrackingEngine === "function"
                    ? initializeTrackingEngine()
                    : null
            );

        if (this.trackingEngine) {
            this.trackingEngine.setVideoController(
                this.videoController
            );

            this.trackingEngine.setTrackerManager(
                this.trackerManager
            );
        }

        this.bindControls();
        this.bindVideoEvents();
        this.bindTrackerEvents();

        this.initialized = true;

        this.updateStatus("Ready");
    }


    /* =====================================================
       CONTROLS
    ===================================================== */

    bindControls() {

        this.onClick(
            ["#playBtn", "#play"],
            () => {

                if (!this.videoController) {
                    return;
                }

                this.videoController.play();

                if (this.trackingEngine) {
                    this.trackingEngine.start();
                }
            }
        );


        this.onClick(
            ["#pauseBtn", "#pause"],
            () => {

                if (this.videoController) {
                    this.videoController.pause();
                }

                this.updateStatus("Paused");
            }
        );


        this.onClick(
            ["#stopBtn", "#stop"],
            () => {

                if (this.videoController) {
                    this.videoController.stop();
                }

                if (this.trackingEngine) {
                    this.trackingEngine.reset();
                }

                this.updateStatus("Stopped");
            }
        );


        this.onClick(
            ["#resetBtn", "#reset"],
            () => {

                if (this.trackerManager) {
                    this.trackerManager.clear();
                }

                if (this.trackingEngine) {
                    this.trackingEngine.reset();
                }

                this.updateStatus("Reset");
            }
        );


        this.onClick(
            ["#editBtn", "#editModeBtn"],
            () => {

                this.editMode =
                    !this.editMode;

                document.body.classList.toggle(
                    "edit-mode",
                    this.editMode
                );

                this.updateStatus(
                    this.editMode
                        ? "Edit mode"
                        : "Tracking mode"
                );
            }
        );


        this.onClick(
            ["#lockBtn", "#lock"],
            () => {

                this.lockSelectedTracker();
            }
        );


        this.onClick(
            ["#unlockBtn", "#unlock"],
            () => {

                const tracker =
                    this.getSelectedTracker();

                if (!tracker) {
                    this.updateStatus(
                        "Select a tracker first"
                    );
                    return;
                }

                if (
                    typeof tracker.unlock ===
                    "function"
                ) {
                    tracker.unlock();
                }

                this.updateStatus(
                    "Tracker unlocked"
                );
            }
        );


        this.onClick(
            ["#deleteBtn", "#delete"],
            () => {

                if (!this.trackerManager) {
                    return;
                }

                const tracker =
                    this.getSelectedTracker();

                if (!tracker) {
                    return;
                }

                this.trackerManager.remove(
                    tracker.id
                );

                this.updateStatus(
                    "Tracker deleted"
                );
            }
        );


        this.bindShapeButtons();
        this.bindColorPicker();
        this.bindSensitivity();
    }


    /* =====================================================
       CLICK HELPER
    ===================================================== */

    onClick(
        selectors,
        callback
    ) {

        for (
            const selector of selectors
        ) {

            const element =
                document.querySelector(
                    selector
                );

            if (!element) {
                continue;
            }

            element.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    callback(event);
                }
            );

            return;
        }
    }


    /* =====================================================
       SHAPES
    ===================================================== */

    bindShapeButtons() {

        const buttons = [
            ["#squareBtn", "square"],
            ["#circleBtn", "circle"],
            ["#triangleBtn", "triangle"]
        ];

        for (
            const [selector, shape]
            of buttons
        ) {

            const button =
                document.querySelector(
                    selector
                );

            if (!button) {
                continue;
            }

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    this.selectedShape =
                        shape;

                    const tracker =
                        this.getSelectedTracker();

                    if (
                        tracker &&
                        !tracker.locked &&
                        typeof tracker.setShape ===
                        "function"
                    ) {

                        tracker.setShape(
                            shape
                        );
                    }

                    this.updateShapeButtons();
                }
            );
        }

        this.updateShapeButtons();
    }


    updateShapeButtons() {

        const map = {
            square:
                document.querySelector(
                    "#squareBtn"
                ),

            circle:
                document.querySelector(
                    "#circleBtn"
                ),

            triangle:
                document.querySelector(
                    "#triangleBtn"
                )
        };


        Object.keys(map).forEach(
            shape => {

                const button =
                    map[shape];

                if (!button) {
                    return;
                }

                button.classList.toggle(
                    "active",
                    shape ===
                    this.selectedShape
                );
            }
        );
    }


    /* =====================================================
       COLOR
    ===================================================== */

    bindColorPicker() {

        const input =
            document.querySelector(
                "#colorPicker"
            ) ||
            document.querySelector(
                "#trackerColor"
            );

        if (!input) {
            return;
        }

        this.selectedColor =
            input.value ||
            this.selectedColor;


        input.addEventListener(
            "input",
            () => {

                const tracker =
                    this.getSelectedTracker();

                if (
                    tracker &&
                    !tracker.locked &&
                    typeof tracker.setColor ===
                    "function"
                ) {

                    tracker.setColor(
                        input.value
                    );
                }

                this.selectedColor =
                    input.value;
            }
        );
    }


    /* =====================================================
       SENSITIVITY
    ===================================================== */

    bindSensitivity() {

        const input =
            document.querySelector(
                "#sensitivity"
            ) ||
            document.querySelector(
                "#sensitivitySlider"
            );

        if (!input) {
            return;
        }

        const update =
            () => {

                const value =
                    Math.max(
                        0,
                        Math.min(
                            1,
                            Number(
                                input.value
                            )
                        )
                    );

                if (
                    this.trackingEngine
                ) {

                    this.trackingEngine
                        .setSensitivity(
                            value
                        );
                }

                const label =
                    document.querySelector(
                        "#sensitivityValue"
                    );

                if (label) {
                    label.textContent =
                        value.toFixed(2);
                }
            };


        input.addEventListener(
            "input",
            update
        );

        update();
    }


    /* =====================================================
       LOCK TRACKER
    ===================================================== */

    lockSelectedTracker() {

        const tracker =
            this.getSelectedTracker();


        if (!tracker) {

            this.updateStatus(
                "Select a tracker first"
            );

            return;
        }


        if (tracker.locked) {

            this.updateStatus(
                "Tracker is already locked"
            );

            return;
        }


        const detections =
            this.trackingEngine
                ?.detections ||
            [];


        if (
            detections.length === 0
        ) {

            this.updateStatus(
                "No object detected"
            );

            return;
        }


        const target =
            this.findTargetAtTracker(
                tracker,
                detections
            );


        if (!target) {

            this.updateStatus(
                "Place tracker directly on the object"
            );

            return;
        }


        /*
         * सबसे महत्वपूर्ण हिस्सा:
         *
         * Lock के समय जिस object की ID मिली,
         * वही ID tracker में permanently store होगी.
         *
         * बाद में दूसरा glass पास आ जाए,
         * tracker उसकी ID स्वीकार नहीं करेगा.
         */

        if (
            typeof tracker.lock ===
            "function"
        ) {

            const success =
                tracker.lock(
                    target
                );

            if (success) {

                this.updateStatus(
                    `Locked to object ${target.id}`
                );

                return;
            }
        }


        this.updateStatus(
            "Unable to lock tracker"
        );
    }


    /* =====================================================
       FIND TARGET
    ===================================================== */

    findTargetAtTracker(
        tracker,
        detections
    ) {

        let closest =
            null;

        let closestDistance =
            Infinity;


        for (
            const detection
            of detections
        ) {

            const center =
                this.getDetectionCenter(
                    detection
                );

            if (!center) {
                continue;
            }


            const dx =
                center.x -
                tracker.x;


            const dy =
                center.y -
                tracker.y;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance <
                closestDistance
            ) {

                closestDistance =
                    distance;

                closest =
                    detection;
            }
        }


        /*
         * Lock radius.
         *
         * बहुत दूर object पर accidentally lock
         * नहीं होगा.
         */

        const radius =
            (
                window.APP_CONFIG
                    ?.tracker
                    ?.lockRadius ??
                150
            ) / 1000;


        if (
            closestDistance >
            radius
        ) {

            return null;
        }


        /*
         * Stable ID जरूरी है.
         *
         * अगर detector target ID नहीं देता,
         * तो tracker को blind lock नहीं करेंगे.
         */

        const id =
            closest?.id ??
            closest?.trackingId ??
            closest?.trackId ??
            closest?.objectId;


        if (
            id === null ||
            id === undefined
        ) {

            return null;
        }


        return closest;
    }


    /* =====================================================
       DETECTION CENTER
    ===================================================== */

    getDetectionCenter(
        detection
    ) {

        if (
            detection?.center &&
            Number.isFinite(
                Number(
                    detection.center.x
                )
            ) &&
            Number.isFinite(
                Number(
                    detection.center.y
                )
            )
        ) {

            return {

                x:
                    Number(
                        detection.center.x
                    ),

                y:
                    Number(
                        detection.center.y
                    )
            };
        }


        const rect =
            detection?.rect ||
            detection?.boundingBox ||
            detection?.box;


        if (!rect) {
            return null;
        }


        const left =
            Number(
                rect.left ??
                rect.x ??
                0
            );


        const top =
            Number(
                rect.top ??
                rect.y ??
                0
            );


        const width =
            Number(
                rect.width ??
                0
            );


        const height =
            Number(
                rect.height ??
                0
            );


        return {

            x:
                left +
                width / 2,

            y:
                top +
                height / 2
        };
    }


    /* =====================================================
       VIDEO EVENTS
    ===================================================== */

    bindVideoEvents() {

        if (
            !this.videoController ||
            !this.videoController.events
        ) {
            return;
        }


        this.videoController.events.on(
            "loaded",
            () => {

                this.updateStatus(
                    "Video loaded"
                );
            }
        );


        this.videoController.events.on(
            "play",
            () => {

                if (
                    this.trackingEngine
                ) {

                    this.trackingEngine.start();
                }

                this.updateStatus(
                    "Tracking"
                );
            }
        );


        this.videoController.events.on(
            "pause",
            () => {

                this.updateStatus(
                    "Paused"
                );
            }
        );


        this.videoController.events.on(
            "ended",
            () => {

                if (
                    this.trackingEngine
                ) {

                    this.trackingEngine.stop();
                }

                this.updateStatus(
                    "Finished"
                );
            }
        );


        this.videoController.events.on(
            "error",
            error => {

                this.updateStatus(
                    error?.message ||
                    "Video error"
                );
            }
        );
    }


    /* =====================================================
       TRACKER EVENTS
    ===================================================== */

    bindTrackerEvents() {

        if (
            !this.trackerManager ||
            !this.trackerManager.events
        ) {
            return;
        }


        this.trackerManager.events.on(
            "select",
            tracker => {

                if (!tracker) {
                    return;
                }

                this.updateStatus(
                    tracker.locked
                        ? `Locked: ${tracker.targetId}`
                        : "Tracker selected"
                );
            }
        );


        this.trackerManager.events.on(
            "lock",
            tracker => {

                this.updateStatus(
                    `Locked to object ${tracker.targetId}`
                );
            }
        );


        this.trackerManager.events.on(
            "unlock",
            () => {

                this.updateStatus(
                    "Tracker unlocked"
                );
            }
        );


        this.trackerManager.events.on(
            "remove",
            () => {

                this.updateStatus(
                    "Tracker deleted"
                );
            }
        );
    }


    /* =====================================================
       GET SELECTED TRACKER
    ===================================================== */

    getSelectedTracker() {

        if (
            !this.trackerManager
        ) {

            return null;
        }


        if (
            typeof this.trackerManager.selected ===
            "function"
        ) {

            return this.trackerManager.selected();
        }


        return null;
    }


    /* =====================================================
       ADD TRACKER
    ===================================================== */

    addTracker(
        options = {}
    ) {

        if (
            !this.trackerManager ||
            typeof this.trackerManager.add !==
            "function"
        ) {

            return null;
        }


        const tracker =
            this.trackerManager.add({

                shape:
                    options.shape ||
                    this.selectedShape,

                color:
                    options.color ||
                    this.selectedColor,

                size:
                    options.size ||
                    120,

                x:
                    options.x ??
                    0.5,

                y:
                    options.y ??
                    0.5
            });


        if (tracker) {

            this.trackerManager.select(
                tracker.id
            );

            this.updateStatus(
                "Tracker added"
            );
        }


        return tracker;
    }


    /* =====================================================
       STATUS
    ===================================================== */

    updateStatus(
        text
    ) {

        const element =
            document.querySelector(
                "#trackingStatus"
            ) ||
            document.querySelector(
                "#status"
            ) ||
            document.querySelector(
                ".tracking-status"
            );


        if (element) {

            element.textContent =
                text;
        }
    }
}


/* =========================================================
   GLOBAL APP
========================================================= */

let app = null;


function initializeApp() {

    if (app) {
        return app;
    }


    app =
        new ObjectTrackerApp();


    app.init();


    window.app =
        app;


    return app;
}


/* =========================================================
   START
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
            initializeApp,
            {
                once: true
            }
        );

    }
    else {

        initializeApp();

    }
}