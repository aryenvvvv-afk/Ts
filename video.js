"use strict";

/*
 * =========================================================
 * video.js
 * Object Tracker
 *
 * Handles:
 * - Video file upload
 * - Video loading
 * - Responsive video sizing
 * - Play / Pause / Stop
 * - Video coordinate conversion
 * - Letterbox / object-fit: contain handling
 * - Resize handling
 * =========================================================
 */

class VideoController {

    constructor() {

        this.video = null;
        this.stage = null;
        this.input = null;

        this.emptyState = null;
        this.loading = null;
        this.errorBox = null;

        this.objectUrl = null;

        this.videoWidth = 0;
        this.videoHeight = 0;

        this.displayWidth = 0;
        this.displayHeight = 0;

        this.displayLeft = 0;
        this.displayTop = 0;

        this.loaded = false;

        this.events =
            new SimpleEventEmitter();

        this.resizeObserver = null;

        this.boundResize =
            this.updateLayout.bind(this);

        this.boundMetadata =
            this.handleMetadata.bind(this);

        this.boundLoadedData =
            this.handleLoadedData.bind(this);

        this.boundError =
            this.handleVideoError.bind(this);

        this.init();

    }


    /* =====================================================
       INIT
    ===================================================== */

    init() {

        this.video =
            getElement(
                APP_CONFIG.ui.elements.video
            );

        this.stage =
            getElement(
                APP_CONFIG.ui.elements.videoStage
            );

        this.input =
            getElement(
                APP_CONFIG.ui.elements.videoInput
            );

        this.emptyState =
            getElement(
                APP_CONFIG.ui.elements.emptyState
            );

        this.loading =
            getElement(
                APP_CONFIG.ui.elements.videoLoading
            );

        this.errorBox =
            getElement(
                APP_CONFIG.ui.elements.videoError
            );


        if (!this.video) {

            console.error(
                "Video element not found."
            );

            return;

        }


        this.video.addEventListener(
            "loadedmetadata",
            this.boundMetadata
        );


        this.video.addEventListener(
            "loadeddata",
            this.boundLoadedData
        );


        this.video.addEventListener(
            "error",
            this.boundError
        );


        this.video.addEventListener(
            "play",
            () => {

                this.events.emit(
                    "play",
                    this.video
                );

            }
        );


        this.video.addEventListener(
            "pause",
            () => {

                this.events.emit(
                    "pause",
                    this.video
                );

            }
        );


        this.video.addEventListener(
            "ended",
            () => {

                this.events.emit(
                    "ended",
                    this.video
                );

            }
        );


        if (this.input) {

            this.input.addEventListener(
                "change",
                event => {

                    const files =
                        event.target.files;

                    if (
                        files &&
                        files.length
                    ) {

                        this.loadFile(
                            files[0]
                        );

                    }

                    /*
                     * Same file को दोबारा select
                     * करने की अनुमति.
                     */
                    event.target.value = "";

                }
            );

        }


        window.addEventListener(
            "resize",
            this.boundResize,
            {
                passive: true
            }
        );


        /*
         * ResizeObserver available होने पर
         * stage के exact size को track करें.
         */
        if (
            typeof ResizeObserver !==
            "undefined" &&
            this.stage
        ) {

            this.resizeObserver =
                new ResizeObserver(
                    () => {

                        this.updateLayout();

                    }
                );


            this.resizeObserver.observe(
                this.stage
            );

        }


        this.updateLayout();

    }


    /* =====================================================
       LOAD FILE
    ===================================================== */

    loadFile(
        file
    ) {

        if (!(file instanceof File)) {

            this.showError(
                "Please select a valid video file."
            );

            return false;

        }


        /*
         * Browser द्वारा video/* files accept करें.
         */
        if (
            file.type &&
            !file.type.startsWith("video/")
        ) {

            this.showError(
                "Please select a video file."
            );

            return false;

        }


        this.showLoading();

        this.clearError();


        /*
         * पुराने Object URL को revoke करें.
         */
        this.revokeObjectUrl();


        /*
         * नया local URL.
         *
         * Netlify पर upload की जरूरत नहीं.
         * Browser local file को सीधे पढ़ सकता है.
         */
        this.objectUrl =
            URL.createObjectURL(
                file
            );


        this.loaded =
            false;


        this.videoWidth =
            0;

        this.videoHeight =
            0;


        /*
         * पहले src clear करें ताकि browser
         * पुरानी video state use न करे.
         */
        this.video.removeAttribute(
            "src"
        );


        this.video.load();


        /*
         * नया source.
         */
        this.video.src =
            this.objectUrl;


        /*
         * Important:
         * Mobile browsers के लिए.
         */
        this.video.playsInline =
            true;

        this.video.setAttribute(
            "playsinline",
            ""
        );


        this.video.setAttribute(
            "webkit-playsinline",
            ""
        );


        /*
         * Browser को video decode करने के लिए
         * फिर से load करें.
         */
        this.video.load();


        this.events.emit(
            "loading",
            file
        );


        return true;

    }


    /* =====================================================
       METADATA
    ===================================================== */

    handleMetadata() {

        if (!this.video) {
            return;
        }


        this.videoWidth =
            this.video.videoWidth;

        this.videoHeight =
            this.video.videoHeight;


        if (
            this.videoWidth <= 0 ||
            this.videoHeight <= 0
        ) {

            this.showError(
                "Video dimensions could not be detected."
            );

            return;

        }


        this.loaded =
            true;


        this.updateLayout();


        this.hideLoading();

        this.hideEmptyState();

        this.clearError();


        this.events.emit(
            "metadata",
            this.getVideoInfo()
        );

    }


    /* =====================================================
       LOADED DATA
    ===================================================== */

    handleLoadedData() {

        if (!this.video) {
            return;
        }


        this.loaded =
            true;


        this.hideLoading();

        this.hideEmptyState();

        this.clearError();


        this.updateLayout();


        this.events.emit(
            "loaded",
            this.getVideoInfo()
        );

    }


    /* =====================================================
       VIDEO ERROR
    ===================================================== */

    handleVideoError() {

        const mediaError =
            this.video &&
            this.video.error;


        let message =
            "Unable to load this video.";


        if (mediaError) {

            switch (
                mediaError.code
            ) {

                case 1:
                    message =
                        "Video loading was aborted.";
                    break;

                case 2:
                    message =
                        "A network error occurred.";
                    break;

                case 3:
                    message =
                        "The video could not be decoded.";
                    break;

                case 4:
                    message =
                        "This video format is not supported by your browser.";
                    break;

            }

        }


        this.loaded =
            false;


        this.hideLoading();


        this.showError(
            message
        );


        this.events.emit(
            "error",
            new Error(message)
        );

    }


    /* =====================================================
       UPDATE LAYOUT
    ===================================================== */

    updateLayout() {

        if (
            !this.video ||
            !this.stage
        ) {

            return;

        }


        const stageRect =
            this.stage.getBoundingClientRect();


        const stageWidth =
            stageRect.width;


        const stageHeight =
            stageRect.height;


        if (
            stageWidth <= 0 ||
            stageHeight <= 0
        ) {

            return;

        }


        /*
         * अगर video metadata available नहीं है,
         * तो पूरे stage को display area मानें.
         */
        if (
            this.videoWidth <= 0 ||
            this.videoHeight <= 0
        ) {

            this.displayWidth =
                stageWidth;

            this.displayHeight =
                stageHeight;

            this.displayLeft =
                0;

            this.displayTop =
                0;


            this.events.emit(
                "layout",
                this.getLayout()
            );


            return;

        }


        /*
         * object-fit: contain calculation.
         *
         * यही calculation tracker coordinate
         * conversion में भी use होगी.
         */

        const videoRatio =
            this.videoWidth /
            this.videoHeight;


        const stageRatio =
            stageWidth /
            stageHeight;


        if (
            videoRatio >
            stageRatio
        ) {

            /*
             * Video width के अनुसार fit होगा.
             */

            this.displayWidth =
                stageWidth;

            this.displayHeight =
                stageWidth /
                videoRatio;

            this.displayLeft =
                0;

            this.displayTop =
                (
                    stageHeight -
                    this.displayHeight
                ) / 2;

        }
        else {

            /*
             * Video height के अनुसार fit होगा.
             */

            this.displayHeight =
                stageHeight;

            this.displayWidth =
                stageHeight *
                videoRatio;

            this.displayTop =
                0;

            this.displayLeft =
                (
                    stageWidth -
                    this.displayWidth
                ) / 2;

        }


        this.events.emit(
            "layout",
            this.getLayout()
        );

    }


    /* =====================================================
       GET LAYOUT
    ===================================================== */

    getLayout() {

        return {

            videoWidth:
                this.videoWidth,

            videoHeight:
                this.videoHeight,

            stageWidth:
                this.stage
                    ? this.stage.clientWidth
                    : 0,

            stageHeight:
                this.stage
                    ? this.stage.clientHeight
                    : 0,

            displayWidth:
                this.displayWidth,

            displayHeight:
                this.displayHeight,

            displayLeft:
                this.displayLeft,

            displayTop:
                this.displayTop

        };

    }


    /* =====================================================
       STAGE -> VIDEO COORDINATES
    ===================================================== */

    stageToVideo(
        stageX,
        stageY
    ) {

        if (
            this.displayWidth <= 0 ||
            this.displayHeight <= 0
        ) {

            return null;

        }


        const x =
            (
                stageX -
                this.displayLeft
            ) *
            (
                this.videoWidth /
                this.displayWidth
            );


        const y =
            (
                stageY -
                this.displayTop
            ) *
            (
                this.videoHeight /
                this.displayHeight
            );


        return {

            x:
                clamp(
                    x,
                    0,
                    this.videoWidth
                ),

            y:
                clamp(
                    y,
                    0,
                    this.videoHeight
                )

        };

    }


    /* =====================================================
       VIDEO -> STAGE COORDINATES
    ===================================================== */

    videoToStage(
        videoX,
        videoY
    ) {

        if (
            this.videoWidth <= 0 ||
            this.videoHeight <= 0
        ) {

            return null;

        }


        return {

            x:
                this.displayLeft +
                (
                    videoX /
                    this.videoWidth
                ) *
                this.displayWidth,

            y:
                this.displayTop +
                (
                    videoY /
                    this.videoHeight
                ) *
                this.displayHeight

        };

    }


    /* =====================================================
       VIDEO RECT -> STAGE RECT
    ===================================================== */

    videoRectToStage(
        rect
    ) {

        if (!rect) {
            return null;
        }


        const topLeft =
            this.videoToStage(
                rect.left,
                rect.top
            );


        const bottomRight =
            this.videoToStage(
                rect.right,
                rect.bottom
            );


        if (
            !topLeft ||
            !bottomRight
        ) {

            return null;

        }


        return {

            left:
                topLeft.x,

            top:
                topLeft.y,

            right:
                bottomRight.x,

            bottom:
                bottomRight.y,

            width:
                bottomRight.x -
                topLeft.x,

            height:
                bottomRight.y -
                topLeft.y

        };

    }


    /* =====================================================
       STAGE RECT -> VIDEO RECT
    ===================================================== */

    stageRectToVideo(
        rect
    ) {

        if (!rect) {
            return null;
        }


        const topLeft =
            this.stageToVideo(
                rect.left,
                rect.top
            );


        const bottomRight =
            this.stageToVideo(
                rect.right,
                rect.bottom
            );


        if (
            !topLeft ||
            !bottomRight
        ) {

            return null;

        }


        return {

            left:
                topLeft.x,

            top:
                topLeft.y,

            right:
                bottomRight.x,

            bottom:
                bottomRight.y,

            width:
                bottomRight.x -
                topLeft.x,

            height:
                bottomRight.y -
                topLeft.y

        };

    }


    /* =====================================================
       NORMALIZED VIDEO POSITION
    ===================================================== */

    videoToNormalized(
        x,
        y
    ) {

        if (
            this.videoWidth <= 0 ||
            this.videoHeight <= 0
        ) {

            return null;

        }


        return {

            x:
                clamp(
                    x /
                    this.videoWidth,
                    0,
                    1
                ),

            y:
                clamp(
                    y /
                    this.videoHeight,
                    0,
                    1
                )

        };

    }


    /* =====================================================
       NORMALIZED -> VIDEO
    ===================================================== */

    normalizedToVideo(
        x,
        y
    ) {

        return {

            x:
                clamp(
                    x,
                    0,
                    1
                ) *
                this.videoWidth,

            y:
                clamp(
                    y,
                    0,
                    1
                ) *
                this.videoHeight

        };

    }


    /* =====================================================
       PLAY
    ===================================================== */

    async play() {

        if (
            !this.video ||
            !this.loaded
        ) {

            return false;

        }


        try {

            await this.video.play();

            return true;

        }
        catch (error) {

            console.warn(
                "Video play failed:",
                error
            );


            this.events.emit(
                "playError",
                error
            );


            return false;

        }

    }


    /* =====================================================
       PAUSE
    ===================================================== */

    pause() {

        if (!this.video) {
            return;
        }


        this.video.pause();

    }


    /* =====================================================
       STOP
    ===================================================== */

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


        this.events.emit(
            "stop"
        );

    }


    /* =====================================================
       SEEK
    ===================================================== */

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
            Number.isFinite(
                this.video.duration
            )
                ? this.video.duration
                : 0;


        this.video.currentTime =
            clamp(
                seconds,
                0,
                duration
            );


        return true;

    }


    /* =====================================================
       GET CURRENT TIME
    ===================================================== */

    getCurrentTime() {

        return this.video
            ? this.video.currentTime
            : 0;

    }


    /* =====================================================
       GET DURATION
    ===================================================== */

    getDuration() {

        if (!this.video) {
            return 0;
        }


        return Number.isFinite(
            this.video.duration
        )
            ? this.video.duration
            : 0;

    }


    /* =====================================================
       IS PLAYING
    ===================================================== */

    isPlaying() {

        if (!this.video) {
            return false;
        }


        return (
            !this.video.paused &&
            !this.video.ended &&
            this.video.readyState >= 2
        );

    }


    /* =====================================================
       SHOW / HIDE LOADING
    ===================================================== */

    showLoading() {

        if (!this.loading) {
            return;
        }


        this.loading.classList.remove(
            "hidden"
        );

    }


    hideLoading() {

        if (!this.loading) {
            return;
        }


        this.loading.classList.add(
            "hidden"
        );

    }


    /* =====================================================
       SHOW / HIDE EMPTY STATE
    ===================================================== */

    hideEmptyState() {

        if (!this.emptyState) {
            return;
        }


        this.emptyState.classList.add(
            "hidden"
        );

    }


    showEmptyState() {

        if (!this.emptyState) {
            return;
        }


        this.emptyState.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       ERROR
    ===================================================== */

    showError(
        message
    ) {

        if (!this.errorBox) {
            return;
        }


        this.errorBox.textContent =
            message;


        this.errorBox.classList.remove(
            "hidden"
        );

    }


    clearError() {

        if (!this.errorBox) {
            return;
        }


        this.errorBox.textContent =
            "";


        this.errorBox.classList.add(
            "hidden"
        );

    }


    /* =====================================================
       VIDEO INFO
    ===================================================== */

    getVideoInfo() {

        return {

            width:
                this.videoWidth,

            height:
                this.videoHeight,

            duration:
                this.getDuration(),

            currentTime:
                this.getCurrentTime(),

            loaded:
                this.loaded,

            fileUrl:
                this.objectUrl

        };

    }


    /* =====================================================
       OBJECT URL CLEANUP
    ===================================================== */

    revokeObjectUrl() {

        if (
            this.objectUrl
        ) {

            try {

                URL.revokeObjectURL(
                    this.objectUrl
                );

            }
            catch (_) {}

            this.objectUrl =
                null;

        }

    }


    /* =====================================================
       RESET
    ===================================================== */

    reset() {

        if (!this.video) {
            return;
        }


        this.video.pause();


        this.video.removeAttribute(
            "src"
        );


        this.video.load();


        this.revokeObjectUrl();


        this.loaded =
            false;


        this.videoWidth =
            0;

        this.videoHeight =
            0;


        this.displayWidth =
            0;

        this.displayHeight =
            0;

        this.displayLeft =
            0;

        this.displayTop =
            0;


        this.clearError();

        this.hideLoading();

        this.showEmptyState();


        this.updateLayout();


        this.events.emit(
            "reset"
        );

    }


    /* =====================================================
       DESTROY
    ===================================================== */

    destroy() {

        window.removeEventListener(
            "resize",
            this.boundResize
        );


        if (
            this.resizeObserver
        ) {

            this.resizeObserver.disconnect();

            this.resizeObserver =
                null;

        }


        this.revokeObjectUrl();


        if (this.video) {

            this.video.removeEventListener(
                "loadedmetadata",
                this.boundMetadata
            );

            this.video.removeEventListener(
                "loadeddata",
                this.boundLoadedData
            );

            this.video.removeEventListener(
                "error",
                this.boundError
            );

        }


        this.events.clear();

    }

}


/* =========================================================
   CREATE GLOBAL INSTANCE
========================================================= */

let videoController =
    null;


function initializeVideoController() {

    if (
        videoController
    ) {

        return videoController;

    }


    videoController =
        new VideoController();


    /*
     * Global access ताकि app.js,
     * tracker.js और tracking engine
     * इसी controller को use करें.
     */
    window.videoController =
        videoController;


    return videoController;

}


/* =========================================================
   AUTO INITIALIZE
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeVideoController,
        {
            once: true
        }
    );

}
else {

    initializeVideoController();

}