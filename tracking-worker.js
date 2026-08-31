"use strict";

/*
 * tracking-worker.js
 *
 * यह worker हर locked tracker को उसके अपने
 * target के आसपास track करता है।
 *
 * महत्वपूर्ण:
 * एक tracker दूसरे समान object पर switch नहीं करेगा।
 */

self.onmessage = function (event) {

    const message = event.data;

    if (!message) return;


    if (message.type === "reset") {
        return;
    }


    if (message.type !== "track") {
        return;
    }


    try {

        const frame =
            new Uint8ClampedArray(
                message.frame
            );

        const width =
            Number(message.width);

        const height =
            Number(message.height);

        const jobs =
            Array.isArray(message.jobs)
                ? message.jobs
                : [];


        const results = [];


        for (const job of jobs) {

            results.push(
                trackTarget(
                    frame,
                    width,
                    height,
                    job
                )
            );

        }


        self.postMessage({

            type: "tracking-result",

            results,

            frameNumber:
                message.frameNumber

        });

    }

    catch (error) {

        self.postMessage({

            type: "error",

            message:
                error?.message ||
                String(error)

        });

    }

};


/* =====================================================
   TRACK SINGLE TARGET
===================================================== */

function trackTarget(
    frame,
    frameWidth,
    frameHeight,
    job
) {

    const id =
        String(job.id);


    const centerX =
        Number(job.x) || 0;

    const centerY =
        Number(job.y) || 0;


    const template =
        job.template
            ? new Uint8ClampedArray(
                job.template
            )
            : null;


    const templateWidth =
        Number(job.width) || 0;

    const templateHeight =
        Number(job.height) || 0;


    if (
        !template ||
        templateWidth < 4 ||
        templateHeight < 4
    ) {

        return {

            id,

            found: false,

            x: centerX,

            y: centerY,

            width:
                templateWidth,

            height:
                templateHeight,

            confidence: 0

        };

    }


    const sensitivity =
        Math.max(
            0,
            Math.min(
                1,
                Number(job.sensitivity) || 0.65
            )
        );


    /*
     * Search सिर्फ इसी tracker के
     * पिछले target के आसपास होगा।
     */
    const searchRadius =
        Math.max(
            25,
            Math.min(
                180,
                Number(job.searchRadius) || 90
            )
        );


    const left =
        Math.round(
            centerX -
            templateWidth / 2
        );


    const top =
        Math.round(
            centerY -
            templateHeight / 2
        );


    const minX =
        Math.max(
            0,
            left -
            Math.round(searchRadius)
        );


    const maxX =
        Math.min(
            frameWidth -
            templateWidth,
            left +
            Math.round(searchRadius)
        );


    const minY =
        Math.max(
            0,
            top -
            Math.round(searchRadius)
        );


    const maxY =
        Math.min(
            frameHeight -
            templateHeight,
            top +
            Math.round(searchRadius)
        );


    if (
        maxX < minX ||
        maxY < minY
    ) {

        return {

            id,

            found: false,

            x: centerX,

            y: centerY,

            width:
                templateWidth,

            height:
                templateHeight,

            confidence: 0

        };

    }


    const step =
        getSearchStep(
            searchRadius
        );


    const sampleStep =
        getSampleStep(
            templateWidth,
            templateHeight
        );


    let bestScore =
        Infinity;

    let secondScore =
        Infinity;

    let bestX =
        left;

    let bestY =
        top;


    /*
     * पिछले location को पहले test करो।
     */
    const previousScore =
        compareTemplate(
            frame,
            frameWidth,
            frameHeight,
            template,
            templateWidth,
            templateHeight,
            left,
            top,
            sampleStep
        );


    if (
        Number.isFinite(
            previousScore
        )
    ) {

        bestScore =
            previousScore;

    }


    /*
     * Local search.
     *
     * पूरे video में search नहीं होता।
     */
    for (
        let y = minY;

        y <= maxY;

        y += step
    ) {

        for (
            let x = minX;

            x <= maxX;

            x += step
        ) {

            if (
                x === left &&
                y === top
            ) {

                continue;
            }


            const score =
                compareTemplate(
                    frame,
                    frameWidth,
                    frameHeight,
                    template,
                    templateWidth,
                    templateHeight,
                    x,
                    y,
                    sampleStep
                );


            if (
                score <
                bestScore
            ) {

                secondScore =
                    bestScore;

                bestScore =
                    score;

                bestX =
                    x;

                bestY =
                    y;

            }

            else if (
                score <
                secondScore
            ) {

                secondScore =
                    score;

            }

        }

    }


    const confidence =
        scoreToConfidence(
            bestScore
        );


    /*
     * Sensitivity बढ़ने पर थोड़ा अधिक
     * tolerant होगा।
     */
    const minimumConfidence =
        0.54 -
        sensitivity *
        0.16;


    /*
     * दो बहुत समान candidates मिलने पर
     * tracker jump नहीं करेगा।
     */
    let ambiguous =
        false;


    if (
        Number.isFinite(
            secondScore
        )
    ) {

        const difference =
            secondScore -
            bestScore;


        const relativeDifference =
            difference /
            Math.max(
                1,
                secondScore
            );


        if (
            relativeDifference <
            0.025
        ) {

            ambiguous =
                true;

        }

    }


    /*
     * Confidence खराब है या candidates
     * ambiguous हैं तो target LOST।
     *
     * दूसरे object का location वापस नहीं करेंगे।
     */
    if (
        confidence <
            minimumConfidence ||
        ambiguous
    ) {

        return {

            id,

            found: false,

            x: centerX,

            y: centerY,

            width:
                templateWidth,

            height:
                templateHeight,

            confidence

        };

    }


    const targetX =
        bestX +
        templateWidth / 2;


    const targetY =
        bestY +
        templateHeight / 2;


    /*
     * अचानक बहुत बड़ी छलांग रोकना।
     */
    const dx =
        targetX -
        centerX;


    const dy =
        targetY -
        centerY;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const maximumJump =
        Math.max(
            25,
            searchRadius *
            0.90
        );


    if (
        distance >
        maximumJump
    ) {

        return {

            id,

            found: false,

            x: centerX,

            y: centerY,

            width:
                templateWidth,

            height:
                templateHeight,

            confidence

        };

    }


    return {

        id,

        found: true,

        x:
            targetX,

        y:
            targetY,

        width:
            templateWidth,

        height:
            templateHeight,

        confidence

    };

}


/* =====================================================
   TEMPLATE MATCH
===================================================== */

function compareTemplate(
    frame,
    frameWidth,
    frameHeight,
    template,
    templateWidth,
    templateHeight,
    left,
    top,
    sampleStep
) {

    if (
        left < 0 ||
        top < 0 ||
        left + templateWidth >
            frameWidth ||
        top + templateHeight >
            frameHeight
    ) {

        return Infinity;

    }


    let total =
        0;

    let samples =
        0;


    for (
        let y = 0;

        y < templateHeight;

        y += sampleStep
    ) {

        const frameRow =
            (
                top + y
            ) *
            frameWidth;


        const templateRow =
            y *
            templateWidth;


        for (
            let x = 0;

            x < templateWidth;

            x += sampleStep
        ) {

            const templateIndex =
                (
                    templateRow +
                    x
                ) *
                4;


            const frameIndex =
                (
                    frameRow +
                    left +
                    x
                ) *
                4;


            const tr =
                template[
                    templateIndex
                ];

            const tg =
                template[
                    templateIndex + 1
                ];

            const tb =
                template[
                    templateIndex + 2
                ];


            const fr =
                frame[
                    frameIndex
                ];

            const fg =
                frame[
                    frameIndex + 1
                ];

            const fb =
                frame[
                    frameIndex + 2
                ];


            /*
             * RGB difference।
             */
            total +=

                Math.abs(
                    tr - fr
                ) * 0.30 +

                Math.abs(
                    tg - fg
                ) * 0.40 +

                Math.abs(
                    tb - fb
                ) * 0.30;


            samples++;

        }

    }


    if (
        samples === 0
    ) {

        return Infinity;

    }


    return (
        total /
        samples
    );

}


/* =====================================================
   CONFIDENCE
===================================================== */

function scoreToConfidence(
    score
) {

    if (
        !Number.isFinite(
            score
        )
    ) {

        return 0;

    }


    const normalized =
        Math.max(
            0,
            Math.min(
                1,
                score / 255
            )
        );


    return (
        1 -
        normalized
    );

}


/* =====================================================
   SEARCH STEP
===================================================== */

function getSearchStep(
    radius
) {

    if (
        radius <= 50
    ) {

        return 3;

    }


    if (
        radius <= 100
    ) {

        return 4;

    }


    return 5;

}


/* =====================================================
   SAMPLE STEP
===================================================== */

function getSampleStep(
    width,
    height
) {

    const area =
        width *
        height;


    if (
        area <=
        40 * 40
    ) {

        return 2;

    }


    if (
        area <=
        100 * 100
    ) {

        return 3;

    }


    if (
        area <=
        180 * 180
    ) {

        return 4;

    }


    return 5;

}


/* =====================================================
   WORKER READY
===================================================== */

self.postMessage({

    type:
        "ready"

});