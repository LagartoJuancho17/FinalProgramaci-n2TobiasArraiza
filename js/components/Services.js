import gsap from "gsap";

/**
 * Clase Services
 * Maneja la interacción en la sección de servicios (lista de enfoque),
 * inyectando etiquetas detalladas, animando la opacidad cruzada del foco
 * y controlando la vista previa flotante que sigue ligeramente al cursor en Y.
 */
export class Services {
    /**
     * @param {string} containerSelector - Selector del contenedor de la sección de servicios.
     */
    constructor(containerSelector) {
        this.section = document.querySelector(containerSelector);
        if (!this.section) return;

        this.servicesList = this.section.querySelector(".services-list");
        this.serviceItems = this.section.querySelectorAll(".service-item");
        this.previewPanel = this.section.querySelector(".services-preview-panel");
        this.previewImgs = this.previewPanel ? this.previewPanel.querySelectorAll("img") : [];

        if (!this.servicesList || this.serviceItems.length === 0) return;

        this.init();
    }

    init() {
        this.setupTagsAndHover();
        this.setupGlobalListLeave();
        this.setupCursorTracking();
    }

    setupTagsAndHover() {
        this.serviceItems.forEach((item, index) => {
            const detailText = item.getAttribute("data-detail") || "";
            
            // Crear dinámicamente la etiqueta de detalles y agregarla al DOM
            const tag = document.createElement("div");
            tag.className = "services-detail-tag";
            tag.textContent = detailText;
            item.appendChild(tag);

            item.addEventListener("mouseenter", () => {
                // Activar la clase en la lista para reducir la opacidad de los otros elementos
                this.servicesList.classList.add("has-focus");
                item.classList.add("is-hovered");

                // Animamos la etiqueta de detalles (desliza y aparece)
                gsap.to(tag, {
                    opacity: 1,
                    x: 15,
                    duration: 0.4,
                    ease: "power2.out"
                });

                // Cálculo original para posicionar elemento (preservado por consistencia)
                const itemRect = item.getBoundingClientRect();
                const sectionRect = this.section.getBoundingClientRect();
                const dotX = itemRect.left - sectionRect.left + (itemRect.width / 2);
                const dotY = itemRect.bottom - sectionRect.top + 10;

                // Cambiar imagen de vista previa
                if (this.previewImgs[index]) {
                    this.previewImgs.forEach((img) => img.classList.remove("active"));
                    this.previewImgs[index].classList.add("active");
                }

                // Animamos la entrada del panel de vista previa
                if (this.previewPanel) {
                    gsap.killTweensOf(this.previewPanel);
                    gsap.to(this.previewPanel, {
                        autoAlpha: 1,
                        scale: 1,
                        duration: 0.5,
                        ease: "power3.out"
                    });
                }
            });

            item.addEventListener("mouseleave", () => {
                item.classList.remove("is-hovered");

                // Ocultamos la etiqueta de detalles
                gsap.to(tag, {
                    opacity: 0,
                    x: 0,
                    duration: 0.3,
                    ease: "power2.in"
                });
            });
        });
    }

    setupGlobalListLeave() {
        this.servicesList.addEventListener("mouseleave", () => {
            // Quitamos el foco general
            this.servicesList.classList.remove("has-focus");

            // Desvanecemos el panel de imágenes flotantes
            if (this.previewPanel) {
                gsap.to(this.previewPanel, {
                    autoAlpha: 0,
                    scale: 0.95,
                    duration: 0.45,
                    ease: "power3.in"
                });
            }
        });
    }

    setupCursorTracking() {
        this.section.addEventListener("mousemove", (e) => {
            if (!this.previewPanel) return;

            const sectionRect = this.section.getBoundingClientRect();
            const relativeY = e.clientY - sectionRect.top;
            const totalHeight = sectionRect.height;
            
            // Desplazamiento máximo en Y (+/- 45px)
            const offsetPercent = ((relativeY / totalHeight) - 0.5) * 45;

            // Movimiento suave con GSAP
            gsap.to(this.previewPanel, {
                y: `calc(-50% + ${offsetPercent}px)`,
                duration: 0.8,
                ease: "power2.out",
                overwrite: "auto"
            });
        });
    }
}
