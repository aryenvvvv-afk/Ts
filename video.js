"use strict";

/*
 * video.js
 *
 * Video handling + responsive coordinate conversion.
 * Tracker coordinates हमेशा displayed video area के हिसाब से
 * calculate किए जाते हैं, इसलिए अलग screen sizes पर भी सही रहेंगे.
 */

class VideoController {

    constructor(options = {}) {

        this.video =
            options.video || null;

        this.container =
            options.container || null;

        this.fileInput =
            options.fileInput || null;

        this.onLoaded =
            typeof options.onLoaded === "function"
                ? options.onLoaded
                : null;

        this.onTimeUpdate =
            typeof options.onTimeUpdate === "function"
                ? options.onTimeUpdate
                : null;

        this.onPlay =
            typeof options.onPlay === "function"
                ? options.onPlay
                : null;

        this.onPause =
            typeof options.onPause === "function"
                ? options.onPause
                : null;

        this.onStop =
            typeof options.onStop === "function"
                ? options.onStop
                : null;

        this.objectUrl =
            null;

        this.loaded =
            false;

        this._bindEvents();
    }


    /* =================================================
       EVENTS
    ================================================= */

    _bindEvents() {

        if (!this.video) {
            return;
        }

        this.video.addEventListener(
            "loadedmetadata",
            () => {

                this.loaded =
                    true;

                this._resizeVideo();

                if (this.onLoaded) {
                    this.onLoaded(
                        this.getVideoInfo()
                    );
                }

            }
        );


        this.video.addEventListener(
            "timeupdate",
            () => {

                if (this.onTimeUpdate) {

                    this.onTimeUpdate(
                        this.video.currentTime
                    );

                }

            }
        );


        this.video.addEventListener(
            "play",
            () => {

                if (this.onPlay) {
                    this.onPlay();
                }

            }
        );


        this.video.addEventListener(
            "pause",
            () => {

                if (this.onPause) {
                    this.onPause();
                }

            }
        );


        window.addEventListener(
            "resize",
            () => {

                this._resizeVideo();

            }
        );

    }


    /* =================================================
       LOAD FILE
    ================================================= */

    loadFile(file) {

        if (!file) {
            return false;
        }


        if (
            !file.type ||
            !file.type.startsWith("video/")
        ) {

            return false;

        }


        this._revokeObjectUrl();


        this.objectUrl =
            URL.createObjectURL(
                file
            );


        this.loaded =
            false;


        this.video.src =
            this.objectUrl;


        this.video.load();


        return true;

    }


    /* =================================================
       LOAD URL
    ================================================= */

    loadUrl(url) {

        if (!url) {
            return false;
        }


        this._revokeObjectUrl();


        this.loaded =
            false;


        this.video.src =
            url;


        this.video.load();


        return true;

    }


    /* =================================================
       PLAY
    ================================================= */

    play() {

        if (
            !this.video ||
            !this.loaded
        ) {

            return false;

        }


        const promise =
            this.video.play();


        if (
            promise &&
            typeof promise.catch ===
            "function"
        ) {

            promise.catch(
                error => {

                    console.warn(
                        "Video play failed:",
                        error
                    );

                }
            );

        }


        return true;

    }


    /* =================================================
       PAUSE
    ================================================= */

    pause() {

        if (!this.video) {
            return;
        }

        this.video.pause();

    }


    /* =================================================
       STOP
    ================================================= */

    stop() {

        if (!this.video) {
            return;
        }


        this.video.pause();


        try {

            this.video.currentTime =
                0;

        }
        catch (_) {}


        if (this.onStop) {
            this.onStop();
        }

    }


    /* =================================================
       RESET
    ================================================= */

    reset() {

        this.stop();


        this.loaded =
            false;


        this.video.removeAttribute(
            "src"
        );


        this.video.load();

    }


    /* =================================================
       CURRENT TIME
    ================================================= */

    getCurrentTime() {

        if (!this.video) {
            return 0;
        }

        return (
            Number(
                this.video.currentTime
            ) || 0
        );

    }


    /* =================================================
       DURATION
    ================================================= */

    getDuration() {

        if (!this.video) {
            return 0;
        }

        return (
            Number(
                this.video.duration
            ) || 0
        );

    }


    /* =================================================
       VIDEO INFO
    ================================================= */

    getVideoInfo() {

        if (!this.video) {

            return {

                width: 0,
                height: 0,
                duration: 0,
                currentTime: 0

            };

        }


        return {

            width:
                this.video.videoWidth,

            height:
                this.video.videoHeight,

            duration:
                this.video.duration || 0,

            currentTime:
                this.video.currentTime || 0

        };

    }


    /* =================================================
       RESPONSIVE VIDEO
    ================================================= */

    _resizeVideo() {

        if (
            !this.video ||
            !this.container
        ) {

            return;

        }


        /*
         * Video को container से बाहर जाने से रोकता है.
         */
        this.video.style.maxWidth =
            "100%";

        this.video.style.maxHeight =
            "100%";

        this.video.style.width =
            "100%";

        this.video.style.height =
            "100%";

        this.video.style.objectFit =
            "contain";

    }


    /* =================================================
       DISPLAY RECT
    ================================================= */

    getDisplayRect() {

        if (!this.video) {
            return null;
        }


        return this.video.getBoundingClientRect();

    }


    /* =================================================
       SCREEN -> VIDEO COORDINATES
    ================================================= */

    screenToVideo(
        screenX,
        screenY
    ) {

        const rect =
            this.getDisplayRect();


        if (
            !rect ||
            rect.width <= 0 ||
            rect.height <= 0
        ) {

            return {

                x: 0,
                y: 0

            };

        }


        /*
         * IMPORTANT:
         *
         * getBoundingClientRect() में पूरा
         * displayed video box मिलता है।
         *
         * Object-fit: contain की वजह से video के
         * अंदर letterbox area हो सकता है।
         *
         * इसलिए actual visible video rectangle
         * निकालते हैं।
         */

        const visible =
            this.getVisibleVideoRect();


        if (!visible) {

            return {

                x: 0,
                y: 0

            };

        }


        const x =
            (
                screenX -
                visible.left
            ) *
            (
                this.video.videoWidth /
                visible.width
            );


        const y =
            (
                screenY -
                visible.top
            ) *
            (
                this.video.videoHeight /
                visible.height
            );


        return {

            x:
                this._clamp(
                    x,
                    0,
                    this.video.videoWidth
                ),

            y:
                this._clamp(
                    y,
                    0,
                    this.video.videoHeight
                )

        };

    }


    /* =================================================
       VIDEO -> SCREEN COORDINATES
    ================================================= */

    videoToScreen(
        videoX,
        videoY
    ) {

        const visible =
            this.getVisibleVideoRect();


        if (
            !visible
        ) {

            return {

                x: 0,
                y: 0

            };

        }


        return {

            x:
                visible.left +
                (
                    videoX /
                    this.video.videoWidth
                ) *
                visible.width,

            y:
                visible.top +
                (
                    videoY /
                    this.video.videoHeight
                ) *
                visible.height

        };

    }


    /* =================================================
       VIDEO SIZE -> SCREEN SIZE
    ================================================= */

    videoSizeToScreen(
        width,
        height
    ) {

        const visible =
            this.getVisibleVideoRect();


        if (
            !visible ||
            !this.video.videoWidth ||
            !this.video.videoHeight
        ) {

            return {

                width,
                height

            };

        }


        return {

            width:
                width *
                (
                    visible.width /
                    this.video.videoWidth
                ),

            height:
                height *
                (
                    visible.height /
                    this.video.videoHeight
                )

        };

    }


    /* =================================================
       GET VISIBLE VIDEO RECT
    ================================================= */

    getVisibleVideoRect() {

        if (
            !this.video ||
            !this.video.videoWidth ||
            !this.video.videoHeight
        ) {

            return null;

        }


        const rect =
            this.video.getBoundingClientRect();


        const videoAspect =
            this.video.videoWidth /
            this.video.videoHeight;


        const boxAspect =
            rect.width /
            rect.height;


        let width;
        let height;
        let left;
        let top;


        if (
            boxAspect >
            videoAspect
        ) {

            /*
             * Side letterbox.
             */
            height =
                rect.height;

            width =
                height *
                videoAspect;

            left =
                rect.left +
                (
                    rect.width -
                    width
                ) /
                2;

            top =
                rect.top;

        }

        else {

            /*
             * Top/bottom letterbox.
             */
            width =
                rect.width;

            height =
                width /
                videoAspect;

            left =
                rect.left;

            top =
                rect.top +
                (
                    rect.height -
                    height
                ) /
                2;

        }


        return {

            left,
            top,
            width,
            height,

            right:
                left + width,

            bottom:
                top + height

        };

    }


    /* =================================================
       POINT INSIDE VIDEO
    ================================================= */

    isInsideVideo(
        screenX,
        screenY
    ) {

        const rect =
            this.getVisibleVideoRect();


        if (!rect) {
            return false;
        }


        return (

            screenX >= rect.left &&

            screenX <= rect.right &&

            screenY >= rect.top &&

            screenY <= rect.bottom

        );

    }


    /* =================================================
       SEEK
    ================================================= */

    seek(
        seconds
    ) {

        if (
            !this.video ||
            !this.loaded
        ) {

            return false;

        }


        const duration =
            this.getDuration();


        this.video.currentTime =
            this._clamp(
                Number(seconds) || 0,
                0,
                duration
            );


        return true;

    }


    /* =================================================
       SEEK PERCENT
    ================================================= */

    seekPercent(
        percent
    ) {

        const duration =
            this.getDuration();


        if (!duration) {
            return false;
        }


        const value =
            this._clamp(
                Number(percent) || 0,
                0,
                1
            );


        this.video.currentTime =
            duration *
            value;


        return true;

    }


    /* =================================================
       FRAME STEP
    ================================================= */

    stepFrame(
        fps = 30
    ) {

        if (
            !this.video ||
            !this.loaded
        ) {

            return false;

        }


        const frameTime =
            1 /
            Math.max(
                1,
                Number(fps) || 30
            );


        this.video.currentTime =
            this._clamp(
                this.video.currentTime +
                frameTime,
                0,
                this.getDuration()
            );


        return true;

    }


    /* =================================================
       REWIND FRAME
    ================================================= */

    previousFrame(
        fps = 30
    ) {

        if (
            !this.video ||
            !this.loaded
        ) {

            return false;

        }


        const frameTime =
            1 /
            Math.max(
                1,
                Number(fps) || 30
            );


        this.video.currentTime =
            this._clamp(
                this.video.currentTime -
                frameTime,
                0,
                this.getDuration()
            );


        return true;

    }


    /* =================================================
       CLEANUP
    ================================================= */

    destroy() {

        this.pause();


        this._revokeObjectUrl();


        if (this.video) {

            this.video.removeAttribute(
                "src"
            );

            this.video.load();

        }

    }


    /* =================================================
       REVOKE OBJECT URL
    ================================================= */

    _revokeObjectUrl() {

        if (
            this.objectUrl
        ) {

            URL.revokeObjectURL(
                this.objectUrl
            );

            this.objectUrl =
                null;

        }

    }


    /* =================================================
       CLAMP
    ================================================= */

    _clamp(
        value,
        min,
        max
    ) {

        return Math.max(
            min,
            Math.min(
                max,
                value
            )
        );

    }

}


/* =====================================================
   GLOBAL EXPORT
===================================================== */

if (
    typeof window !==
    "undefined"
) {

    window.VideoController =
        VideoController;

}


if (
    typeof module !==
    "undefined" &&
    module.exports
) {

    module.exports =
        VideoController;

}