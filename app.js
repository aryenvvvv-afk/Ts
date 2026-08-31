/* =========================================
   VIDEO OBJECT TRACKER
   app.js
   FILE 8 / 10
========================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       ELEMENTS
    ====================================== */

    const video =
        document.getElementById("video");

    const stage =
        document.getElementById("stage");

    const trackerLayer =
        document.getElementById(
            "trackerLayer"
        );


    if (!video || !stage || !trackerLayer) {

        console.error(
            "Required elements are missing:",
            {
                video,
                stage,
                trackerLayer
            }
        );

        return;
    }


    /* =====================================
       CONFIG
    ====================================== */

    const config =
        window.TrackerConfig ||
        {};


    /* =====================================
       VIDEO CONTROLLER
    ====================================== */

    const videoController =
        new window.VideoController({

            video,

            stage

        });


    /* =====================================
       TRACKER MANAGER
    ====================================== */

    const trackerManager =
        new window.TrackerManager({

            stage,

            layer:
                trackerLayer,

            video

        });


    /* =====================================
       UI
    ====================================== */

    const ui =
        new window.TrackerUI({

            videoController,

            trackerManager

        });


    /* =====================================
       TRACKING ENGINE
    ====================================== */

    let trackingEngine = null;


    if (
        typeof window.TrackingEngine ===
        "function"
    ) {

        trackingEngine =
            new window.TrackingEngine({

                video,

                stage,

                trackerManager,

                sensitivity:
                    getSensitivity()

            });

    }


    /* =====================================
       APPLICATION STATE
    ====================================== */

    const state = {

        initialized:
            true,

        editMode:
            true,

        tracking:
            false,

        sensitivity:
            getSensitivity(),

        selectedStyle:
            "square",

        videoLoaded:
            false

    };


    /* =====================================
       INITIAL SETUP
    ====================================== */

    trackerManager.setEditMode(
        true
    );


    /*
     * Create one tracker automatically
     * when the app starts.
     *
     * This prevents the "Edit button
     * does nothing" problem.
     */

    if (
        trackerManager.trackers.length ===
        0
    ) {

        trackerManager.addAtCenter({

            style:
                "square",

            color:
                config.tracker?.defaultColor ||
                "#00ff66"

        });

    }


    updateGlobalStatus(
        "READY"
    );


    /* =====================================
       GET SENSITIVITY
    ====================================== */

    function getSensitivity() {

        const input =
            document.getElementById(
                "sensitivity"
            );


        if (!input) {

            return (
                config.tracking
                    ?.defaultSensitivity ||
                0.65
            );

        }


        const value =
            Number(
                input.value
            );


        if (
            !Number.isFinite(value)
        ) {

            return 0.65;

        }


        /*
         * Supports both:
         *
         * 0 - 1
         *
         * and
         *
         * 0 - 100
         */

        if (value > 1) {

            return Math.max(
                0,
                Math.min(
                    1,
                    value / 100
                )
            );

        }


        return Math.max(
            0,
            Math.min(
                1,
                value
            )
        );

    }


    /* =====================================
       GLOBAL STATUS
    ====================================== */

    function updateGlobalStatus(
        status
    ) {

        const element =
            document.getElementById(
                "trackingStatus"
            );


        if (!element) {
            return;
        }


        element.textContent =
            status;

        element.dataset.status =
            String(
                status
            ).toLowerCase();

    }


    /* =====================================
       VIDEO UPLOAD
    ====================================== */

    ui.on(
        "video-file",
        file => {

            if (!file) {
                return;
            }


            /*
             * Clear previous tracking
             * targets when a new video is
             * loaded.
             */

            trackerManager.trackers
                .forEach(
                    tracker => {

                        tracker.target =
                            null;

                        tracker.trackingId =
                            null;

                        tracker.targetId =
                            null;

                    }
                );


            const success =
                videoController.loadFile(
                    file
                );


            if (!success) {

                ui.showMessage(
                    "Video upload failed.",
                    "error"
                );

                return;

            }


            state.videoLoaded =
                true;


            updateGlobalStatus(
                "LOADING VIDEO..."
            );


            ui.showMessage(
                "Video loaded.",
                "success"
            );

        }
    );


    /* =====================================
       PLAY
    ====================================== */

    ui.on(
        "play",
        async () => {

            if (
                !state.videoLoaded
            ) {

                ui.showMessage(
                    "First upload a video.",
                    "error"
                );

                return;

            }


            const success =
                await videoController.play();


            if (!success) {

                return;

            }


            state.tracking =
                true;


            if (
                trackingEngine &&
                typeof trackingEngine.start ===
                "function"
            ) {

                trackingEngine.start();

            }


            updateGlobalStatus(
                "PLAYING"
            );

        }
    );


    /* =====================================
       PAUSE
    ====================================== */

    ui.on(
        "pause",
        () => {

            videoController.pause();


            state.tracking =
                false;


            if (
                trackingEngine &&
                typeof trackingEngine.pause ===
                "function"
            ) {

                trackingEngine.pause();

            }


            updateGlobalStatus(
                "PAUSED"
            );

        }
    );


    /* =====================================
       STOP
    ====================================== */

    ui.on(
        "stop",
        () => {

            videoController.stop();


            state.tracking =
                false;


            if (
                trackingEngine &&
                typeof trackingEngine.stop ===
                "function"
            ) {

                trackingEngine.stop();

            }


            updateGlobalStatus(
                "STOPPED"
            );

        }
    );


    /* =====================================
       TOGGLE EDIT MODE
    ====================================== */

    ui.on(
        "toggle-edit",
        () => {

            const enabled =
                trackerManager.toggleEditMode();


            state.editMode =
                enabled;


            if (enabled) {

                updateGlobalStatus(
                    "EDIT MODE"
                );

                ui.showMessage(
                    "Edit mode enabled.",
                    "info"
                );

            }

            else {

                updateGlobalStatus(
                    "TRACKING MODE"
                );

                ui.showMessage(
                    "Tracking mode enabled.",
                    "success"
                );

            }

        }
    );


    /* =====================================
       ADD TRACKER
    ====================================== */

    ui.on(
        "add-tracker",
        () => {

            const tracker =
                trackerManager.addAtCenter({

                    style:
                        state.selectedStyle,

                    color:
                        getColor()

                });


            if (tracker) {

                trackerManager.select(
                    tracker.id
                );


                ui.showMessage(
                    "Tracker added.",
                    "success"
                );

            }

        }
    );


    /* =====================================
       STYLE
    ====================================== */

    ui.on(
        "style",
        style => {

            if (
                ![
                    "square",
                    "circle",
                    "triangle"
                ].includes(style)
            ) {

                return;

            }


            state.selectedStyle =
                style;


            const selected =
                trackerManager.getSelected();


            /*
             * If no tracker is selected,
             * create one immediately.
             */

            if (!selected) {

                const tracker =
                    trackerManager.addAtCenter({

                        style,

                        color:
                            getColor()

                    });


                if (tracker) {

                    trackerManager.select(
                        tracker.id
                    );

                }


                return;

            }


            trackerManager.setStyle(
                style
            );

        }
    );


    /* =====================================
       COLOR
    ====================================== */

    ui.on(
        "color",
        color => {

            trackerManager.setColor(
                color
            );

        }
    );


    /* =====================================
       LOCK
    ====================================== */

    ui.on(
        "lock",
        () => {

            const selected =
                trackerManager.getSelected();


            if (!selected) {

                ui.showMessage(
                    "Select a tracker first.",
                    "error"
                );

                return;

            }


            /*
             * If the tracking engine has a
             * target under the tracker, use it.
             */

            let target =
                null;


            if (
                trackingEngine &&
                typeof trackingEngine
                    .findTargetForTracker ===
                "function"
            ) {

                target =
                    trackingEngine
                        .findTargetForTracker(
                            selected
                        );

            }


            /*
             * If a target is available,
             * lock to that exact target.
             */

            if (target) {

                trackerManager
                    .lockSelectedToTarget(
                        target
                    );

                ui.showMessage(
                    "Tracker locked to object.",
                    "success"
                );

            }

            else {

                /*
                 * Manual lock.
                 *
                 * The tracking engine can
                 * assign a target later.
                 */

                trackerManager.lock(
                    selected.id
                );

                ui.showMessage(
                    "Tracker locked.",
                    "success"
                );

            }


            state.editMode =
                false;


            trackerManager.setEditMode(
                false
            );


            updateGlobalStatus(
                "LOCKED"
            );

        }
    );


    /* =====================================
       UNLOCK
    ====================================== */

    ui.on(
        "unlock",
        () => {

            const selected =
                trackerManager.getSelected();


            if (!selected) {

                ui.showMessage(
                    "Select a tracker first.",
                    "error"
                );

                return;

            }


            trackerManager.unlock(
                selected.id
            );


            state.editMode =
                true;


            trackerManager.setEditMode(
                true
            );


            updateGlobalStatus(
                "EDIT MODE"
            );


            ui.showMessage(
                "Tracker unlocked.",
                "info"
            );

        }
    );


    /* =====================================
       DELETE
    ====================================== */

    ui.on(
        "delete",
        () => {

            const selected =
                trackerManager.getSelected();


            if (!selected) {

                ui.showMessage(
                    "Select a tracker first.",
                    "error"
                );

                return;

            }


            trackerManager.delete(
                selected.id
            );


            ui.showMessage(
                "Tracker deleted.",
                "success"
            );

        }
    );


    /* =====================================
       RESET
    ====================================== */

    ui.on(
        "reset",
        () => {

            videoController.pause();

            videoController.seek(
                0
            );


            state.tracking =
                false;


            if (
                trackingEngine &&
                typeof trackingEngine.reset ===
                "function"
            ) {

                trackingEngine.reset();

            }


            trackerManager.clear();


            /*
             * Always create a new tracker
             * after reset.
             */

            const tracker =
                trackerManager.addAtCenter({

                    style:
                        state.selectedStyle,

                    color:
                        getColor()

                });


            if (tracker) {

                trackerManager.select(
                    tracker.id
                );

            }


            state.editMode =
                true;


            trackerManager.setEditMode(
                true
            );


            updateGlobalStatus(
                "RESET"
            );


            ui.showMessage(
                "Project reset.",
                "success"
            );

        }
    );


    /* =====================================
       SENSITIVITY
    ====================================== */

    ui.on(
        "sensitivity",
        value => {

            const sensitivity =
                normalizeSensitivity(
                    value
                );


            state.sensitivity =
                sensitivity;


            if (
                trackingEngine
            ) {

                if (
                    typeof trackingEngine
                        .setSensitivity ===
                    "function"
                ) {

                    trackingEngine
                        .setSensitivity(
                            sensitivity
                        );

                }

                else {

                    trackingEngine
                        .sensitivity =
                        sensitivity;

                }

            }


            updateGlobalStatus(
                `SENSITIVITY ${
                    Math.round(
                        sensitivity * 100
                    )
                }%`
            );

        }
    );


    /* =====================================
       SEEK
    ====================================== */

    ui.on(
        "seek-percent",
        percent => {

            if (
                !state.videoLoaded
            ) {

                return;

            }


            const duration =
                video.duration ||
                0;


            if (
                duration <= 0
            ) {

                return;

            }


            const p =
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(percent) ||
                        0
                    )
                );


            videoController.seek(
                duration *
                p /
                100
            );

        }
    );


    /* =====================================
       VIDEO FRAME EVENT
    ====================================== */

    videoController.on(
        "frame",
        frameInfo => {

            /*
             * The tracking engine receives
             * the frame event automatically
             * through its own connection.
             */

            if (
                trackingEngine &&
                typeof trackingEngine.processFrame ===
                "function"
            ) {

                trackingEngine.processFrame(
                    frameInfo
                );

            }

        }
    );


    /* =====================================
       TRACKING EVENTS
    ====================================== */

    if (trackingEngine) {

        if (
            typeof trackingEngine.on ===
            "function"
        ) {

            trackingEngine.on(
                "status",
                status => {

                    updateGlobalStatus(
                        status
                    );

                }
            );


            trackingEngine.on(
                "target",
                target => {

                    if (!target) {
                        return;
                    }


                    /*
                     * Target data is forwarded
                     * to locked trackers.
                     */

                    trackerManager
                        .updateLockedTrackers(
                            Array.isArray(target)
                                ? target
                                : [target],

                            {
                                sensitivity:
                                    state.sensitivity
                            }
                        );

                }
            );


            trackingEngine.on(
                "targets",
                targets => {

                    if (
                        !Array.isArray(
                            targets
                        )
                    ) {

                        return;

                    }


                    trackerManager
                        .updateLockedTrackers(
                            targets,

                            {
                                sensitivity:
                                    state.sensitivity
                            }
                        );

                }
            );


            trackingEngine.on(
                "error",
                error => {

                    console.error(
                        "Tracking error:",
                        error
                    );


                    updateGlobalStatus(
                        "TRACKING ERROR"
                    );

                }
            );

        }

    }


    /* =====================================
       SELECTED TRACKER
       AUTOMATIC STATUS
    ====================================== */

    trackerManager.on(
        "selected",
        tracker => {

            if (!tracker) {

                return;

            }


            if (
                tracker.locked
            ) {

                updateGlobalStatus(
                    "LOCKED"
                );

            }

            else if (
                state.editMode
            ) {

                updateGlobalStatus(
                    "EDIT MODE"
                );

            }

        }
    );


    /* =====================================
       COLOR HELPER
    ====================================== */

    function getColor() {

        const picker =
            document.getElementById(
                "colorPicker"
            );


        if (
            picker &&
            picker.value
        ) {

            return picker.value;

        }


        return (
            config.tracker
                ?.defaultColor ||
            "#00ff66"
        );

    }


    /* =====================================
       SENSITIVITY HELPER
    ====================================== */

    function normalizeSensitivity(
        value
    ) {

        value =
            Number(value);


        if (
            !Number.isFinite(
                value
            )
        ) {

            return 0.65;

        }


        if (value > 1) {

            value =
                value / 100;

        }


        return Math.max(
            0,
            Math.min(
                1,
                value
            )
        );

    }


    /* =====================================
       MOBILE / DESKTOP LAYOUT
    ====================================== */

    function updateStageLayout() {

        if (!stage) {
            return;
        }


        /*
         * Never stretch the video itself.
         *
         * The stage is responsive and the
         * video uses contain behavior from CSS.
         */

        stage.style.position =
            "relative";


        trackerLayer.style.position =
            "absolute";


        trackerLayer.style.inset =
            "0";


        trackerLayer.style.pointerEvents =
            "auto";


        trackerLayer.style.touchAction =
            "none";

    }


    updateStageLayout();


    window.addEventListener(
        "resize",
        () => {

            updateStageLayout();

            trackerManager
                .renderAll();

        }
    );


    /* =====================================
       DEBUG ACCESS
    ====================================== */

    window.TrackerApp = {

        state,

        video,

        stage,

        videoController,

        trackerManager,

        trackingEngine,

        ui

    };


    console.log(
        "Video Object Tracker initialized.",
        window.TrackerApp
    );

});