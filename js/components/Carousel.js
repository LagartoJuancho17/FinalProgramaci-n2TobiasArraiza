import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

/**
 * Clase Carousel
 * Maneja el carrusel de imágenes/videos del hero con transiciones clip-path y SplitText en los títulos.
 */
export class Carousel {
    /**
     * @param {string} containerSelector - Selector del contenedor del carrusel.
     * @param {Array} slidesData - Array con los objetos de datos del carrusel.
     */
    constructor(containerSelector, slidesData) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        this.slides = slidesData;
        this.currentIndex = 0;
        this.textElements = [];
        this.splitTextInstances = [];
        this.isAnimating = false;

        this.carouselImages = this.container.querySelector(".carousel-images");
        this.prevBtn = document.querySelector(".prev-btn");
        this.nextBtn = document.querySelector(".next-btn");

        if (!this.carouselImages || !this.prevBtn || !this.nextBtn) {
            console.warn("Carousel: Faltan elementos requeridos en el DOM");
            return;
        }

        this.init();
    }

    init() {
        this.createCarouselTitles();
        this.createInitialSlide();
        this.bindCarouselControls();

        // Intentar reproducir el video con interacción si el navegador bloquea el autoplay inicial
        const playVideoOnInteraction = () => {
            this.playActiveVideo();
            window.removeEventListener("click", playVideoOnInteraction);
            window.removeEventListener("touchstart", playVideoOnInteraction);
            window.removeEventListener("wheel", playVideoOnInteraction);
        };
        window.addEventListener("click", playVideoOnInteraction);
        window.addEventListener("touchstart", playVideoOnInteraction);
        window.addEventListener("wheel", playVideoOnInteraction);
    }

    startTextAnimation() {
        // Evitar que la página quede en blanco si document.fonts.ready tarda o se bloquea
        let fontsLoaded = false;
        const initTextAnimations = () => {
            if (fontsLoaded) return;
            fontsLoaded = true;
            this.splitTitles();
            this.initFirstSlide();
        };

        document.fonts.ready.then(initTextAnimations);
        // Fallback a los 400ms por si el navegador tarda en resolver las fuentes
        setTimeout(initTextAnimations, 400);
    }

    playActiveVideo() {
        const currentSlide = this.carouselImages.querySelector(".img:last-child");
        if (currentSlide) {
            const video = currentSlide.querySelector("video");
            if (video && video.paused) {
                video.play().catch((err) => {
                    console.log("Carousel: Fallo al forzar reproducción de video:", err);
                });
            }
        }
    }



    createCarouselTitles() {
        this.slides.forEach((slide) => {
            const slideTitleContainer = document.createElement("div");
            slideTitleContainer.classList.add("slide-title-container");

            const slideTitle = document.createElement("h1");
            slideTitle.classList.add("title");
            slideTitle.dataset.text = slide.title;
            slideTitle.textContent = slide.title;

            slideTitleContainer.appendChild(slideTitle);
            this.container.appendChild(slideTitleContainer);

            this.textElements.push(slideTitleContainer);
        });
    }

    createSlideElement(src) {
        const isVideo = src.endsWith(".mp4");
        if (isVideo) {
            const video = document.createElement("video");
            video.src = src;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            return video;
        } else {
            const img = document.createElement("img");
            img.src = src;
            return img;
        }
    }

    createInitialSlide() {
        const initialSlideImgContainer = document.createElement("div");
        initialSlideImgContainer.classList.add("img");

        const element = this.createSlideElement(this.slides[0].image);

        initialSlideImgContainer.appendChild(element);
        this.carouselImages.appendChild(initialSlideImgContainer);

        if (element.tagName === "VIDEO") {
            element.play().catch((err) => {
                console.warn("Carousel: Autoplay prevented for initial video:", err);
            });
        }
    }

    splitTitles() {
        this.textElements.forEach((slide) => {
            const slideTitle = slide.querySelector(".title");
            const splitTitle = new SplitText(slideTitle, {
                type: "words",
                wordsClass: "word",
            });
            this.splitTextInstances.push(splitTitle);
            gsap.set(slideTitle, { opacity: 1 });
        });
    }

    bindCarouselControls() {
        this.nextBtn.addEventListener("click", () => {
            if (this.isAnimating) return;
            this.currentIndex = (this.currentIndex + 1) % this.slides.length;
            this.animateSlide("right");
        });

        this.prevBtn.addEventListener("click", () => {
            if (this.isAnimating) return;
            this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
            this.animateSlide("left");
        });
    }

    initFirstSlide() {
        if (this.textElements.length === 0) return;
        const initialSlideWords = this.textElements[0].querySelectorAll(".word");
        gsap.to(initialSlideWords, {
            filter: "blur(0px)",
            opacity: 1,
            duration: 2,
            ease: "power3.out"
        });
    }

    updateActiveTextSlide() {
        this.textElements.forEach((slide, index) => {
            const words = slide.querySelectorAll(".word");
            if (index === this.currentIndex) {
                gsap.to(words, {
                    filter: "blur(0px)",
                    opacity: 1,
                    duration: 2,
                    ease: "power3.out",
                    stagger: 0.05,
                    overwrite: true,
                    onComplete: () => {
                        gsap.set(words, {
                            filter: "blur(0px)",
                            opacity: 1,
                        });
                    }
                });
            } else {
                gsap.to(words, {
                    filter: "blur(75px)",
                    opacity: 0,
                    duration: 1,
                    ease: "power3.inOut",
                    stagger: 0.02,
                    overwrite: true
                });
            }
        });
    }

    animateSlide(direction) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const viewportWidth = window.innerWidth;
        const slideOffset = Math.min(viewportWidth * 0.5, 500);

        const currentSlide = this.carouselImages.querySelector(".img:last-child");
        if (!currentSlide) {
            this.isAnimating = false;
            return;
        }
        const currentSlideMedia = currentSlide.querySelector("img, video");

        const newSlideImgContainer = document.createElement("div");
        newSlideImgContainer.classList.add("img");

        const newSlideMedia = this.createSlideElement(this.slides[this.currentIndex].image);

        gsap.set(newSlideMedia, {
            x: direction === "left" ? -slideOffset : slideOffset,
        });

        newSlideImgContainer.appendChild(newSlideMedia);
        this.carouselImages.appendChild(newSlideImgContainer);
        
        if (newSlideMedia.tagName === "VIDEO") {
            newSlideMedia.play().catch((err) => {
                console.warn("Carousel: Play prevented on slide transition:", err);
            });
        }

        if (currentSlideMedia) {
            gsap.to(currentSlideMedia, {
                x: direction === "left" ? slideOffset : -slideOffset,
                duration: 1.5,
                ease: "hop",
            });
        }
        
        gsap.fromTo(
            newSlideImgContainer,
            {
                clipPath:
                direction === "left"
                    ? "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"
                    : "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
            },
            {
                clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                duration: 1.5,
                ease: "hop",
                onComplete: () => {
                    this.cleanupCarouselSlides();
                    this.isAnimating = false;
                },
            }
        );

        gsap.to(newSlideMedia, {
            x: 0,
            duration: 1.5,
            ease: "hop",
        });
        
        this.updateActiveTextSlide();
    }

    cleanupCarouselSlides() {
        const imgElements = this.carouselImages.querySelectorAll(".img");
        if (imgElements.length > 1) {
            for (let i = 0; i < imgElements.length - 1; i++) {
                imgElements[i].remove();
            }
        }
    }
}
