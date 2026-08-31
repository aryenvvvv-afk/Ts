/* =========================================
   VIDEO OBJECT TRACKER
   ui.js
   FILE 7 / 10
========================================= */

"use strict";

window.TrackerUI = class TrackerUI {

    constructor(options = {}) {

        this.videoController =
            options.videoController || null;

        this.trackerManager =
            options.trackerManager || null;

        this.elements = {};

        this.listeners = {};

        this.isDraggingSensitivity =
            false;

        this.cacheElements();

        this.bindControls();

        this.bindTrackerEvents();

        this.bindVideoEvents();

        this.updateUI();

    }


    /* =====================================
       EVENT SYSTEM
    ====================================== */

    on(
        eventName,
        callback
    ) {

        if (
            typeof callback !==
            "function"
        ) {
            return;
        }

        if (
            !this.listeners[eventName]
        ) {

            this.listeners[eventName] =
                [];

        }

        this.listeners[eventName].push(
            callback
        );

    }


    emit(
        eventName,
        data = null
    ) {

        const callbacks =
            this.listeners[eventName];

        if (!callbacks) {
            return;
        }

        callbacks.forEach(
            callback => {

                try {

                    callback(
                        data
                    );

                } catch (error) {

                    console.error(
                        "UI event error:",
                        error
                    );

                }

            }
        );

    }


    /* =====================================
       FIND ELEMENTS
    ====================================== */

    cacheElements() {

        this.elements = {

            videoInput:
                document.getElementById(
                    "videoInput"
                ),

            uploadButton:
                document.getElementById(
                    "uploadButton"
                ),

            playButton:
                document.getElementById(
                    "playButton"
                ),

            pauseButton:
                document.getElementById(
                    "pauseButton"
                ),

            stopButton:
                document.getElementById(
                    "stopButton"
                ),

            editButton:
                document.getElementById(
                    "editButton"
                ),

            lockButton:
                document.getElementById(
                    "lockButton"
                ),

            unlockButton:
                document.getElementById(
                    "unlockButton"
                ),

            resetButton:
                document.getElementById(
                    "resetButton"
                ),

            deleteButton:
                document.getElementById(
                    "deleteButton"
                ),

            squareButton:
                document.getElementById(
                    "squareButton"
                ),

            circleButton:
                document.getElementById(
                    "circleButton"
                ),

            triangleButton:
                document.getElementById(
                    "triangleButton"
                ),

            addTrackerButton:
                document.getElementById(
                    "addTrackerButton"
                ),

            colorPicker:
                document.getElementById(
                    "colorPicker"
                ),

            sensitivity:
                document.getElementById(
                    "sensitivity"
                ),

            sensitivityValue:
                document.getElementById(
                    "sensitivityValue"
                ),

            trackingStatus:
                document.getElementById(
                    "trackingStatus"
                ),

            currentTime:
                document.getElementById(
                    "currentTime"
                ),

            duration:
                document.getElementById(
                    "duration"
                ),

            progress:
                document.getElementById(
                    "progress"
                ),

            editStatus:
                document.getElementById(
                    "editStatus"
                ),

            trackerCount:
                document.getElementById(
                    "trackerCount"
                ),

            selectedTracker:
                document.getElementById(
                    "selectedTracker"
                ),

            styleSelector:
                document.getElementById(
                    "styleSelector"
                )

        };

    }


    /* =====================================
       BIND BUTTONS
    ====================================== */

    bindControls() {

        const e =
            this.elements;


        /* ---------------------------------
           VIDEO UPLOAD
        --------------------------------- */

        if (e.uploadButton) {

            e.uploadButton.addEventListener(
                "click",
                () => {

                    e.videoInput?.click();

                }
            );

        }


        if (e.videoInput) {

            e.videoInput.addEventListener(
                "change",
                event => {

                    const file =
                        event.target
                            .files?.[0];

                    if (!file) {
                        return;
                    }

                    this.emit(
                        "video-file",
                        file
                    );

                }
            );

        }


        /* ---------------------------------
           PLAY
        --------------------------------- */

        if (e.playButton) {

            e.playButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "play"
                    );

                }
            );

        }


        /* ---------------------------------
           PAUSE
        --------------------------------- */

        if (e.pauseButton) {

            e.pauseButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "pause"
                    );

                }
            );

        }


        /* ---------------------------------
           STOP
        --------------------------------- */

        if (e.stopButton) {

            e.stopButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "stop"
                    );

                }
            );

        }


        /* ---------------------------------
           EDIT
        --------------------------------- */

        if (e.editButton) {

            e.editButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "toggle-edit"
                    );

                }
            );

        }


        /* ---------------------------------
           LOCK
        --------------------------------- */

        if (e.lockButton) {

            e.lockButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "lock"
                    );

                }
            );

        }


        /* ---------------------------------
           UNLOCK
        --------------------------------- */

        if (e.unlockButton) {

            e.unlockButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "unlock"
                    );

                }
            );

        }


        /* ---------------------------------
           RESET
        --------------------------------- */

        if (e.resetButton) {

            e.resetButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "reset"
                    );

                }
            );

        }


        /* ---------------------------------
           DELETE
        --------------------------------- */

        if (e.deleteButton) {

            e.deleteButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "delete"
                    );

                }
            );

        }


        /* ---------------------------------
           ADD TRACKER
        --------------------------------- */

        if (e.addTrackerButton) {

            e.addTrackerButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "add-tracker"
                    );

                }
            );

        }


        /* ---------------------------------
           SQUARE
        --------------------------------- */

        if (e.squareButton) {

            e.squareButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "style",
                        "square"
                    );

                }
            );

        }


        /* ---------------------------------
           CIRCLE
        --------------------------------- */

        if (e.circleButton) {

            e.circleButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "style",
                        "circle"
                    );

                }
            );

        }


        /* ---------------------------------
           TRIANGLE
        --------------------------------- */

        if (e.triangleButton) {

            e.triangleButton.addEventListener(
                "click",
                () => {

                    this.emit(
                        "style",
                        "triangle"
                    );

                }
            );

        }


        /* ---------------------------------
           COLOR
        --------------------------------- */

        if (e.colorPicker) {

            e.colorPicker.addEventListener(
                "input",
                event => {

                    this.emit(
                        "color",
                        event.target.value
                    );

                }
            );

        }


        /* ---------------------------------
           SENSITIVITY
        --------------------------------- */

        if (e.sensitivity) {

            e.sensitivity.addEventListener(
                "input",
                event => {

                    const value =
                        Number(
                            event.target.value
                        );

                    this.updateSensitivityDisplay(
                        value
                    );

                    this.emit(
                        "sensitivity",
                        value
                    );

                }
            );

        }


        /* ---------------------------------
           PROGRESS
        --------------------------------- */

        if (e.progress) {

            e.progress.addEventListener(
                "input",
                event => {

                    const value =
                        Number(
                            event.target.value
                        );

                    this.emit(
                        "seek-percent",
                        value
                    );

                }
            );

        }


        /* ---------------------------------
           STYLE SELECTOR
        --------------------------------- */

        if (e.styleSelector) {

            e.styleSelector.addEventListener(
                "change",
                event => {

                    this.emit(
                        "style",
                        event.target.value
                    );

                }
            );

        }

    }


    /* =====================================
       TRACKER EVENTS
    ====================================== */

    bindTrackerEvents() {

        if (
            !this.trackerManager
        ) {
            return;
        }


        this.trackerManager.on(
            "created",
            tracker => {

                this.updateUI();

                this.emit(
                    "tracker-created",
                    tracker
                );

            }
        );


        this.trackerManager.on(
            "selected",
            tracker => {

                this.updateSelectedTracker(
                    tracker
                );

                this.updateUI();

            }
        );


        this.trackerManager.on(
            "locked",
            tracker => {

                this.updateUI();

                this.setTrackingStatus(
                    "LOCKED"
                );

                this.emit(
                    "tracker-locked",
                    tracker
                );

            }
        );


        this.trackerManager.on(
            "unlocked",
            tracker => {

                this.updateUI();

                this.setTrackingStatus(
                    "EDITING"
                );

                this.emit(
                    "tracker-unlocked",
                    tracker
                );

            }
        );


        this.trackerManager.on(
            "deleted",
            tracker => {

                this.updateUI();

                this.emit(
                    "tracker-deleted",
                    tracker
                );

            }
        );


        this.trackerManager.on(
            "cleared",
            () => {

                this.updateUI();

            }
        );


        this.trackerManager.on(
            "changed",
            () => {

                this.updateUI();

            }
        );


        this.trackerManager.on(
            "editmode",
            enabled => {

                this.updateEditMode(
                    enabled
                );

            }
        );


        this.trackerManager.on(
            "tracking",
            () => {

                this.setTrackingStatus(
                    "TRACKING"
                );

            }
        );

    }


    /* =====================================
       VIDEO EVENTS
    ====================================== */

    bindVideoEvents() {

        if (
            !this.videoController
        ) {
            return;
        }


        this.videoController.on(
            "fileloaded",
            data => {

                this.setTrackingStatus(
                    "VIDEO LOADED"
                );

                this.updateUI();

                this.emit(
                    "video-loaded",
                    data
                );

            }
        );


        this.videoController.on(
            "loadedmetadata",
            info => {

                this.updateTime(
                    info?.currentTime ||
                    0,

                    info?.duration ||
                    0
                );

                this.emit(
                    "video-metadata",
                    info
                );

            }
        );


        this.videoController.on(
            "play",
            () => {

                this.setTrackingStatus(
                    "PLAYING"
                );

                this.emit(
                    "video-play"
                );

            }
        );


        this.videoController.on(
            "pause",
            () => {

                this.setTrackingStatus(
                    "PAUSED"
                );

                this.emit(
                    "video-pause"
                );

            }
        );


        this.videoController.on(
            "stop",
            () => {

                this.setTrackingStatus(
                    "STOPPED"
                );

                this.updateTime(
                    0,

                    this.videoController
                        ?.duration ||
                    0
                );

            }
        );


        this.videoController.on(
            "ended",
            () => {

                this.setTrackingStatus(
                    "ENDED"
                );

            }
        );


        this.videoController.on(
            "timeupdate",
            time => {

                const duration =
                    this.videoController
                        ?.video
                        ?.duration ||
                    0;

                this.updateTime(
                    time,
                    duration
                );

            }
        );


        this.videoController.on(
            "error",
            error => {

                this.setTrackingStatus(
                    "VIDEO ERROR"
                );

                console.error(
                    error
                );

            }
        );

    }


    /* =====================================
       UPDATE UI
    ====================================== */

    updateUI() {

        const manager =
            this.trackerManager;

        if (!manager) {
            return;
        }


        const trackers =
            manager.trackers ||
            [];


        const selected =
            manager.getSelected
                ? manager.getSelected()
                : null;


        if (
            this.elements.trackerCount
        ) {

            this.elements.trackerCount
                .textContent =
                String(
                    trackers.length
                );

        }


        if (
            this.elements.selectedTracker
        ) {

            this.elements.selectedTracker
                .textContent =
                selected
                    ? `Tracker ${selected.id}`
                    : "None";

        }


        if (
            this.elements.lockButton
        ) {

            this.elements.lockButton.disabled =
                !selected ||
                selected.locked;

        }


        if (
            this.elements.unlockButton
        ) {

            this.elements.unlockButton.disabled =
                !selected ||
                !selected.locked;

        }


        if (
            this.elements.deleteButton
        ) {

            this.elements.deleteButton.disabled =
                !selected;

        }


        if (
            this.elements.colorPicker &&
            selected?.color
        ) {

            this.elements.colorPicker
                .value =
                selected.color;

        }


        if (
            this.elements.styleSelector &&
            selected?.style
        ) {

            this.elements.styleSelector
                .value =
                selected.style;

        }


        this.updateStyleButtons(
            selected
        );

    }


    /* =====================================
       STYLE BUTTONS
    ====================================== */

    updateStyleButtons(
        selected
    ) {

        const e =
            this.elements;


        const buttons = {

            square:
                e.squareButton,

            circle:
                e.circleButton,

            triangle:
                e.triangleButton

        };


        Object.entries(
            buttons
        ).forEach(
            ([style, button]) => {

                if (!button) {
                    return;
                }

                button.classList.toggle(
                    "active",

                    Boolean(
                        selected &&
                        selected.style ===
                        style
                    )
                );

            }
        );

    }


    /* =====================================
       EDIT MODE
    ====================================== */

    updateEditMode(
        enabled
    ) {

        const e =
            this.elements;


        if (e.editButton) {

            e.editButton.classList.toggle(
                "active",
                Boolean(enabled)
            );

            e.editButton.textContent =
                enabled
                    ? "Edit: ON"
                    : "Edit";

        }


        if (e.editStatus) {

            e.editStatus.textContent =
                enabled
                    ? "EDIT MODE"
                    : "TRACKING MODE";

        }


        this.updateUI();

    }


    /* =====================================
       TRACKING STATUS
    ====================================== */

    setTrackingStatus(
        status
    ) {

        if (
            !this.elements.trackingStatus
        ) {
            return;
        }


        this.elements.trackingStatus
            .textContent =
            String(
                status
            );


        this.elements.trackingStatus
            .dataset.status =
            String(
                status
            ).toLowerCase();

    }


    /* =====================================
       TIME DISPLAY
    ====================================== */

    updateTime(
        currentTime,
        duration
    ) {

        currentTime =
            Number(currentTime) ||
            0;

        duration =
            Number(duration) ||
            0;


        if (
            this.elements.currentTime
        ) {

            this.elements.currentTime
                .textContent =
                this.formatTime(
                    currentTime
                );

        }


        if (
            this.elements.duration
        ) {

            this.elements.duration
                .textContent =
                this.formatTime(
                    duration
                );

        }


        if (
            this.elements.progress
        ) {

            const percent =
                duration > 0
                    ? (
                        currentTime /
                        duration
                    ) *
                    100
                    : 0;


            /*
             * Do not overwrite the slider
             * while the user is actively
             * dragging it.
             */

            if (
                document.activeElement !==
                this.elements.progress
            ) {

                this.elements.progress
                    .value =
                    String(
                        percent
                    );

            }

        }

    }


    /* =====================================
       SENSITIVITY DISPLAY
    ====================================== */

    updateSensitivityDisplay(
        value
    ) {

        value =
            Number(value) || 0;


        if (
            this.elements.sensitivityValue
        ) {

            this.elements.sensitivityValue
                .textContent =
                `${Math.round(
                    value * 100
                )}%`;

        }

    }


    /* =====================================
       FORMAT TIME
    ====================================== */

    formatTime(
        seconds
    ) {

        if (
            window.TrackerUtils
        ) {

            return window.TrackerUtils
                .formatTime(
                    seconds
                );

        }


        seconds =
            Math.max(
                0,
                Number(seconds) ||
                0
            );


        const minutes =
            Math.floor(
                seconds / 60
            );


        const secs =
            Math.floor(
                seconds % 60
            );


        return (
            String(minutes)
                .padStart(
                    2,
                    "0"
                ) +
            ":" +
            String(secs)
                .padStart(
                    2,
                    "0"
                )
        );

    }


    /* =====================================
       SHOW MESSAGE
    ====================================== */

    showMessage(
        message,
        type = "info"
    ) {

        let container =
            document.getElementById(
                "uiMessage"
            );


        if (!container) {

            container =
                document.createElement(
                    "div"
                );

            container.id =
                "uiMessage";

            container.className =
                "ui-message";

            document.body.appendChild(
                container
            );

        }


        container.textContent =
            message;

        container.dataset.type =
            type;

        container.classList.add(
            "visible"
        );


        clearTimeout(
            this.messageTimer
        );


        this.messageTimer =
            setTimeout(
                () => {

                    container.classList.remove(
                        "visible"
                    );

                },

                2500
            );

    }


    /* =====================================
       ENABLE / DISABLE CONTROLS
    ====================================== */

    setControlsEnabled(
        enabled
    ) {

        const controls =
            document.querySelectorAll(
                "button, input, select"
            );


        controls.forEach(
            element => {

                if (
                    element.id ===
                    "videoInput"
                ) {
                    return;
                }

                element.disabled =
                    !enabled;

            }
        );

    }


    /* =====================================
       DESTROY
    ====================================== */

    destroy() {

        this.listeners =
            {};

    }

};