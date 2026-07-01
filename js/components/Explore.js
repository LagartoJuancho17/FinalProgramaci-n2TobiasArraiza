import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Slider horizontal de una fila de productos.
 * Navegación por flechas, rueda del mouse y arrastre (mouse / touch).
 * El movimiento del track se anima con GSAP.
 */
class Slider {
    /** @param {HTMLElement} rowEl - Contenedor de la fila (.row) */
    constructor(rowEl) {
        this.viewport = rowEl.querySelector(".slider__viewport");
        this.track = rowEl.querySelector(".slider__track");
        this.cards = [...rowEl.querySelectorAll(".card")];
        this.prevBtn = rowEl.querySelector('[data-dir="prev"]');
        this.nextBtn = rowEl.querySelector('[data-dir="next"]');
        if (!this.viewport || !this.track || !this.cards.length) return;

        this.gap = 20;
        this.index = 0;
        this.animating = false;

        this.layout();
        this.bind();
        window.addEventListener("resize", () => this.layout());
    }

    // Cantidad de tarjetas visibles según el ancho de pantalla
    get visible() {
        return window.innerWidth <= 900 ? 1 : 2;
    }

    layout() {
        const vw = this.viewport.clientWidth;
        const v = this.visible;
        this.cardW = (vw - this.gap * (v - 1)) / v;
        this.step = this.cardW + this.gap;
        this.maxIndex = Math.max(0, this.cards.length - v);
        this.cards.forEach((c) => (c.style.width = this.cardW + "px"));
        this.index = Math.min(this.index, this.maxIndex);
        gsap.set(this.track, { x: -this.index * this.step });
        this.updateButtons();
    }

    updateButtons() {
        if (this.prevBtn) this.prevBtn.disabled = this.index <= 0;
        if (this.nextBtn) this.nextBtn.disabled = this.index >= this.maxIndex;
    }

    goTo(i, dur = 0.7) {
        i = Math.max(0, Math.min(i, this.maxIndex));
        if (i === this.index && !this.animating) {
            this.updateButtons();
            return;
        }
        this.index = i;
        this.animating = true;
        gsap.to(this.track, {
            x: -this.index * this.step,
            duration: dur,
            ease: "power3.out",
            onComplete: () => (this.animating = false),
        });
        this.updateButtons();
    }

    next() { this.goTo(this.index + 1); }
    prev() { this.goTo(this.index - 1); }

    bind() {
        if (this.nextBtn) this.nextBtn.addEventListener("click", () => this.next());
        if (this.prevBtn) this.prevBtn.addEventListener("click", () => this.prev());

        /* ----- Rueda del mouse: mover horizontalmente ----- */
        let wheelLock = false;
        this.viewport.addEventListener(
            "wheel",
            (e) => {
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                const dir = delta > 0 ? 1 : -1;
                const atStart = this.index <= 0;
                const atEnd = this.index >= this.maxIndex;
                // Si ya no hay a dónde ir, dejamos que la página haga scroll normal
                if ((dir > 0 && atEnd) || (dir < 0 && atStart)) return;
                // Consumimos el evento para que Lenis no haga scroll de la página a la vez
                e.preventDefault();
                e.stopPropagation();
                if (wheelLock) return;
                wheelLock = true;
                this.goTo(this.index + dir);
                setTimeout(() => (wheelLock = false), 450);
            },
            { passive: false }
        );

        /* ----- Arrastre (mouse / touch) ----- */
        let startX = 0, baseX = 0, dragging = false, moved = false;

        const down = (e) => {
            dragging = true;
            moved = false;
            startX = e.touches ? e.touches[0].clientX : e.clientX;
            baseX = -this.index * this.step;
            gsap.killTweensOf(this.track);
            this.viewport.style.cursor = "grabbing";
        };
        const move = (e) => {
            if (!dragging) return;
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const dx = x - startX;
            if (Math.abs(dx) > 5) moved = true;
            gsap.set(this.track, { x: baseX + dx });
        };
        const up = (e) => {
            if (!dragging) return;
            dragging = false;
            this.viewport.style.cursor = "grab";
            const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            const dx = x - startX;
            // Arrastre suficiente => cambia de tarjeta
            if (Math.abs(dx) > this.step * 0.22) {
                this.goTo(this.index + (dx < 0 ? 1 : -1));
            } else {
                this.goTo(this.index);
            }
        };

        this.viewport.addEventListener("mousedown", down);
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        this.viewport.addEventListener("touchstart", down, { passive: true });
        this.viewport.addEventListener("touchmove", move, { passive: true });
        this.viewport.addEventListener("touchend", up);

        // Las tarjetas son demo: evitamos el salto del enlace "#"
        this.cards.forEach((card) => {
            card.addEventListener("click", (e) => e.preventDefault());
        });
    }
}

/**
 * Clase Explore
 * Sección "Explore pure potency": dos filas con una imagen grande (parallax)
 * y un slider de productos. Inicializa los sliders y las animaciones de entrada.
 */
export class Explore {
    /**
     * @param {string} containerSelector - Selector de la sección (.explore-section)
     * @param {Array} exploreData - Datos de las filas y sus productos
     */
    constructor(containerSelector, exploreData) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        this.exploreData = exploreData;
        this.init();
    }

    init() {
        if (this.exploreData) {
            this.render();
        }
        this.rows = [...this.container.querySelectorAll(".row")];
        this.rows.forEach((row) => new Slider(row));
        this.setupAnimations();
        ScrollTrigger.refresh();
    }

    render() {
        const rowsContainer = this.container.querySelector(".explore__rows-container") || this.container;
        
        rowsContainer.innerHTML = this.exploreData.map(row => {
            const flexDirClass = row.reverse ? "flex-col md:flex-row-reverse" : "flex-col md:flex-row";
            const mediaClass = row.mediaClass || "w-full h-full object-cover";
            
            const cardsHtml = row.products.map(product => `
                <a class="card group shrink-0 rounded-[14px] p-5 flex flex-col justify-between overflow-hidden select-none cursor-pointer" href="${product.link || '#'}" style="background-color:${product.bgColor}" aria-label="${product.name}">
                    <div class="card__head flex items-center justify-between relative z-[3]">
                        <span class="bg-white text-[#3b3b3b] rounded-full text-[0.7rem] uppercase tracking-wide px-5 py-2.5 leading-none">${product.category}</span>
                        <svg class="w-[26px] h-[26px] shrink-0 transition-transform duration-300 hover:scale-110" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="13" r="13" fill="white"/><path d="M8.77357 10.7989C8.81474 10.099 9.39438 9.55243 10.0955 9.55243H16.0403C16.7415 9.55243 17.3211 10.099 17.3623 10.7989L17.7342 17.1212C17.779 17.8819 17.1742 18.5233 16.4122 18.5233H9.72364C8.9617 18.5233 8.35692 17.8819 8.40167 17.1212L8.77357 10.7989Z" stroke="#424242" stroke-width="0.6"/><path d="M15.883 10.9417C15.883 8.76477 14.6224 7 13.0675 7C11.5125 7 10.252 8.76477 10.252 10.9417" stroke="#424242" stroke-width="0.6" stroke-linecap="round"/></svg>
                    </div>
                    <div class="card__media relative h-[20rem] md:h-[24rem] max-h-[46vh] my-4">
                        <img class="card__img1 absolute inset-0 w-full h-full object-contain scale-110 transition-opacity duration-300 group-hover:opacity-0" src="${product.img1}" alt="${product.name}" draggable="false">
                        <img class="card__img2 absolute inset-0 w-full h-full object-contain scale-110 opacity-0 transition-opacity duration-300 group-hover:opacity-100" src="${product.img2}" alt="${product.name}" draggable="false">
                    </div>
                    <div class="card__foot flex items-end justify-between gap-3 relative z-[2]">
                        <h3 class="text-[0.95rem] font-normal leading-tight max-w-[72%] text-[#3b3b3b]">${product.name}</h3>
                        <p class="text-[0.95rem] whitespace-nowrap text-[#3b3b3b]">${product.price}</p>
                    </div>
                </a>
            `).join('');

            return `
                <div class="row flex ${flexDirClass} items-center justify-between gap-8 md:gap-16 px-4 md:px-12 mb-10 md:mb-12 overflow-hidden">
                    <div class="row__media w-full md:w-1/2 h-[55vh] md:h-[min(82vh,680px)] rounded-[14px] overflow-hidden relative">
                        <img src="${row.mediaImage}" alt="${row.mediaAlt}" class="${mediaClass}">
                    </div>
                    <div class="row__content w-full md:w-1/2 flex flex-col justify-center gap-6 md:gap-8 md:max-h-[680px] px-1 md:px-6">
                        <div class="row__head flex items-end justify-between gap-4">
                            <h3 class="row__title leading-[1.05] tracking-[-1px] max-w-[20rem]">
                                <span class="block text-[clamp(2rem,3vw,3.2rem)]">${row.titleLine1}</span>
                                <span class="block font-['Glitten'] text-[clamp(2.6rem,4.5vw,4.6rem)] leading-[0.85]">${row.titleLine2}</span>
                            </h3>
                            <div class="row__nav flex gap-3 shrink-0">
                                <button class="slider-arrow w-[3.2rem] h-[3.2rem] rounded-full bg-[#3b3b3b] text-white flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110 disabled:opacity-25 disabled:cursor-default" data-dir="prev" aria-label="Anterior">
                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                                <button class="slider-arrow w-[3.2rem] h-[3.2rem] rounded-full bg-[#3b3b3b] text-white flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110 disabled:opacity-25 disabled:cursor-default" data-dir="next" aria-label="Siguiente">
                                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                </button>
                            </div>
                        </div>

                        <div class="slider w-full">
                            <div class="slider__viewport overflow-hidden w-full cursor-grab">
                                <div class="slider__track flex gap-5 will-change-transform">
                                    ${cardsHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupAnimations() {
        // Título principal: las líneas suben desde abajo
        gsap.from(this.container.querySelectorAll(".explore__title .line > span"), {
            scrollTrigger: { trigger: this.container, start: "top 80%" },
            yPercent: 110,
            duration: 1,
            ease: "power4.out",
            stagger: 0.12,
        });

        const arrow = this.container.querySelector(".explore__arrowcurve");
        if (arrow) {
            gsap.from(arrow, {
                scrollTrigger: { trigger: this.container, start: "top 80%" },
                opacity: 0,
                y: -10,
                duration: 0.8,
                delay: 0.4,
                ease: "power2.out",
            });
        }

        this.rows.forEach((rowEl) => {
            const media = rowEl.querySelector(".row__media img");
            const heroBox = rowEl.querySelector(".row__media");

            gsap.from(rowEl.querySelector(".row__title"), {
                scrollTrigger: { trigger: rowEl, start: "top 75%" },
                y: 40, opacity: 0, duration: 0.9, ease: "power3.out",
            });
            gsap.from(rowEl.querySelectorAll(".card"), {
                scrollTrigger: { trigger: rowEl, start: "top 70%" },
                y: 60, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
            });
            gsap.from(rowEl.querySelector(".row__nav"), {
                scrollTrigger: { trigger: rowEl, start: "top 70%" },
                opacity: 0, duration: 0.9, delay: 0.3, ease: "power2.out",
            });

            // Parallax de la imagen grande
            if (media && heroBox) {
                gsap.fromTo(
                    media,
                    { yPercent: -8 },
                    {
                        yPercent: 8,
                        ease: "none",
                        scrollTrigger: {
                            trigger: heroBox,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: true,
                        },
                    }
                );
            }
        });
    }
}
