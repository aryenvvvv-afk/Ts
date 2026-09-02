"use strict";

/*
 * =========================================================
 * utils.js
 * Object Tracker
 *
 * Common utility functions used by all other files.
 * =========================================================
 */


/* =========================================================
   NUMBER
========================================================= */

function toNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


/* =========================================================
   CLAMP
========================================================= */

function clamp(
    value,
    min,
    max
) {

    const number =
        toNumber(value, min);

    return Math.max(
        min,
        Math.min(
            max,
            number
        )
    );
}


/* =========================================================
   LERP
========================================================= */

function lerp(
    start,
    end,
    amount
) {

    const t =
        clamp(
            amount,
            0,
            1
        );

    return (
        start +
        (
            end - start
        ) *
        t
    );

}


/* =========================================================
   DISTANCE
========================================================= */

function distance(
    x1,
    y1,
    x2,
    y2
) {

    const dx =
        x2 - x1;

    const dy =
        y2 - y1;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );

}


/* =========================================================
   POINT DISTANCE
========================================================= */

function pointDistance(
    a,
    b
) {

    if (!a || !b) {
        return Infinity;
    }

    return distance(
        toNumber(a.x),
        toNumber(a.y),
        toNumber(b.x),
        toNumber(b.y)
    );

}


/* =========================================================
   RECT CENTER
========================================================= */

function rectCenter(
    rect
) {

    if (!rect) {

        return {
            x: 0,
            y: 0
        };

    }

    return {

        x:
            (
                toNumber(rect.left) +
                toNumber(rect.right)
            ) / 2,

        y:
            (
                toNumber(rect.top) +
                toNumber(rect.bottom)
            ) / 2

    };

}


/* =========================================================
   RECT WIDTH
========================================================= */

function rectWidth(
    rect
) {

    if (!rect) {
        return 0;
    }

    if (
        Number.isFinite(rect.width)
    ) {

        return Math.max(
            0,
            rect.width
        );

    }

    return Math.max(
        0,
        toNumber(rect.right) -
        toNumber(rect.left)
    );

}


/* =========================================================
   RECT HEIGHT
========================================================= */

function rectHeight(
    rect
) {

    if (!rect) {
        return 0;
    }

    if (
        Number.isFinite(rect.height)
    ) {

        return Math.max(
            0,
            rect.height
        );

    }

    return Math.max(
        0,
        toNumber(rect.bottom) -
        toNumber(rect.top)
    );

}


/* =========================================================
   RECT AREA
========================================================= */

function rectArea(
    rect
) {

    return (
        rectWidth(rect) *
        rectHeight(rect)
    );

}


/* =========================================================
   RECT IOU
========================================================= */

function rectIoU(
    a,
    b
) {

    if (!a || !b) {
        return 0;
    }


    const left =
        Math.max(
            toNumber(a.left),
            toNumber(b.left)
        );


    const top =
        Math.max(
            toNumber(a.top),
            toNumber(b.top)
        );


    const right =
        Math.min(
            toNumber(a.right),
            toNumber(b.right)
        );


    const bottom =
        Math.min(
            toNumber(a.bottom),
            toNumber(b.bottom)
        );


    const width =
        Math.max(
            0,
            right - left
        );


    const height =
        Math.max(
            0,
            bottom - top
        );


    const intersection =
        width * height;


    if (intersection <= 0) {
        return 0;
    }


    const union =
        rectArea(a) +
        rectArea(b) -
        intersection;


    if (union <= 0) {
        return 0;
    }


    return (
        intersection /
        union
    );

}


/* =========================================================
   RECT FROM CENTER
========================================================= */

function rectFromCenter(
    centerX,
    centerY,
    width,
    height
) {

    const w =
        Math.max(
            0,
            toNumber(width)
        );

    const h =
        Math.max(
            0,
            toNumber(height)
        );


    const x =
        toNumber(centerX);

    const y =
        toNumber(centerY);


    return {

        left:
            x - w / 2,

        top:
            y - h / 2,

        right:
            x + w / 2,

        bottom:
            y + h / 2,

        width:
            w,

        height:
            h

    };

}


/* =========================================================
   NORMALIZE RECT
========================================================= */

function normalizeRect(
    rect
) {

    if (!rect) {
        return null;
    }


    let left =
        toNumber(rect.left);

    let right =
        toNumber(rect.right);

    let top =
        toNumber(rect.top);

    let bottom =
        toNumber(rect.bottom);


    if (right < left) {

        const temp =
            left;

        left =
            right;

        right =
            temp;

    }


    if (bottom < top) {

        const temp =
            top;

        top =
            bottom;

        bottom =
            temp;

    }


    return {

        left,
        top,
        right,
        bottom,

        width:
            right - left,

        height:
            bottom - top

    };

}


/* =========================================================
   CLAMP POINT TO RECT
========================================================= */

function clampPointToRect(
    point,
    rect
) {

    if (!point || !rect) {

        return {
            x: 0,
            y: 0
        };

    }


    return {

        x:
            clamp(
                point.x,
                rect.left,
                rect.right
            ),

        y:
            clamp(
                point.y,
                rect.top,
                rect.bottom
            )

    };

}


/* =========================================================
   NORMALIZED POINT
========================================================= */

function normalizePoint(
    x,
    y,
    width,
    height
) {

    const w =
        Math.max(
            1,
            toNumber(width, 1)
        );

    const h =
        Math.max(
            1,
            toNumber(height, 1)
        );


    return {

        x:
            clamp(
                toNumber(x) / w,
                0,
                1
            ),

        y:
            clamp(
                toNumber(y) / h,
                0,
                1
            )

    };

}


/* =========================================================
   DENORMALIZE POINT
========================================================= */

function denormalizePoint(
    x,
    y,
    width,
    height
) {

    return {

        x:
            clamp(
                toNumber(x),
                0,
                1
            ) *
            toNumber(width),

        y:
            clamp(
                toNumber(y),
                0,
                1
            ) *
            toNumber(height)

    };

}


/* =========================================================
   NORMALIZE RECT
========================================================= */

function normalizeRectToUnit(
    rect,
    width,
    height
) {

    if (!rect) {
        return null;
    }


    const w =
        Math.max(
            1,
            toNumber(width, 1)
        );

    const h =
        Math.max(
            1,
            toNumber(height, 1)
        );


    return {

        left:
            clamp(
                rect.left / w,
                0,
                1
            ),

        top:
            clamp(
                rect.top / h,
                0,
                1
            ),

        right:
            clamp(
                rect.right / w,
                0,
                1
            ),

        bottom:
            clamp(
                rect.bottom / h,
                0,
                1
            ),

        width:
            clamp(
                rectWidth(rect) / w,
                0,
                1
            ),

        height:
            clamp(
                rectHeight(rect) / h,
                0,
                1
            )

    };

}


/* =========================================================
   DENORMALIZE RECT
========================================================= */

function denormalizeRect(
    rect,
    width,
    height
) {

    if (!rect) {
        return null;
    }


    const w =
        toNumber(width);

    const h =
        toNumber(height);


    return {

        left:
            rect.left * w,

        top:
            rect.top * h,

        right:
            rect.right * w,

        bottom:
            rect.bottom * h,

        width:
            rect.width * w,

        height:
            rect.height * h

    };

}


/* =========================================================
   UUID
========================================================= */

function createId(
    prefix = "id"
) {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {

        return (
            prefix +
            "_" +
            crypto.randomUUID()
        );

    }


    return (

        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 10)

    );

}


/* =========================================================
   DEEP CLONE
========================================================= */

function deepClone(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return value;

    }


    if (
        typeof structuredClone ===
        "function"
    ) {

        try {

            return structuredClone(
                value
            );

        }
        catch (_) {}

    }


    return JSON.parse(
        JSON.stringify(value)
    );

}


/* =========================================================
   COLOR VALIDATION
========================================================= */

function isValidColor(
    color
) {

    if (
        typeof color !==
        "string"
    ) {

        return false;

    }


    const value =
        color.trim();


    if (!value) {
        return false;
    }


    const element =
        document.createElement(
            "div"
        );


    element.style.color =
        value;


    return (
        element.style.color !== ""
    );

}


/* =========================================================
   HEX COLOR
========================================================= */

function normalizeColor(
    color,
    fallback = "#ff0000"
) {

    if (
        !isValidColor(color)
    ) {

        return fallback;

    }


    return color;

}


/* =========================================================
   TIME FORMAT
========================================================= */

function formatTime(
    seconds
) {

    const total =
        Math.max(
            0,
            Math.floor(
                toNumber(seconds)
            )
        );


    const minutes =
        Math.floor(
            total / 60
        );


    const secs =
        total % 60;


    return (

        String(minutes)
            .padStart(2, "0") +

        ":" +

        String(secs)
            .padStart(2, "0")

    );

}


/* =========================================================
   EVENT EMITTER
========================================================= */

class SimpleEventEmitter {

    constructor() {

        this.events =
            new Map();

    }


    on(
        event,
        callback
    ) {

        if (
            typeof callback !==
            "function"
        ) {

            return () => {};

        }


        if (
            !this.events.has(event)
        ) {

            this.events.set(
                event,
                new Set()
            );

        }


        const listeners =
            this.events.get(
                event
            );


        listeners.add(
            callback
        );


        return () => {

            listeners.delete(
                callback
            );

        };

    }


    off(
        event,
        callback
    ) {

        const listeners =
            this.events.get(
                event
            );


        if (!listeners) {
            return;
        }


        listeners.delete(
            callback
        );

    }


    emit(
        event,
        ...args
    ) {

        const listeners =
            this.events.get(
                event
            );


        if (!listeners) {
            return;
        }


        for (
            const callback
            of [...listeners]
        ) {

            try {

                callback(
                    ...args
                );

            }
            catch (error) {

                console.error(
                    error
                );

            }

        }

    }


    clear() {

        this.events.clear();

    }

}


/* =========================================================
   DOM HELPER
========================================================= */

function $(selector) {

    if (
        typeof document ===
        "undefined"
    ) {

        return null;

    }


    return document.querySelector(
        selector
    );

}


/* =========================================================
   GET ELEMENT BY ID
========================================================= */

function getElement(
    id
) {

    if (
        typeof document ===
        "undefined"
    ) {

        return null;

    }


    return document.getElementById(
        id
    );

}


/* =========================================================
   SAFE CLASS TOGGLE
========================================================= */

function toggleClass(
    element,
    className,
    enabled
) {

    if (
        !element ||
        !element.classList
    ) {

        return;

    }


    element.classList.toggle(
        className,
        Boolean(enabled)
    );

}


/* =========================================================
   RAF
========================================================= */

function nextFrame(
    callback
) {

    if (
        typeof requestAnimationFrame ===
        "function"
    ) {

        return requestAnimationFrame(
            callback
        );

    }


    return setTimeout(
        callback,
        16
    );

}


/* =========================================================
   SAFE JSON
========================================================= */

function safeJsonParse(
    value,
    fallback = null
) {

    try {

        return JSON.parse(
            value
        );

    }
    catch (_) {

        return fallback;

    }

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

if (
    typeof window !==
    "undefined"
) {

    window.toNumber =
        toNumber;

    window.clamp =
        clamp;

    window.lerp =
        lerp;

    window.distance =
        distance;

    window.pointDistance =
        pointDistance;

    window.rectCenter =
        rectCenter;

    window.rectWidth =
        rectWidth;

    window.rectHeight =
        rectHeight;

    window.rectArea =
        rectArea;

    window.rectIoU =
        rectIoU;

    window.rectFromCenter =
        rectFromCenter;

    window.normalizeRect =
        normalizeRect;

    window.clampPointToRect =
        clampPointToRect;

    window.normalizePoint =
        normalizePoint;

    window.denormalizePoint =
        denormalizePoint;

    window.normalizeRectToUnit =
        normalizeRectToUnit;

    window.denormalizeRect =
        denormalizeRect;

    window.createId =
        createId;

    window.deepClone =
        deepClone;

    window.isValidColor =
        isValidColor;

    window.normalizeColor =
        normalizeColor;

    window.formatTime =
        formatTime;

    window.SimpleEventEmitter =
        SimpleEventEmitter;

    window.$ =
        $;

    window.getElement =
        getElement;

    window.toggleClass =
        toggleClass;

    window.nextFrame =
        nextFrame;

    window.safeJsonParse =
        safeJsonParse;

}