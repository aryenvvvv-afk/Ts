/* =========================================
   VIDEO OBJECT TRACKER
   utils.js
   FILE 4 / 10
========================================= */

"use strict";


window.TrackerUtils = {

    /* =====================================
       NUMBER
    ====================================== */

    clamp(
        value,
        min,
        max
    ) {

        value = Number(value);

        if (!Number.isFinite(value)) {
            value = min;
        }

        return Math.max(
            min,
            Math.min(
                max,
                value
            )
        );

    },


    /* =====================================
       LINEAR INTERPOLATION
    ====================================== */

    lerp(
        start,
        end,
        amount
    ) {

        amount =
            this.clamp(
                Number(amount) || 0,
                0,
                1
            );

        return (
            Number(start) +
            (
                Number(end) -
                Number(start)
            ) *
            amount
        );

    },


    /* =====================================
       DISTANCE
    ====================================== */

    distance(
        x1,
        y1,
        x2,
        y2
    ) {

        const dx =
            Number(x2) -
            Number(x1);

        const dy =
            Number(y2) -
            Number(y1);

        return Math.sqrt(
            dx * dx +
            dy * dy
        );

    },


    /* =====================================
       RECTANGLE CENTER
    ====================================== */

    rectCenter(
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
                Number(rect.x || 0) +
                Number(rect.width || 0) / 2,

            y:
                Number(rect.y || 0) +
                Number(rect.height || 0) / 2

        };

    },


    /* =====================================
       RECTANGLE DISTANCE
    ====================================== */

    rectDistance(
        a,
        b
    ) {

        const ca =
            this.rectCenter(a);

        const cb =
            this.rectCenter(b);

        return this.distance(
            ca.x,
            ca.y,
            cb.x,
            cb.y
        );

    },


    /* =====================================
       RECTANGLE COPY
    ====================================== */

    cloneRect(
        rect
    ) {

        if (!rect) {
            return null;
        }

        return {

            x:
                Number(rect.x || 0),

            y:
                Number(rect.y || 0),

            width:
                Number(rect.width || 0),

            height:
                Number(rect.height || 0)

        };

    },


    /* =====================================
       POINT
    ====================================== */

    point(
        x,
        y
    ) {

        return {

            x: Number(x) || 0,

            y: Number(y) || 0

        };

    },


    /* =====================================
       NORMALIZE RECT
    ====================================== */

    normalizeRect(
        rect
    ) {

        if (!rect) {
            return null;
        }


        let x =
            Number(rect.x) || 0;

        let y =
            Number(rect.y) || 0;

        let width =
            Number(rect.width) || 0;

        let height =
            Number(rect.height) || 0;


        if (width < 0) {

            x += width;

            width =
                Math.abs(width);

        }


        if (height < 0) {

            y += height;

            height =
                Math.abs(height);

        }


        return {

            x,

            y,

            width,

            height

        };

    },


    /* =====================================
       POINT INSIDE RECTANGLE
    ====================================== */

    pointInRect(
        x,
        y,
        rect
    ) {

        if (!rect) {
            return false;
        }


        return (

            x >= rect.x &&

            x <=
                rect.x +
                rect.width &&

            y >= rect.y &&

            y <=
                rect.y +
                rect.height

        );

    },


    /* =====================================
       RECTANGLE OVERLAP
    ====================================== */

    rectanglesOverlap(
        a,
        b
    ) {

        if (!a || !b) {
            return false;
        }


        return !(
            a.x +
            a.width <
            b.x ||

            b.x +
            b.width <
            a.x ||

            a.y +
            a.height <
            b.y ||

            b.y +
            b.height <
            a.y
        );

    },


    /* =====================================
       MAP VALUE
    ====================================== */

    mapRange(
        value,
        inMin,
        inMax,
        outMin,
        outMax
    ) {

        if (
            inMax === inMin
        ) {

            return outMin;

        }


        const ratio =
            (
                value -
                inMin
            ) /
            (
                inMax -
                inMin
            );


        return (
            outMin +
            ratio *
            (
                outMax -
                outMin
            )
        );

    },


    /* =====================================
       VIDEO → DISPLAY COORDINATES
    ====================================== */

    videoToDisplayPoint(
        x,
        y,
        videoWidth,
        videoHeight,
        displayWidth,
        displayHeight
    ) {

        videoWidth =
            Number(videoWidth) || 1;

        videoHeight =
            Number(videoHeight) || 1;

        displayWidth =
            Number(displayWidth) || 1;

        displayHeight =
            Number(displayHeight) || 1;


        /*
         * object-fit: contain
         *
         * Calculate the actual displayed
         * video rectangle.
         */

        const scale =
            Math.min(
                displayWidth /
                    videoWidth,

                displayHeight /
                    videoHeight
            );


        const renderedWidth =
            videoWidth *
            scale;


        const renderedHeight =
            videoHeight *
            scale;


        const offsetX =
            (
                displayWidth -
                renderedWidth
            ) / 2;


        const offsetY =
            (
                displayHeight -
                renderedHeight
            ) / 2;


        return {

            x:
                offsetX +
                Number(x) *
                scale,

            y:
                offsetY +
                Number(y) *
                scale

        };

    },


    /* =====================================
       DISPLAY → VIDEO COORDINATES
    ====================================== */

    displayToVideoPoint(
        x,
        y,
        videoWidth,
        videoHeight,
        displayWidth,
        displayHeight
    ) {

        videoWidth =
            Number(videoWidth) || 1;

        videoHeight =
            Number(videoHeight) || 1;

        displayWidth =
            Number(displayWidth) || 1;

        displayHeight =
            Number(displayHeight) || 1;


        const scale =
            Math.min(
                displayWidth /
                    videoWidth,

                displayHeight /
                    videoHeight
            );


        const renderedWidth =
            videoWidth *
            scale;


        const renderedHeight =
            videoHeight *
            scale;


        const offsetX =
            (
                displayWidth -
                renderedWidth
            ) / 2;


        const offsetY =
            (
                displayHeight -
                renderedHeight
            ) / 2;


        return {

            x:
                (
                    Number(x) -
                    offsetX
                ) /
                scale,

            y:
                (
                    Number(y) -
                    offsetY
                ) /
                scale

        };

    },


    /* =====================================
       VIDEO → DISPLAY RECTANGLE
    ====================================== */

    videoToDisplayRect(
        rect,
        videoWidth,
        videoHeight,
        displayWidth,
        displayHeight
    ) {

        if (!rect) {
            return null;
        }


        const topLeft =
            this.videoToDisplayPoint(
                rect.x,
                rect.y,
                videoWidth,
                videoHeight,
                displayWidth,
                displayHeight
            );


        const bottomRight =
            this.videoToDisplayPoint(
                rect.x +
                    rect.width,

                rect.y +
                    rect.height,

                videoWidth,
                videoHeight,
                displayWidth,
                displayHeight
            );


        return {

            x:
                topLeft.x,

            y:
                topLeft.y,

            width:
                bottomRight.x -
                topLeft.x,

            height:
                bottomRight.y -
                topLeft.y

        };

    },


    /* =====================================
       DISPLAY → VIDEO RECTANGLE
    ====================================== */

    displayToVideoRect(
        rect,
        videoWidth,
        videoHeight,
        displayWidth,
        displayHeight
    ) {

        if (!rect) {
            return null;
        }


        const topLeft =
            this.displayToVideoPoint(
                rect.x,
                rect.y,
                videoWidth,
                videoHeight,
                displayWidth,
                displayHeight
            );


        const bottomRight =
            this.displayToVideoPoint(
                rect.x +
                    rect.width,

                rect.y +
                    rect.height,

                videoWidth,
                videoHeight,
                displayWidth,
                displayHeight
            );


        return {

            x:
                topLeft.x,

            y:
                topLeft.y,

            width:
                bottomRight.x -
                topLeft.x,

            height:
                bottomRight.y -
                topLeft.y

        };

    },


    /* =====================================
       POINTER POSITION
    ====================================== */

    getPointerPosition(
        event,
        element
    ) {

        if (!element) {

            return {

                x: 0,

                y: 0

            };

        }


        const rect =
            element.getBoundingClientRect();


        let clientX =
            0;

        let clientY =
            0;


        if (
            event.touches &&
            event.touches.length
        ) {

            clientX =
                event.touches[0].clientX;

            clientY =
                event.touches[0].clientY;

        }

        else if (
            event.changedTouches &&
            event.changedTouches.length
        ) {

            clientX =
                event.changedTouches[0]
                    .clientX;

            clientY =
                event.changedTouches[0]
                    .clientY;

        }

        else {

            clientX =
                event.clientX;

            clientY =
                event.clientY;

        }


        return {

            x:
                clientX -
                rect.left,

            y:
                clientY -
                rect.top

        };

    },


    /* =====================================
       POINTER → VIDEO
    ====================================== */

    pointerToVideo(
        event,
        stage,
        video
    ) {

        const point =
            this.getPointerPosition(
                event,
                stage
            );


        if (!video) {
            return point;
        }


        return this.displayToVideoPoint(

            point.x,

            point.y,

            video.videoWidth ||
                video.clientWidth ||
                1,

            video.videoHeight ||
                video.clientHeight ||
                1,

            stage.clientWidth ||
                1,

            stage.clientHeight ||
                1

        );

    },


    /* =====================================
       FORMAT TIME
    ====================================== */

    formatTime(
        seconds
    ) {

        seconds =
            Number(seconds);


        if (
            !Number.isFinite(
                seconds
            ) ||
            seconds < 0
        ) {

            seconds = 0;

        }


        const hours =
            Math.floor(
                seconds / 3600
            );


        const minutes =
            Math.floor(
                (
                    seconds %
                    3600
                ) / 60
            );


        const secs =
            Math.floor(
                seconds % 60
            );


        const pad =
            value =>
                String(value)
                    .padStart(
                        2,
                        "0"
                    );


        if (hours > 0) {

            return (
                pad(hours) +
                ":" +
                pad(minutes) +
                ":" +
                pad(secs)
            );

        }


        return (
            pad(minutes) +
            ":" +
            pad(secs)
        );

    },


    /* =====================================
       UUID
    ====================================== */

    createId(
        prefix = "tracker"
    ) {

        if (
            typeof crypto !==
            "undefined" &&
            typeof crypto.randomUUID ===
            "function"
        ) {

            return (
                prefix +
                "-" +
                crypto.randomUUID()
            );

        }


        return (
            prefix +
            "-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2)
        );

    },


    /* =====================================
       COLOR VALIDATION
    ====================================== */

    isValidColor(
        color
    ) {

        if (
            typeof color !==
            "string"
        ) {

            return false;

        }


        return /^#[0-9a-fA-F]{6}$/
            .test(color);

    },


    /* =====================================
       NORMALIZE COLOR
    ====================================== */

    normalizeColor(
        color,
        fallback = "#00ff66"
    ) {

        if (
            this.isValidColor(
                color
            )
        ) {

            return color;

        }


        return fallback;

    },


    /* =====================================
       DEEP CLONE
    ====================================== */

    clone(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return value;

        }


        try {

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch (_) {

            return value;

        }

    },


    /* =====================================
       IS MOBILE
    ====================================== */

    isMobile() {

        return (
            window.matchMedia &&
            window.matchMedia(
                "(max-width: 700px)"
            ).matches
        );

    },


    /* =====================================
       SAFE NUMBER
    ====================================== */

    number(
        value,
        fallback = 0
    ) {

        const number =
            Number(value);


        return Number.isFinite(
            number
        )
            ? number
            : fallback;

    },


    /* =====================================
       REQUEST ANIMATION
    ====================================== */

    nextFrame(
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

    },


    /* =====================================
       CANCEL ANIMATION
    ====================================== */

    cancelFrame(
        id
    ) {

        if (
            typeof cancelAnimationFrame ===
            "function"
        ) {

            cancelAnimationFrame(
                id
            );

        } else {

            clearTimeout(id);

        }

    }

};