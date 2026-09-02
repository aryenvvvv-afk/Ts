"use strict";

/*
 * =========================================================
 * ui.js
 * =========================================================
 *
 * UI controller:
 * - Tracker selection
 * - Add tracker
 * - Shape selection
 * - Color picker
 * - Size
 * - Lock / Unlock
 * - Delete
 * - Edit mode
 * - Sensitivity
 * - Tracking status
 *
 * यह file tracker.js और app.js के साथ काम करती है।
 * =========================================================
 */

class UIController {

    constructor() {

        this.app =
            null;

        this.trackerManager =
            null;

        this.trackingEngine =
            null;

        this.editMode =
            true;

        this.currentShape =
            "square";

        this.currentColor =
            "#00ff66";


        this.elements =
            {};


        this.initialized =
            false;

    }


    /* =====================================================
       INIT
    ===================================================== */

    init() {

        if (
            this.initialized
        ) {

            return;

        }


        this.app =
            window.app ||
            null;


        this.trackerManager =
            window.trackerManager ||
            null;


        this.trackingEngine =
            window.trackingEngine ||
            null;


        this.cacheElements();

        this.bindEvents();

        this.updateUI();

        this.initialized =
            true;

    }


    /* =====================================================
       CACHE ELEMENTS
    ===================================================== */

    cacheElements() {

        this.elements =
            {

                edit:
                    this.find(
                        "#editBtn",
                        "#editModeBtn"
                    ),

                add:
                    this.find(
                        "#addTrackerBtn",
                        "#addTracker"
                    ),

                lock:
                    this.find(
                        "#lockBtn",
                        "#lock"
                    ),

                unlock:
                    this.find(
                        "#unlockBtn",
                        "#unlock"
                    ),

                delete:
                    this.find(
                        "#deleteBtn",
                        "#delete"
                    ),

                reset:
                    this.find(
                        "#resetBtn",
                        "#reset"
                    ),

                square:
                    this.find(
                        "#squareBtn"
                    ),

                circle:
                    this.find(
                        "#circleBtn"
                    ),

                triangle:
                    this.find(
                        "#triangleBtn"
                    ),

                color:
                    this.find(
                        "#colorPicker",
                        "#trackerColor"
                    ),

                size:
                    this.find(
                        "#trackerSize",
                        "#sizeSlider"
                    ),

                sensitivity:
                    this.find(
                        "#sensitivity",
                        "#sensitivitySlider"
                    ),

                sensitivityValue:
                    this.find(
                        "#sensitivityValue"
                    ),

                status:
                    this.find(
                        "#trackingStatus",
                        "#status",
                        ".tracking-status"
                    ),

                trackerList:
                    this.find(
                        "#trackerList",
                        ".tracker-list"
                    )

            };

    }


    /* =====================================================
       FIND
    ===================================================== */

    find(
        ...selectors
    ) {

        for (
            const selector
            of selectors
        ) {

            const element =
                document.querySelector(
                    selector
                );


            if (
                element
            ) {

                return element;

            }

        }


        return null;

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    bindEvents() {

        this.bindEdit();

        this.bindAdd();

        this.bindLock();

        this.bindUnlock();

        this.bindDelete();

        this.bindReset();

        this.bindShapes();

        this.bindColor();

        this.bindSize();

        this.bindSensitivity();


        /*
         * Tracker manager events.
         */
        if (
            this.trackerManager
        ) {

            this.trackerManager.events.on(
                "add",
                tracker => {

                    this.attachTracker(
                        tracker
                    );

                    this.updateUI();

                }
            );


            this.trackerManager.events.on(
                "remove",
                () => {

                    this.updateTrackerList();

                    this.updateUI();

                }
            );


            this.trackerManager.events.on(
                "select",
                tracker => {

                    this.updateSelectedTrackerUI(
                        tracker
                    );

                    this.updateTrackerList();

                }
            );


            this.trackerManager.events.on(
                "lock",
                tracker => {

                    this.setStatus(
                        `Locked to ${tracker.targetId}`
                    );

                    this.updateSelectedTrackerUI(
                        tracker
                    );

                }
            );


            this.trackerManager.events.on(
                "unlock",
                tracker => {

                    this.setStatus(
                        "Tracker unlocked"
                    );

                    this.updateSelectedTrackerUI(
                        tracker
                    );

                }
            );


            this.trackerManager.events.on(
                "clear",
                () => {

                    this.updateTrackerList();

                    this.updateUI();

                }
            );

        }


        /*
         * Tracking engine events.
         */
        if (
            this.trackingEngine
        ) {

            this.trackingEngine.events.on(
                "frame",
                data => {

                    this.updateTrackingStatus(
                        data
                    );

                }
            );


            this.trackingEngine.events.on(
                "error",
                error => {

                    this.setStatus(
                        error?.message ||
                        "Tracking error"
                    );

                }
            );

        }

    }


    /* =====================================================
       EDIT
    ===================================================== */

    bindEdit() {

        const button =
            this.elements.edit;


        if (
            !button
        ) {

            return;

        }


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                this.editMode =
                    !this.editMode;


                document.body.classList.toggle(
                    "edit-mode",
                    this.editMode
                );


                button.classList.toggle(
                    "active",
                    this.editMode
                );


                this.setStatus(
                    this.editMode
                        ? "Edit mode"
                        : "Tracking mode"
                );


                this.updateUI();

            }
        );

    }


    /* =====================================================
       ADD
    ===================================================== */

    bindAdd() {

        const button =
            this.elements.add;


        if (
            !button
        ) {

            return;

        }


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                if (
                    !this.app ||
                    typeof this.app.addTracker !==
                    "function"
                ) {

                    this.setStatus(
                        "Tracker system not ready"
                    );

                    return;

                }


                const tracker =
                    this.app.addTracker({

                        shape:
                            this.currentShape,

                        color:
                            this.currentColor

                    });


                if (
                    tracker
                ) {

                    this.attachTracker(
                        tracker
                    );


                    this.trackerManager.select(
                        tracker.id
                    );


                    this.setStatus(
                        "Tracker added"
                    );

                }

            }
        );

    }


    /* =====================================================
       LOCK
    ===================================================== */

    bindLock() {

        const button =
            this.elements.lock;


        if (
            !button
        ) {

            return;

        }


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const tracker =
                    this.getSelectedTracker();


                if (
                    !tracker
                ) {

                    this.setStatus(
                        "Select a tracker first"
                    );

                    return;

                }


                if (
                    tracker.locked
                ) {

                    this.setStatus(
                        "Tracker already locked"
                    );

                    return;

                }


                /*
                 * app.js का lock logic use करें।
                 */
                if (
                    this.app &&
                    typeof this.app.lockSelectedTracker ===
                    "function"
                ) {

                    this.app.lockSelectedTracker();

                    return;

                }


                /*
                 * Fallback.
                 */
                const detections =
                    this.trackingEngine
                        ?.detections ||
                    [];


                if (
                    detections.length === 0
                ) {

                    this.setStatus(
                        "No object detected"
                    );

                    return;

                }


                const target =
                    this.findTargetNearTracker(
                        tracker,
                        detections
                    );


                if (
                    !target
                ) {

                    this.setStatus(
                        "Place tracker on an object first"
                    );

                    return;

                }


                const success =
                    tracker.lock(
                        target
                    );


                if (
                    success
                ) {

                    this.setStatus(
                        `Locked to ${target.id}`
                    );

                }

            }
        );

    }


    /* =====================================================
       UNLOCK
    ===================================================== */

    bindUnlock() {

        const button =
            this.elements.unlock;


        if (
            !button
        ) {

            return;

        }


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const tracker =
                    this.getSelectedTracker();


                if (
                    !tracker
                ) {

                    this.setStatus(
                        "Select a tracker first"
                    );

                    return;

                }


                tracker.unlock();


                this.setStatus(
                    "Tracker unlocked"
                );


                this.updateSelectedTrackerUI(
                    tracker
                );

            }
        );

    }


    /* =====================================================
       DELETE
    ===================================================== */

    bindDelete() {

        const button =
            this.elements.delete;


        if (
            !button
        ) {

            return;

        }


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const tracker =
                    this.getSelectedTracker();


                if (
                    !tracker
                ) {

                    return;

                }


                this.trackerManager.remove(
                    tracker.id
                );


                this.setStatus(
                    "Tracker deleted"
                );

            }
        );

    }


    /* =====================================================
       RESET
    ===================================================== */

    bindReset() {

        const button =
            this.elements.reset;


        if (
            !button
        ) {

            return;

        }


        button.addEventListener(
            "click",
            event => {

                event.preventDefault();


                if (
                    this.trackerManager
                ) {

                    this.trackerManager.clear();

                }


                if (
                    this.trackingEngine
                ) {

                    this.trackingEngine.reset();

                }


                this.setStatus(
                    "Reset"
                );


                this.updateUI();

            }
        );

    }


    /* =====================================================
       SHAPES
    ===================================================== */

    bindShapes() {

        const shapes =
            [

                [
                    this.elements.square,
                    "square"
                ],

                [
                    this.elements.circle,
                    "circle"
                ],

                [
                    this.elements.triangle,
                    "triangle"
                ]

            ];


        for (
            const [
                button,
                shape
            ]
            of shapes
        ) {

            if (
                !button
            ) {

                continue;

            }


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    this.currentShape =
                        shape;


                    const tracker =
                        this.getSelectedTracker();


                    /*
                     * Locked tracker का shape change
                     * नहीं करेंगे.
                     */
                    if (
                        tracker &&
                        !tracker.locked
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

        const map =
            {

                square:
                    this.elements.square,

                circle:
                    this.elements.circle,

                triangle:
                    this.elements.triangle

            };


        for (
            const shape
            of Object.keys(map)
        ) {

            const button =
                map[shape];


            if (
                !button
            ) {

                continue;

            }


            button.classList.toggle(
                "active",
                shape ===
                this.currentShape
            );

        }

    }


    /* =====================================================
       COLOR
    ===================================================== */

    bindColor() {

        const input =
            this.elements.color;


        if (
            !input
        ) {

            return;

        }


        this.currentColor =
            input.value ||
            this.currentColor;


        input.addEventListener(
            "input",
            () => {

                const color =
                    input.value;


                if (
                    !isValidColor(
                        color
                    )
                ) {

                    return;

                }


                this.currentColor =
                    color;


                const tracker =
                    this.getSelectedTracker();


                if (
                    tracker &&
                    !tracker.locked
                ) {

                    tracker.setColor(
                        color
                    );

                }

            }
        );

    }


    /* =====================================================
       SIZE
    ===================================================== */

    bindSize() {

        const input =
            this.elements.size;


        if (
            !input
        ) {

            return;

        }


        input.addEventListener(
            "input",
            () => {

                const tracker =
                    this.getSelectedTracker();


                if (
                    !tracker ||
                    tracker.locked
                ) {

                    return;

                }


                tracker.setSize(
                    Number(
                        input.value
                    )
                );


                this.updateSizeValue(
                    tracker.size
                );

            }
        );

    }


    updateSizeValue(
        value
    ) {

        const label =
            this.find(
                "#trackerSizeValue",
                "#sizeValue"
            );


        if (
            label
        ) {

            label.textContent =
                Math.round(
                    value
                );

        }

    }


    /* =====================================================
       SENSITIVITY
    ===================================================== */

    bindSensitivity() {

        const input =
            this.elements.sensitivity;


        if (
            !input
        ) {

            return;

        }


        const update =
            () => {

                const value =
                    Config.clampSensitivity(
                        Number(
                            input.value
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


                if (
                    this.elements.sensitivityValue
                ) {

                    this.elements.sensitivityValue
                        .textContent =
                        value.toFixed(
                            2
                        );

                }

            };


        input.addEventListener(
            "input",
            update
        );


        update();

    }


    /* =====================================================
       TRACKER EVENTS
    ===================================================== */

    attachTracker(
        tracker
    ) {

        if (
            !tracker ||
            !tracker.element
        ) {

            return;

        }


        if (
            tracker.element.dataset.uiBound ===
            "true"
        ) {

            return;

        }


        tracker.element.dataset.uiBound =
            "true";


        tracker.element.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                if (
                    this.trackerManager
                ) {

                    this.trackerManager.select(
                        tracker.id
                    );

                }

            }
        );


        tracker.events.on(
            "change",
            () => {

                this.updateSelectedTrackerUI(
                    tracker
                );

            }
        );


        tracker.events.on(
            "tracking",
            () => {

                if (
                    this.getSelectedTracker()?.id ===
                    tracker.id
                ) {

                    this.updateSelectedTrackerUI(
                        tracker
                    );

                }

            }
        );


        tracker.events.on(
            "targetLost",
            () => {

                if (
                    this.getSelectedTracker()?.id ===
                    tracker.id
                ) {

                    this.setStatus(
                        `Target ${tracker.targetId} lost — waiting for same object`
                    );

                }

            }
        );


        this.updateTrackerList();

    }


    /* =====================================================
       TARGET SEARCH
    ===================================================== */

    findTargetNearTracker(
        tracker,
        detections
    ) {

        if (
            !tracker ||
            !Array.isArray(
                detections
            )
        ) {

            return null;

        }


        let best =
            null;

        let bestDistance =
            Infinity;


        for (
            const detection
            of detections
        ) {

            const center =
                tracker.getTargetCenter(
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
                bestDistance
            ) {

                bestDistance =
                    distance;

                best =
                    detection;

            }

        }


        const radius =
            (
                APP_CONFIG
                    ?.tracker
                    ?.lockRadius ??
                150
            ) / 1000;


        if (
            bestDistance >
            radius
        ) {

            return null;

        }


        return best;

    }


    /* =====================================================
       GET SELECTED
    ===================================================== */

    getSelectedTracker() {

        if (
            !this.trackerManager
        ) {

            return null;

        }


        return this.trackerManager.selected();

    }


    /* =====================================================
       SELECTED UI
    ===================================================== */

    updateSelectedTrackerUI(
        tracker
    ) {

        if (
            !tracker
        ) {

            return;

        }


        /*
         * Shape.
         */
        this.currentShape =
            tracker.shape;


        this.updateShapeButtons();


        /*
         * Color.
         */
        if (
            this.elements.color
        ) {

            this.elements.color.value =
                tracker.color;

        }


        /*
         * Size.
         */
        if (
            this.elements.size
        ) {

            this.elements.size.value =
                tracker.size;

        }


        this.updateSizeValue(
            tracker.size
        );


        /*
         * Lock/unlock buttons.
         */
        if (
            this.elements.lock
        ) {

            this.elements.lock.disabled =
                tracker.locked;

        }


        if (
            this.elements.unlock
        ) {

            this.elements.unlock.disabled =
                !tracker.locked;

        }


        if (
            this.elements.delete
        ) {

            this.elements.delete.disabled =
                false;

        }

    }


    /* =====================================================
       TRACKER LIST
    ===================================================== */

    updateTrackerList() {

        const list =
            this.elements.trackerList;


        if (
            !list ||
            !this.trackerManager
        ) {

            return;

        }


        list.innerHTML =
            "";


        for (
            const tracker
            of this.trackerManager.all()
        ) {

            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.className =
                "tracker-list-item";


            item.dataset.trackerId =
                tracker.id;


            item.innerHTML =
                `
                    <span
                        class="tracker-list-color"
                        style="background:${escapeHTMLAttribute(tracker.color)}"
                    ></span>

                    <span>
                        ${escapeHTML(tracker.shape)}
                    </span>

                    <span>
                        ${tracker.locked
                            ? `LOCKED #${escapeHTML(tracker.targetId)}`
                            : "EDIT"}
                    </span>
                `;


            item.classList.toggle(
                "selected",
                tracker.id ===
                this.trackerManager.selectedId
            );


            item.addEventListener(
                "click",
                () => {

                    this.trackerManager.select(
                        tracker.id
                    );

                }
            );


            list.appendChild(
                item
            );

        }

    }


    /* =====================================================
       STATUS
    ===================================================== */

    setStatus(
        text
    ) {

        if (
            this.elements.status
        ) {

            this.elements.status.textContent =
                text;

        }

    }


    updateTrackingStatus(
        data
    ) {

        if (
            !this.trackerManager
        ) {

            return;

        }


        const trackers =
            this.trackerManager.all();


        const locked =
            trackers.filter(
                tracker =>
                    tracker.locked
            );


        if (
            locked.length === 0
        ) {

            this.setStatus(
                "Ready"
            );

            return;

        }


        const active =
            locked.filter(
                tracker =>
                    tracker.tracking
            );


        this.setStatus(
            `Tracking ${active.length}/${locked.length} • Objects: ${data.detections.length}`
        );

    }


    /* =====================================================
       UPDATE UI
    ===================================================== */

    updateUI() {

        document.body.classList.toggle(
            "edit-mode",
            this.editMode
        );


        this.updateShapeButtons();

        this.updateTrackerList();


        const tracker =
            this.getSelectedTracker();


        if (
            tracker
        ) {

            this.updateSelectedTrackerUI(
                tracker
            );

        }

    }

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ??
        ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeHTMLAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   GLOBAL INSTANCE
========================================================= */

let uiController =
    null;


function initializeUI() {

    if (
        uiController
    ) {

        return uiController;

    }


    uiController =
        new UIController();


    uiController.init();


    window.uiController =
        uiController;


    return uiController;

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
            initializeUI,
            {
                once: true
            }
        );

    }
    else {

        initializeUI();

    }

}