import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Clase ProductGallery
 * Maneja la visualización de tarjetas de productos, permitiendo alternar
 * entre variedades (swatches) que modifican la imagen (filtros css) y los textos dinámicamente.
 * También controla la animación de entrada inicial (stagger) de las tarjetas.
 */
export class ProductGallery {
    /**
     * @param {string} containerSelector - Selector del contenedor de la sección de productos.
     * @param {Object} productsData - Objeto de datos con las variedades de los productos.
     */
    constructor(containerSelector, productsData) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        this.productsData = productsData;
        this.productCards = this.container.querySelectorAll(".product-card");

        this.init();
    }

    init() {
        this.setupSwatches();
        this.setupEntranceAnimation();
    }

    setupSwatches() {
        this.productCards.forEach((card) => {
            const productId = card.getAttribute("data-product-id");
            const productInfo = this.productsData[productId];
            if (!productInfo) return;

            const img = card.querySelector(".product-image");
            const nameEl = card.querySelector(".product-name");
            const descEl = card.querySelector(".product-desc");
            const priceEl = card.querySelector(".product-price");
            const swatches = card.querySelectorAll(".swatch-dot");

            swatches.forEach((swatch) => {
                swatch.addEventListener("click", () => {
                    if (swatch.classList.contains("active")) return;

                    // Marcar swatch activo
                    swatches.forEach((s) => s.classList.remove("active"));
                    swatch.classList.add("active");

                    const idx = parseInt(swatch.getAttribute("data-variety-index"), 10);
                    const variety = productInfo.varieties[idx];
                    if (!variety) return;

                    // Detener cualquier animación en progreso
                    gsap.killTweensOf([img, nameEl, descEl, priceEl]);

                    // Timeline de animación para la transición de variedad
                    gsap.timeline()
                        .to([nameEl, descEl, priceEl], {
                            opacity: 0,
                            y: -5,
                            duration: 0.25,
                            ease: "power2.in",
                            stagger: 0.05
                        })
                        .to(img, {
                            scale: 0.96,
                            opacity: 0.7,
                            duration: 0.25,
                            ease: "power2.inOut",
                            onComplete: () => {
                                // Cambiar contenido del texto
                                nameEl.textContent = variety.name;
                                descEl.textContent = variety.desc;
                                priceEl.textContent = variety.price;

                                // Cambiar variables CSS personalizadas del filtro de la imagen
                                img.style.setProperty("--hue", variety.style.hue);
                                img.style.setProperty("--sat", variety.style.sat);
                                img.style.setProperty("--bright", variety.style.bright);
                            }
                        }, 0)
                        .to(img, {
                            scale: 1,
                            opacity: 1,
                            duration: 0.45,
                            ease: "power2.out"
                        })
                        .to([nameEl, descEl, priceEl], {
                            opacity: 1,
                            y: 0,
                            duration: 0.35,
                            ease: "power2.out",
                            stagger: 0.05
                        }, "-=0.25");
                });
            });
        });
    }

    setupEntranceAnimation() {
        if (this.productCards.length > 0) {
            gsap.to(this.productCards, {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                stagger: 0.15,
                scrollTrigger: {
                    trigger: this.container,
                    start: "top 80%", // Comienza la animación al entrar un 80% en pantalla
                    toggleActions: "play none none none"
                }
            });
        }
    }
}
