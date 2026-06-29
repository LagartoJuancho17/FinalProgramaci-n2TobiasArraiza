import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Clase Spotlight
 * Controla la animación del scroll vertical (pin) de la sección spotlight,
 * animando la entrada y rotación de imágenes usando ScrollTrigger.
 */
export class Spotlight {
    /**
     * @param {string} containerSelector - Selector del contenedor de la sección spotlight.
     */
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        this.spotlightImages = this.container.querySelectorAll(".spotlight-img");
        if (this.spotlightImages.length === 0) return;

        this.spotlightImgFinalPos = [
            [-140, -140],
            [40, -130],
            [-160, 40],
            [20, 30]
        ];

        this.initialRotations = [5, -3, 3.5, -1];

        this.init();
    }

    init() {
        this.setInitialStates();
        this.createScrollTrigger();
    }

    setInitialStates() {
        this.spotlightImages.forEach((img, index) => {
            const initialRotation = this.initialRotations[index];
            const blurAmount = index === 0 ? 20 : 75;
            gsap.set(img, {
                transform: `translate(-50%, 200%) rotate(${initialRotation}deg)`,
                filter: `blur(${blurAmount}px)`,
                opacity: 0
            });
        });
    }

    createScrollTrigger() {
        ScrollTrigger.create({
            trigger: this.container,
            start: "top top",
            end: `+${window.innerHeight * 6}px`,
            pin: true,
            pinSpacing: true,
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                const phaseOneStartOffsets = [0, 0.1, 0.2, 0.3];

                this.spotlightImages.forEach((img, index) => {
                    const initialRotation = this.initialRotations[index];
                    const phase1Start = phaseOneStartOffsets[index];
                    const phase1End = Math.min(phase1Start + (0.45 - phase1Start) * 0.9, 0.45);

                    let x = -50;
                    let y = -50;
                    let rotation = initialRotation;
                    let blurAmount = 0;
                    let opacityAmount = 1;

                    if (progress < phase1Start) {
                        y = 200;
                        rotation = initialRotation;
                        blurAmount = 75;
                        opacityAmount = 0;
                    } else if (progress <= 0.45) {
                        let phase1Progress;

                        if (progress >= phase1End) {
                            phase1Progress = 1;
                        } else {
                            const linearProgress = (progress - phase1Start) / (phase1End - phase1Start);
                            phase1Progress = 1 - Math.pow(1 - linearProgress, 3);
                        }

                        y = 200 - phase1Progress * 250;
                        rotation = initialRotation;
                        blurAmount = 20 * (1 - phase1Progress);
                        opacityAmount = phase1Progress;
                    } else {
                        y = -50;
                        rotation = initialRotation;
                        blurAmount = 0;
                        opacityAmount = 1;
                    }

                    const phaseTwoStartOffsets = [0.5, 0.55, 0.6, 0.65];
                    const phase2Start = phaseTwoStartOffsets[index];
                    const phase2End = Math.min(phase2Start + (0.95 - phase2Start) * 0.9, 0.95);
                    const finalX = this.spotlightImgFinalPos[index][0];
                    const finalY = this.spotlightImgFinalPos[index][1];

                    if (progress >= phase2Start && progress <= 0.95) {
                        let phase2Progress;

                        if (progress >= phase2End) {
                            phase2Progress = 1;
                        } else {
                            const linearProgress = (progress - phase2Start) / (phase2End - phase2Start);
                            phase2Progress = 1 - Math.pow(1 - linearProgress, 3);
                        }

                        x = -50 + (finalX + 50) * phase2Progress;
                        y = -50 + (finalY + 50) * phase2Progress;
                        rotation = initialRotation * (1 - phase2Progress);
                        blurAmount = 0;
                        opacityAmount = 1;
                    } else if (progress > 0.95) {
                        x = finalX;
                        y = finalY;
                        rotation = 0;
                        blurAmount = 0;
                        opacityAmount = 1;
                    }

                    gsap.set(img, {
                        transform: `translate(${x}%, ${y}%) rotate(${rotation}deg)`,
                        filter: `blur(${blurAmount}px)`,
                        opacity: opacityAmount
                    });
                });
            }
        });
    }
}
