import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Clase HorizontalGallery
 * Controla la sección de galería horizontal, realizando un efecto de scroll pin horizontal
 * y aplicando transiciones de escala y textos dinámicos en los hovers de las tarjetas.
 */
export class HorizontalGallery {
    /**
     * @param {string} containerSelector - Selector del contenedor de la sección de galería horizontal.
     */
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        this.wrapper = this.container.querySelector(".gallery-wrapper");
        if (!this.wrapper) return;

        this.imgContainers = this.container.querySelectorAll(".slide-img-container");

        this.init();
    }

    init() {
        this.createScrollAnimation();
        this.initHoverEffects();
    }

    createScrollAnimation() {
        gsap.to(this.wrapper, {
            x: () => -(this.wrapper.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
                trigger: this.container,
                pin: true,
                scrub: 1,
                start: "top top",
                end: () => `+=${this.wrapper.scrollWidth - window.innerWidth}`,
                invalidateOnRefresh: true,
            }
        });
    }

    initHoverEffects() {
        this.imgContainers.forEach((container) => {
            const media = container.querySelector("img, video");
            const text = container.querySelector(".slide-text");

            if (media && text) {
                container.addEventListener("mouseenter", () => {
                    gsap.to(media, {
                        scale: 1.08,
                        duration: 0.6,
                        ease: "power3.out"
                    });
                    
                    gsap.to(text, {
                        opacity: 1,
                        y: 0,
                        duration: 0.5,
                        ease: "power3.out"
                    });
                });

                container.addEventListener("mouseleave", () => {
                    gsap.to(media, {
                        scale: 1,
                        duration: 0.6,
                        ease: "power3.out"
                    });

                    gsap.to(text, {
                        opacity: 0,
                        y: 15,
                        duration: 0.5,
                        ease: "power3.out"
                    });
                });
            }
        });
    }
}
