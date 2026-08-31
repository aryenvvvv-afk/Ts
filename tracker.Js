"use strict";

/*
=========================================================
 tracker.js
=========================================================

Tracker UI / state manager.

Features:
- Square / Circle / Triangle
- Drag
- Resize
- Lock / Unlock
- Delete
- Color
- TrackingEngine integration
- Locked tracker follows its own target
=========================================================
*/

class TrackerManager {

    constructor(options = {}) {

        this.container =
            options.container || null;

        this.video =
            options.video || null;

        this.engine =
            options.engine || null;

        this.trackers =
            new Map();

        this.nextId =
            1;

        this.selectedId =
            null;

        this.editMode =
            true;

        this.currentShape =
            "square";

        this.currentColor =
            "#ff0000";

        this.defaultSize =
            80;

        this.minSize =
            25;

        this.maxSize =
            500;

        this.dragging =
            null;

        this.resizing =
            null;

        this._setupContainer();

    }


    /* =================================================
       CONTAINER
    ================================================= */

    _setupContainer() {

        if (!this.container) {
            return;
        }

        this.container.style.position =
            "absolute";

        this.container.style.pointerEvents =
            "auto";

        this.container.style.overflow =
            "visible";

    }


    /* =================================================
       SET ENGINE
    ================================================= */

    setEngine(engine) {

        this.engine =
            engine;

    }


    /* =================================================
       SET EDIT MODE
    ================================================= */

    setEditMode(enabled) {

        this.editMode =
            Boolean(enabled);

        this.trackers.forEach(
            tracker => {

                tracker.element.style.pointerEvents =
                    this.editMode
                        ? "auto"
                        : "none";

            }
        );

    }


    /* =================================================
       SET SHAPE
    ================================================= */

    setShape(shape) {

        const validShapes = [
            "square",
            "circle",
            "triangle"
        ];

        if (
            !validShapes.includes(
                String(shape).toLowerCase()
            )
        ) {

            return;

        }

        this.currentShape =
            String(shape).toLowerCase();

    }


    /* =================================================
       SET COLOR
    ================================================= */

    setColor(color) {

        if (!color) {
            return;
        }

        this.currentColor =
            color;

        const tracker =
            this.getSelectedTracker();

        if (tracker) {

            tracker.color =
                color;

            tracker.element.style.borderColor =
                color;

            tracker.element.style.backgroundColor =
                this._backgroundColor(
                    color
                );

        }

    }


    /* =================================================
       CREATE TRACKER
    ================================================= */

    createTracker(
        x,
        y,
        options = {}
    ) {

        if (!this.container) {
            return null;
        }


        const id =
            options.id ??
            this.nextId++;


        if (
            this.trackers.has(
                String(id)
            )
        ) {

            return null;

        }


        const size =
            this._clampSize(
                options.size ??
                this.defaultSize
            );


        const shape =
            options.shape ??
            this.currentShape;


        const color =
            options.color ??
            this.currentColor;


        const element =
            document.createElement(
                "div"
            );


        element.className =
            "tracker";


        element.dataset.trackerId =
            String(id);


        element.style.position =
            "absolute";


        element.style.left =
            `${x - size / 2}px`;


        element.style.top =
            `${y - size / 2}px`;


        element.style.width =
            `${size}px`;


        element.style.height =
            `${size}px`;


        element.style.boxSizing =
            "border-box";


        element.style.border =
            `3px solid ${color}`;


        element.style.backgroundColor =
            this._backgroundColor(
                color
            );


        element.style.zIndex =
            "1000";


        element.style.touchAction =
            "none";


        element.style.userSelect =
            "none";


        this._applyShape(
            element,
            shape
        );


        const handle =
            document.createElement(
                "div"
            );


        handle.className =
            "tracker-resize-handle";


        handle.style.position =
            "absolute";


        handle.style.width =
            "16px";


        handle.style.height =
            "16px";


        handle.style.right =
            "-8px";


        handle.style.bottom =
            "-8px";


        handle.style.background =
            color;


        handle.style.border =
            "2px solid white";


        handle.style.borderRadius =
            "50%";


        handle.style.cursor =
            "nwse-resize";


        handle.style.touchAction =
            "none";


        element.appendChild(
            handle
        );


        this.container.appendChild(
            element
        );


        const tracker = {

            id:
                String(id),

            element,

            handle,

            shape,

            color,

            x,

            y,

            size,

            locked:
                false,

            tracking:
                false,

            confidence:
                0

        };


        this.trackers.set(
            String(id),
            tracker
        );


        this._bindTrackerEvents(
            tracker
        );


        this.selectTracker(
            id
        );


        if (
            this.engine &&
            typeof this.engine.registerTracker ===
            "function"
        ) {

            this.engine.registerTracker({

                id:
                    String(id),

                cx:
                    x,

                cy:
                    y,

                size

            });

        }


        return tracker;

    }


    /* =================================================
       APPLY SHAPE
    ================================================= */

    _applyShape(
        element,
        shape
    ) {

        element.style.clipPath =
            "";

        element.style.borderRadius =
            "0";


        if (
            shape ===
            "circle"
        ) {

            element.style.borderRadius =
                "50%";

        }


        if (
            shape ===
            "triangle"
        ) {

            element.style.width =
                "0px";

            element.style.height =
                "0px";

            element.style.border =
                "none";

            element.style.background =
                "transparent";

            element.style.borderLeft =
                "40px solid transparent";

            element.style.borderRight =
                "40px solid transparent";

            element.style.borderBottom =
                "70px solid currentColor";

            element.style.color =
                this.currentColor;

        }

    }


    /* =================================================
       BIND EVENTS
    ================================================= */

    _bindTrackerEvents(
        tracker
    ) {

        const element =
            tracker.element;


        const handle =
            tracker.handle;


        element.addEventListener(
            "pointerdown",
            event => {

                if (
                    !this.editMode
                ) {

                    return;

                }


                if (
                    event.target ===
                    handle
                ) {

                    return;

                }


                if (
                    tracker.locked
                ) {

                    return;

                }


                event.preventDefault();


                this.selectTracker(
                    tracker.id
                );


                const point =
                    this._pointerPosition(
                        event
                    );


                this.dragging = {

                    tracker,

                    offsetX:
                        point.x -
                        tracker.x,

                    offsetY:
                        point.y -
                        tracker.y

                };


                try {

                    element.setPointerCapture(
                        event.pointerId
                    );

                }
                catch (_) {}

            }
        );


        element.addEventListener(
            "pointermove",
            event => {

                if (
                    !this.dragging ||
                    this.dragging.tracker !==
                    tracker
                ) {

                    return;

                }


                const point =
                    this._pointerPosition(
                        event
                    );


                const x =
                    point.x -
                    this.dragging.offsetX;


                const y =
                    point.y -
                    this.dragging.offsetY;


                this._setTrackerPosition(
                    tracker,
                    x,
                    y
                );

            }
        );


        element.addEventListener(
            "pointerup",
            () => {

                if (
                    this.dragging &&
                    this.dragging.tracker ===
                    tracker
                ) {

                    this.dragging =
                        null;

                }

            }
        );


        element.addEventListener(
            "pointercancel",
            () => {

                if (
                    this.dragging &&
                    this.dragging.tracker ===
                    tracker
                ) {

                    this.dragging =
                        null;

                }

            }
        );


        handle.addEventListener(
            "pointerdown",
            event => {

                if (
                    !this.editMode ||
                    tracker.locked
                ) {

                    return;

                }


                event.preventDefault();

                event.stopPropagation();


                const point =
                    this._pointerPosition(
                        event
                    );


                this.resizing = {

                    tracker,

                    startX:
                        point.x,

                    startY:
                        point.y,

                    startSize:
                        tracker.size

                };


                this.selectTracker(
                    tracker.id
                );


                try {

                    handle.setPointerCapture(
                        event.pointerId
                    );

                }
                catch (_) {}

            }
        );


        handle.addEventListener(
            "pointermove",
            event => {

                if (
                    !this.resizing ||
                    this.resizing.tracker !==
                    tracker
                ) {

                    return;

                }


                const point =
                    this._pointerPosition(
                        event
                    );


                const dx =
                    point.x -
                    this.resizing.startX;


                const dy =
                    point.y -
                    this.resizing.startY;


                const change =
                    Math.max(
                        dx,
                        dy
                    );


                const size =
                    this._clampSize(
                        this.resizing.startSize +
                        change
                    );


                this._setTrackerSize(
                    tracker,
                    size
                );

            }
        );


        handle.addEventListener(
            "pointerup",
            () => {

                if (
                    this.resizing &&
                    this.resizing.tracker ===
                    tracker
                ) {

                    this.resizing =
                        null;

                }

            }
        );


        handle.addEventListener(
            "pointercancel",
            () => {

                if (
                    this.resizing &&
                    this.resizing.tracker ===
                    tracker
                ) {

                    this.resizing =
                        null;

                }

            }
        );

    }


    /* =================================================
       POINTER POSITION
    ================================================= */

    _pointerPosition(
        event
    ) {

        const rect =
            this.container.getBoundingClientRect();


        return {

            x:
                event.clientX -
                rect.left,

            y:
                event.clientY -
                rect.top

        };

    }


    /* =================================================
       SET POSITION
    ================================================= */

    _setTrackerPosition(
        tracker,
        x,
        y
    ) {

        const bounds =
            this.container.getBoundingClientRect();


        const half =
            tracker.size / 2;


        x =
            Math.max(
                half,
                Math.min(
                    bounds.width -
                    half,
                    x
                )
            );


        y =
            Math.max(
                half,
                Math.min(
                    bounds.height -
                    half,
                    y
                )
            );


        tracker.x =
            x;

        tracker.y =
            y;


        tracker.element.style.left =
            `${x - half}px`;

        tracker.element.style.top =
            `${y - half}px`;


        if (
            this.engine &&
            typeof this.engine.updateTracker ===
            "function"
        ) {

            this.engine.updateTracker({

                id:
                    tracker.id,

                cx:
                    x,

                cy:
                    y,

                size:
                    tracker.size

            });

        }

    }


    /* =================================================
       SET SIZE
    ================================================= */

    _setTrackerSize(
        tracker,
        size
    ) {

        size =
            this._clampSize(
                size
            );


        tracker.size =
            size;


        tracker.element.style.width =
            `${size}px`;


        tracker.element.style.height =
            `${size}px`;


        /*
         * Keep the tracker centered on the
         * same object while resizing.
         */
        tracker.element.style.left =
            `${tracker.x - size / 2}px`;


        tracker.element.style.top =
            `${tracker.y - size / 2}px`;


        if (
            this.engine &&
            typeof this.engine.updateTracker ===
            "function"
        ) {

            this.engine.updateTracker({

                id:
                    tracker.id,

                cx:
                    tracker.x,

                cy:
                    tracker.y,

                size

            });

        }

    }


    /* =================================================
       SELECT
    ================================================= */

    selectTracker(
        id
    ) {

        const tracker =
            this.trackers.get(
                String(id)
            );


        if (!tracker) {
            return false;
        }


        this.selectedId =
            String(id);


        this.trackers.forEach(
            item => {

                item.element.classList.toggle(
                    "selected",
                    item.id ===
                    this.selectedId
                );

            }
        );


        return true;

    }


    /* =================================================
       GET SELECTED
    ================================================= */

    getSelectedTracker() {

        if (
            this.selectedId ===
            null
        ) {

            return null;

        }


        return this.trackers.get(
            this.selectedId
        ) || null;

    }


    /* =================================================
       LOCK
    ================================================= */

    async lockSelected() {

        const tracker =
            this.getSelectedTracker();


        if (!tracker) {
            return false;
        }


        if (
            !this.engine ||
            typeof this.engine.lockTracker !==
            "function"
        ) {

            return false;

        }


        /*
         * Update engine with the exact current
         * tracker position before capturing target.
         */
        this.engine.updateTracker({

            id:
                tracker.id,

            cx:
                tracker.x,

            cy:
                tracker.y,

            size:
                tracker.size

        });


        const success =
            await this.engine.lockTracker(
                tracker.id,
                {

                    x:
                        tracker.x,

                    y:
                        tracker.y,

                    width:
                        tracker.size,

                    height:
                        tracker.size

                }
            );


        if (!success) {

            return false;

        }


        tracker.locked =
            true;


        tracker.tracking =
            true;


        tracker.element.classList.add(
            "locked"
        );


        tracker.element.classList.remove(
            "selected"
        );


        /*
         * Locked tracker cannot be dragged.
         */
        tracker.element.style.cursor =
            "default";


        return true;

    }


    /* =================================================
       UNLOCK
    ================================================= */

    unlockSelected() {

        const tracker =
            this.getSelectedTracker();


        if (!tracker) {
            return false;
        }


        if (
            this.engine &&
            typeof this.engine.unlockTracker ===
            "function"
        ) {

            this.engine.unlockTracker(
                tracker.id
            );

        }


        tracker.locked =
            false;


        tracker.tracking =
            false;


        tracker.confidence =
            0;


        tracker.element.classList.remove(
            "locked"
        );


        tracker.element.style.cursor =
            "move";


        return true;

    }


    /* =================================================
       DELETE SELECTED
    ================================================= */

    deleteSelected() {

        const tracker =
            this.getSelectedTracker();


        if (!tracker) {
            return false;
        }


        if (
            this.engine &&
            typeof this.engine.removeTracker ===
            "function"
        ) {

            this.engine.removeTracker(
                tracker.id
            );

        }


        tracker.element.remove();


        this.trackers.delete(
            tracker.id
        );


        this.selectedId =
            null;


        return true;

    }


    /* =================================================
       RESET
    ================================================= */

    reset() {

        if (
            this.engine &&
            typeof this.engine.reset ===
            "function"
        ) {

            this.engine.reset();

        }


        this.trackers.forEach(
            tracker => {

                tracker.element.remove();

            }
        );


        this.trackers.clear();


        this.selectedId =
            null;

    }


    /* =================================================
       APPLY TRACKING UPDATE
    ================================================= */

    updateFromTracking(
        update
    ) {

        if (!update) {
            return;
        }


        const tracker =
            this.trackers.get(
                String(
                    update.id
                )
            );


        if (!tracker) {
            return;
        }


        if (
            !tracker.locked
        ) {

            return;

        }


        if (
            !Number.isFinite(
                update.x
            ) ||
            !Number.isFinite(
                update.y
            )
        ) {

            return;

        }


        /*
         * IMPORTANT:
         *
         * The tracker is moved only from the
         * update belonging to ITS OWN id.
         *
         * It cannot receive another tracker's
         * coordinates.
         */
        tracker.x =
            update.x;

        tracker.y =
            update.y;


        if (
            Number.isFinite(
                update.width
            )
        ) {

            tracker.size =
                update.width;

        }


        tracker.confidence =
            Number(
                update.confidence
            ) || 0;


        tracker.tracking =
            Boolean(
                update.tracking
            );


        this._renderTracker(
            tracker
        );

    }


    /* =================================================
       RENDER TRACKER
    ================================================= */

    _renderTracker(
        tracker
    ) {

        const size =
            tracker.size;


        tracker.element.style.left =
            `${tracker.x - size / 2}px`;


        tracker.element.style.top =
            `${tracker.y - size / 2}px`;


        tracker.element.style.width =
            `${size}px`;


        tracker.element.style.height =
            `${size}px`;

    }


    /* =================================================
       SET TRACKING STATUS
    ================================================= */

    setTrackingStatus(
        id,
        tracking,
        confidence = 0
    ) {

        const tracker =
            this.trackers.get(
                String(id)
            );


        if (!tracker) {
            return;
        }


        tracker.tracking =
            Boolean(tracking);


        tracker.confidence =
            Number(confidence) || 0;


        tracker.element.classList.toggle(
            "tracking",
            tracker.tracking
        );

    }


    /* =================================================
       CHANGE TRACKER SHAPE
    ================================================= */

    changeSelectedShape(
        shape
    ) {

        const tracker =
            this.getSelectedTracker();


        if (!tracker) {
            return false;
        }


        if (
            tracker.locked
        ) {

            return false;

        }


        shape =
            String(
                shape
            ).toLowerCase();


        if (
            ![
                "square",
                "circle",
                "triangle"
            ].includes(
                shape
            )
        ) {

            return false;

        }


        tracker.shape =
            shape;


        /*
         * Reset normal square geometry.
         */
        tracker.element.style.width =
            `${tracker.size}px`;

        tracker.element.style.height =
            `${tracker.size}px`;

        tracker.element.style.border =
            `3px solid ${tracker.color}`;

        tracker.element.style.backgroundColor =
            this._backgroundColor(
                tracker.color
            );

        tracker.element.style.clipPath =
            "";

        tracker.element.style.borderRadius =
            "0";

        tracker.element.style.color =
            tracker.color;


        if (
            shape ===
            "circle"
        ) {

            tracker.element.style.borderRadius =
                "50%";

        }


        if (
            shape ===
            "triangle"
        ) {

            tracker.element.style.background =
                "transparent";

            tracker.element.style.border =
                "none";

            tracker.element.style.clipPath =
                "polygon(50% 0%, 100% 100%, 0% 100%)";

            tracker.element.style.backgroundColor =
                this._backgroundColor(
                    tracker.color
                );

        }


        return true;

    }


    /* =================================================
       GET ALL
    ================================================= */

    getAllTrackers() {

        return Array.from(
            this.trackers.values()
        )
        .map(
            tracker => ({

                id:
                    tracker.id,

                x:
                    tracker.x,

                y:
                    tracker.y,

                size:
                    tracker.size,

                shape:
                    tracker.shape,

                color:
                    tracker.color,

                locked:
                    tracker.locked,

                tracking:
                    tracker.tracking,

                confidence:
                    tracker.confidence

            })
        );

    }


    /* =================================================
       FIND
    ================================================= */

    getTracker(
        id
    ) {

        return this.trackers.get(
            String(id)
        ) || null;

    }


    /* =================================================
       CLAMP SIZE
    ================================================= */

    _clampSize(
        size
    ) {

        size =
            Number(size);


        if (
            !Number.isFinite(
                size
            )
        ) {

            size =
                this.defaultSize;

        }


        return Math.max(
            this.minSize,
            Math.min(
                this.maxSize,
                size
            )
        );

    }


    /* =================================================
       COLOR BACKGROUND
    ================================================= */

    _backgroundColor(
        color
    ) {

        /*
         * Transparent background.
         */
        return "transparent";

    }

}


/* =====================================================
   GLOBAL EXPORT
===================================================== */

if (
    typeof window !==
    "undefined"
) {

    window.TrackerManager =
        TrackerManager;

}


if (
    typeof module !==
    "undefined" &&
    module.exports
) {

    module.exports =
        TrackerManager;

}