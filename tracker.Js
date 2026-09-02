"use strict";

/*
 * =========================================================
 * tracker.js
 * Object Tracker
 *
 * Tracker model + tracker DOM rendering.
 *
 * IMPORTANT:
 * Locked tracker कभी दूसरे target पर switch नहीं करेगा.
 * जिस object को lock किया गया है, उसी target identity को
 * follow करने की कोशिश करेगा.
 * =========================================================
 */

class Tracker {

    constructor(options = {}) {

        this.id =
            options.id ||
            createId("tracker");

        this.shape =
            Config.isValidShape(
                options.shape
            )
                ? options.shape
                : APP_CONFIG.tracker.defaultShape;

        this.color =
            normalizeColor(
                options.color ||
                APP_CONFIG.tracker.defaultColor
            );

        this.size =
            Config.clampTrackerSize(
                options.size ||
                APP_CONFIG.tracker.defaultSize
            );


        /*
         * Position हमेशा normalized video coordinates में
         * store होगी.
         *
         * इससे video resize होने पर tracker सही जगह रहता है.
         */
        this.x =
            clamp(
                toNumber(
                    options.x,
                    0.5
                ),
                0,
                1
            );

        this.y =
            clamp(
                toNumber(
                    options.y,
                    0.5
                ),
                0,
                1
            );


        /*
         * Lock state.
         */
        this.locked =
            Boolean(
                options.locked
            );


        /*
         * जिस exact object को lock किया गया था
         * उसकी identity.
         */
        this.targetId =
            options.targetId ??
            null;


        /*
         * Last confirmed target information.
         */
        this.lastTarget =
            options.lastTarget
                ? deepClone(
                    options.lastTarget
                )
                : null;


        this.lastTargetCenter =
            options.lastTargetCenter
                ? deepClone(
                    options.lastTargetCenter
                )
                : null;


        this.lastTargetRect =
            options.lastTargetRect
                ? deepClone(
                    options.lastTargetRect
                )
                : null;


        /*
         * Target खोने पर tracker कितने frames से
         * target नहीं मिला.
         */
        this.lostFrames =
            toNumber(
                options.lostFrames,
                0
            );


        /*
         * Current tracking status.
         */
        this.tracking =
            Boolean(
                options.tracking
            );


        this.confidence =
            clamp(
                toNumber(
                    options.confidence,
                    0
                ),
                0,
                1
            );


        /*
         * DOM element.
         */
        this.element =
            null;


        /*
         * Resize handle.
         */
        this.resizeHandle =
            null;


        /*
         * Internal drag state.
         */
        this.dragging =
            false;

        this.resizing =
            false;

        this.pointerId =
            null;


        this.dragOffset =
            {
                x: 0,
                y: 0
            };


        this.resizeStart =
            null;


        /*
         * Events.
         */
        this.events =
            new SimpleEventEmitter();


        this.createElement();

    }


    /* =====================================================
       CREATE DOM
    ===================================================== */

    createElement() {

        if (
            typeof document ===
            "undefined"
        ) {

            return;

        }


        const element =
            document.createElement(
                "div"
            );


        element.className =
            "tracker";


        element.dataset.trackerId =
            this.id;


        this.element =
            element;


        this.updateShapeClass();

        this.updateColor();

        this.updateSize();


        /*
         * Resize handle.
         */
        const resizeHandle =
            document.createElement(
                "div"
            );


        resizeHandle.className =
            "tracker-resize-handle";


        resizeHandle.dataset.trackerId =
            this.id;


        this.resizeHandle =
            resizeHandle;


        element.appendChild(
            resizeHandle
        );


        this.updateLockVisual();

    }


    /* =====================================================
       APPEND
    ===================================================== */

    appendTo(
        container
    ) {

        if (
            !container ||
            !this.element
        ) {

            return false;

        }


        container.appendChild(
            this.element
        );


        this.updateVisualPosition();


        return true;

    }


    /* =====================================================
       SHAPE
    ===================================================== */

    setShape(
        shape
    ) {

        if (
            !Config.isValidShape(
                shape
            )
        ) {

            return false;

        }


        if (
            this.locked
        ) {

            return false;

        }


        this.shape =
            shape;


        this.updateShapeClass();


        this.events.emit(
            "change",
            this
        );


        return true;

    }


    updateShapeClass() {

        if (!this.element) {
            return;
        }


        this.element.classList.remove(
            "square",
            "circle",
            "triangle"
        );


        this.element.classList.add(
            this.shape
        );


        /*
         * Triangle CSS.
         */
        if (
            this.shape ===
            "triangle"
        ) {

            this.element.style.borderLeft =
                `${this.size / 2}px solid transparent`;

            this.element.style.borderRight =
                `${this.size / 2}px solid transparent`;

            this.element.style.borderBottom =
                `${this.size}px solid ${this.color}`;

            this.element.style.background =
                "transparent";

        }
        else {

            this.element.style.border =
                `${APP_CONFIG.tracker.borderWidth}px solid ${this.color}`;

            this.element.style.background =
                "transparent";

        }

    }


    /* =====================================================
       COLOR
    ===================================================== */

    setColor(
        color
    ) {

        if (
            !isValidColor(color)
        ) {

            return false;

        }


        this.color =
            color;


        this.updateColor();


        this.events.emit(
            "change",
            this
        );


        return true;

    }


    updateColor() {

        if (!this.element) {
            return;
        }


        if (
            this.shape ===
            "triangle"
        ) {

            this.element.style.borderLeftColor =
                "transparent";

            this.element.style.borderRightColor =
                "transparent";

            this.element.style.borderBottomColor =
                this.color;

        }
        else {

            this.element.style.borderColor =
                this.color;

        }

        this.element.style.setProperty(
            "--tracker-color",
            this.color
        );

    }


    /* =====================================================
       SIZE
    ===================================================== */

    setSize(
        size
    ) {

        if (
            this.locked
        ) {

            return false;

        }


        this.size =
            Config.clampTrackerSize(
                size
            );


        this.updateSize();


        this.events.emit(
            "change",
            this
        );


        return true;

    }


    updateSize() {

        if (!this.element) {
            return;
        }


        if (
            this.shape ===
            "triangle"
        ) {

            this.element.style.width =
                "0px";

            this.element.style.height =
                "0px";

            this.element.style.borderLeftWidth =
                `${this.size / 2}px`;

            this.element.style.borderRightWidth =
                `${this.size / 2}px`;

            this.element.style.borderBottomWidth =
                `${this.size}px`;

        }
        else {

            this.element.style.width =
                `${this.size}px`;

            this.element.style.height =
                `${this.size}px`;

        }


        this.updateShapeClass();

    }


    /* =====================================================
       POSITION
    ===================================================== */

    setNormalizedPosition(
        x,
        y
    ) {

        this.x =
            clamp(
                toNumber(x),
                0,
                1
            );

        this.y =
            clamp(
                toNumber(y),
                0,
                1
            );


        this.updateVisualPosition();


        this.events.emit(
            "position",
            this
        );

    }


    setPosition(
        x,
        y
    ) {

        /*
         * x/y यहां normalized coordinates हैं.
         */
        this.setNormalizedPosition(
            x,
            y
        );

    }


    updateVisualPosition() {

        if (
            !this.element
        ) {

            return;

        }


        this.element.style.left =
            `${this.x * 100}%`;

        this.element.style.top =
            `${this.y * 100}%`;


        /*
         * Tracker का center point उसके
         * exact x/y पर रहेगा.
         */
        this.element.style.transform =
            "translate(-50%, -50%)";

    }


    /* =====================================================
       LOCK
    ===================================================== */

    lock(
        target
    ) {

        if (
            !target
        ) {

            return false;

        }


        /*
         * Target में stable identity जरूरी है.
         */
        const targetId =
            target.id ??
            target.trackingId ??
            target.trackId ??
            null;


        if (
            targetId ===
            null ||
            targetId ===
            undefined
        ) {

            /*
             * बिना identity के lock नहीं करेंगे.
             * यही दूसरे similar objects पर jump रोकता है.
             */
            return false;

        }


        this.targetId =
            String(
                targetId
            );


        this.lastTarget =
            deepClone(
                target
            );


        this.lastTargetCenter =
            this.getTargetCenter(
                target
            );


        this.lastTargetRect =
            target.rect
                ? deepClone(
                    target.rect
                )
                : null;


        this.lostFrames =
            0;


        this.confidence =
            clamp(
                toNumber(
                    target.confidence,
                    1
                ),
                0,
                1
            );


        this.locked =
            true;


        this.tracking =
            true;


        this.updateLockVisual();


        this.events.emit(
            "lock",
            this,
            target
        );


        return true;

    }


    /* =====================================================
       UNLOCK
    ===================================================== */

    unlock() {

        this.locked =
            false;

        this.tracking =
            false;


        this.targetId =
            null;


        this.lastTarget =
            null;


        this.lastTargetCenter =
            null;


        this.lastTargetRect =
            null;


        this.lostFrames =
            0;


        this.confidence =
            0;


        this.updateLockVisual();


        this.events.emit(
            "unlock",
            this
        );

    }


    /* =====================================================
       LOCK VISUAL
    ===================================================== */

    updateLockVisual() {

        if (!this.element) {
            return;
        }


        this.element.classList.toggle(
            "locked",
            this.locked
        );


        this.element.classList.toggle(
            "tracking",
            this.tracking
        );

    }


    /* =====================================================
       TARGET CENTER
    ===================================================== */

    getTargetCenter(
        target
    ) {

        if (!target) {

            return null;

        }


        if (
            target.center &&
            Number.isFinite(
                target.center.x
            ) &&
            Number.isFinite(
                target.center.y
            )
        ) {

            return {

                x:
                    target.center.x,

                y:
                    target.center.y

            };

        }


        if (
            target.rect
        ) {

            return rectCenter(
                target.rect
            );

        }


        if (
            Number.isFinite(
                target.x
            ) &&
            Number.isFinite(
                target.y
            )
        ) {

            return {

                x:
                    target.x,

                y:
                    target.y

            };

        }


        return null;

    }


    /* =====================================================
       MATCH TARGET
    ===================================================== */

    matchesTarget(
        target
    ) {

        if (
            !this.locked ||
            this.targetId ===
            null ||
            !target
        ) {

            return false;

        }


        const id =
            target.id ??
            target.trackingId ??
            target.trackId ??
            null;


        if (
            id ===
            null ||
            id ===
            undefined
        ) {

            return false;

        }


        /*
         * सबसे important rule:
         *
         * target ID exact match होना चाहिए.
         *
         * Similar glass/object होने के बावजूद
         * दूसरे object को accept नहीं करेंगे.
         */
        return (
            String(id) ===
            String(this.targetId)
        );

    }


    /* =====================================================
       UPDATE FROM TARGET
    ===================================================== */

    updateFromTarget(
        target,
        sensitivity = APP_CONFIG.tracker.defaultSensitivity
    ) {

        if (
            !this.locked
        ) {

            return false;

        }


        /*
         * Exact target identity check.
         */
        if (
            !this.matchesTarget(
                target
            )
        ) {

            return false;

        }


        const center =
            this.getTargetCenter(
                target
            );


        if (!center) {

            return false;

        }


        /*
         * Target coordinate system:
         *
         * tracking engine से आने वाला center
         * normalized 0..1 होना चाहिए.
         */
        const targetX =
            clamp(
                center.x,
                0,
                1
            );


        const targetY =
            clamp(
                center.y,
                0,
                1
            );


        /*
         * Smooth follow.
         *
         * Sensitivity ज्यादा =
         * tracker जल्दी target पर पहुंचेगा.
         */
        const follow =
            clamp(
                sensitivity,
                0,
                1
            );


        /*
         * Minimum movement factor.
         * इससे tracker responsive रहेगा.
         */
        const amount =
            0.15 +
            follow * 0.85;


        this.x =
            lerp(
                this.x,
                targetX,
                amount
            );


        this.y =
            lerp(
                this.y,
                targetY,
                amount
            );


        /*
         * Save confirmed target.
         */
        this.lastTarget =
            deepClone(
                target
            );


        this.lastTargetCenter =
            {
                x: targetX,
                y: targetY
            };


        this.lastTargetRect =
            target.rect
                ? deepClone(
                    target.rect
                )
                : null;


        this.lostFrames =
            0;


        this.tracking =
            true;


        this.confidence =
            clamp(
                toNumber(
                    target.confidence,
                    1
                ),
                0,
                1
            );


        this.updateVisualPosition();

        this.updateLockVisual();


        this.events.emit(
            "tracking",
            this,
            target
        );


        return true;

    }


    /* =====================================================
       TARGET LOST
    ===================================================== */

    targetLost() {

        if (
            !this.locked
        ) {

            return;

        }


        this.lostFrames++;


        /*
         * IMPORTANT:
         *
         * Target खो जाने पर tracker किसी दूसरे
         * target पर search/switch नहीं करेगा.
         *
         * वह last confirmed position पर रहेगा.
         */
        this.tracking =
            false;


        this.updateLockVisual();


        this.events.emit(
            "targetLost",
            this,
            this.lostFrames
        );

    }


    /* =====================================================
       DELETE
    ===================================================== */

    destroy() {

        if (
            this.element &&
            this.element.parentNode
        ) {

            this.element.parentNode.removeChild(
                this.element
            );

        }


        this.events.emit(
            "destroy",
            this
        );


        this.events.clear();


        this.element =
            null;

        this.resizeHandle =
            null;

    }


    /* =====================================================
       SERIALIZE
    ===================================================== */

    toJSON() {

        return {

            id:
                this.id,

            shape:
                this.shape,

            color:
                this.color,

            size:
                this.size,

            x:
                this.x,

            y:
                this.y,

            locked:
                this.locked,

            targetId:
                this.targetId,

            lastTarget:
                this.lastTarget
                    ? deepClone(
                        this.lastTarget
                    )
                    : null,

            lastTargetCenter:
                this.lastTargetCenter
                    ? deepClone(
                        this.lastTargetCenter
                    )
                    : null,

            lastTargetRect:
                this.lastTargetRect
                    ? deepClone(
                        this.lastTargetRect
                    )
                    : null,

            lostFrames:
                this.lostFrames,

            tracking:
                this.tracking,

            confidence:
                this.confidence

        };

    }

}


/* =========================================================
   TRACKER MANAGER
========================================================= */

class TrackerManager {

    constructor(
        container = null
    ) {

        this.container =
            container;


        this.trackers =
            new Map();


        this.selectedId =
            null;


        this.events =
            new SimpleEventEmitter();

    }


    /* =====================================================
       ADD
    ===================================================== */

    add(
        options = {}
    ) {

        if (
            this.trackers.size >=
            APP_CONFIG.tracker.maxTrackers
        ) {

            return null;

        }


        const tracker =
            options instanceof Tracker
                ? options
                : new Tracker(
                    options
                );


        this.trackers.set(
            tracker.id,
            tracker
        );


        if (
            this.container
        ) {

            tracker.appendTo(
                this.container
            );

        }


        tracker.events.on(
            "change",
            () => {

                this.events.emit(
                    "change",
                    tracker
                );

            }
        );


        tracker.events.on(
            "position",
            () => {

                this.events.emit(
                    "position",
                    tracker
                );

            }
        );


        tracker.events.on(
            "lock",
            (
                t,
                target
            ) => {

                this.events.emit(
                    "lock",
                    t,
                    target
                );

            }
        );


        tracker.events.on(
            "unlock",
            t => {

                this.events.emit(
                    "unlock",
                    t
                );

            }
        );


        this.select(
            tracker.id
        );


        this.events.emit(
            "add",
            tracker
        );


        return tracker;

    }


    /* =====================================================
       GET
    ===================================================== */

    get(
        id
    ) {

        return this.trackers.get(
            String(id)
        ) || null;

    }


    /* =====================================================
       ALL
    ===================================================== */

    all() {

        return [
            ...this.trackers.values()
        ];

    }


    /* =====================================================
       SELECT
    ===================================================== */

    select(
        id
    ) {

        const tracker =
            this.get(
                id
            );


        if (!tracker) {
            return null;
        }


        this.selectedId =
            tracker.id;


        for (
            const item
            of this.trackers.values()
        ) {

            if (
                item.element
            ) {

                item.element.classList.toggle(
                    "selected",
                    item.id ===
                    this.selectedId
                );

            }

        }


        this.events.emit(
            "select",
            tracker
        );


        return tracker;

    }


    /* =====================================================
       SELECTED
    ===================================================== */

    selected() {

        if (
            this.selectedId ===
            null
        ) {

            return null;

        }


        return this.get(
            this.selectedId
        );

    }


    /* =====================================================
       REMOVE
    ===================================================== */

    remove(
        id
    ) {

        const tracker =
            this.get(
                id
            );


        if (!tracker) {
            return false;
        }


        tracker.destroy();


        this.trackers.delete(
            tracker.id
        );


        if (
            this.selectedId ===
            tracker.id
        ) {

            this.selectedId =
                null;

        }


        this.events.emit(
            "remove",
            tracker
        );


        return true;

    }


    /* =====================================================
       REMOVE SELECTED
    ===================================================== */

    removeSelected() {

        if (
            this.selectedId ===
            null
        ) {

            return false;

        }


        return this.remove(
            this.selectedId
        );

    }


    /* =====================================================
       CLEAR
    ===================================================== */

    clear() {

        for (
            const tracker
            of this.trackers.values()
        ) {

            tracker.destroy();

        }


        this.trackers.clear();

        this.selectedId =
            null;


        this.events.emit(
            "clear"
        );

    }


    /* =====================================================
       SERIALIZE
    ===================================================== */

    toJSON() {

        return this.all().map(
            tracker =>
                tracker.toJSON()
        );

    }

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

if (
    typeof window !==
    "undefined"
) {

    window.Tracker =
        Tracker;

    window.TrackerManager =
        TrackerManager;

}