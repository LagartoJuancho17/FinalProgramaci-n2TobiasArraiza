import gsap from "gsap";

/**
 * Clase ProductModal
 * Pop-up de "Vista de Producto" que se abre al clickear una tarjeta.
 * Reutiliza las variedades (swatches) de productsData: al abrir muestra la
 * imagen, nombre, descripción, ingredientes derivados y precio del producto,
 * y permite alternar variedades dentro del propio modal.
 *
 * Toda la entrada / salida está animada con GSAP (usa el CustomEase "hop"
 * registrado globalmente en main.js). Se cierra con la X, el overlay o Escape.
 */
export class ProductModal {
    /**
     * @param {string} selector - Selector del contenedor del modal.
     * @param {Object} productsData - Datos con las variedades por productId.
     */
    constructor(selector, productsData) {
        this.modal = document.querySelector(selector);
        if (!this.modal) return;

        this.productsData = productsData;

        // Referencias del DOM
        this.overlay = this.modal.querySelector(".product-modal__overlay");
        this.panel = this.modal.querySelector(".product-modal__panel");
        this.closeBtn = this.modal.querySelector(".product-modal__close");
        this.imgEl = this.modal.querySelector(".product-modal__img");
        this.nameEl = this.modal.querySelector(".product-modal__name");
        this.descEl = this.modal.querySelector(".product-modal__desc");
        this.priceEl = this.modal.querySelector(".product-modal__price");
        this.ingredientsEl = this.modal.querySelector(".product-modal__ingredients");
        this.swatchesEl = this.modal.querySelector(".product-modal__swatches");
        this.content = this.modal.querySelector(".product-modal__content");
        this.ctaBtn = this.modal.querySelector(".product-modal__cta");
        this.ctaLabel = this.modal.querySelector(".product-modal__cta-label");

        // Hijos animables del contenido (stagger de entrada)
        this.contentChildren = Array.from(this.content.children);

        this.isOpen = false;
        this.tl = null;
        this.currentVarieties = null;
        this.swatchEls = [];
        this.defaultCtaText = this.ctaLabel ? this.ctaLabel.textContent : "Agregar a la bolsa";
        this.ctaResetId = null;

        this._bindEvents();
    }

    _bindEvents() {
        // Cerrar con overlay o botón X
        this.modal.querySelectorAll("[data-modal-close]").forEach((el) => {
            el.addEventListener("click", () => this.close());
        });

        // Cerrar con Escape
        this._onKeydown = (e) => {
            if (e.key === "Escape" && this.isOpen) this.close();
        };
        document.addEventListener("keydown", this._onKeydown);

        // CTA "Agregar a la bolsa" (feedback visual)
        if (this.ctaBtn) {
            this.ctaBtn.addEventListener("click", () => this._handleAddToBag());
        }
    }

    /**
     * Abre el modal con los datos del producto clickeado.
     * @param {Object} opts
     * @param {string} opts.productId - Id del producto (clave en productsData).
     * @param {string} opts.imgSrc - Ruta de la imagen mostrada en la tarjeta.
     * @param {number} [opts.varietyIndex=0] - Variedad activa al abrir.
     * @param {string[]} [opts.swatchColors=[]] - Colores de los swatches de la tarjeta.
     */
    open({ productId, imgSrc, varietyIndex = 0, swatchColors = [] }) {
        const info = this.productsData?.[productId];
        if (!info || !info.varieties?.length) return;

        this.currentVarieties = info.varieties;
        const idx = Math.min(varietyIndex, this.currentVarieties.length - 1);

        if (imgSrc) this.imgEl.setAttribute("src", imgSrc);
        this._buildSwatches(idx, swatchColors);
        this._renderVariety(idx);
        this._resetCta();

        // Activar el modal y bloquear el scroll del fondo
        this.modal.classList.add("is-active");
        this.modal.setAttribute("aria-hidden", "false");
        document.documentElement.classList.add("modal-open");
        window.lenis?.stop();
        this.isOpen = true;

        // Animación de entrada
        if (this.tl) this.tl.kill();
        this.tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        this.tl
            .set(this.panel, { transformOrigin: "50% 55%" })
            .fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" })
            .fromTo(
                this.panel,
                { opacity: 0, scale: 0.9, y: 40 },
                { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: "hop" },
                "-=0.2"
            )
            .fromTo(this.imgEl, { scale: 1.25 }, { scale: 1, duration: 1.1, ease: "power3.out" }, "<")
            .fromTo(
                this.contentChildren,
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.55, stagger: 0.07 },
                "-=0.55"
            )
            .fromTo(
                this.closeBtn,
                { opacity: 0, scale: 0.5, rotate: -90 },
                { opacity: 1, scale: 1, rotate: 0, duration: 0.5, ease: "back.out(2)" },
                "-=0.6"
            );
    }

    close() {
        if (!this.isOpen) return;

        if (this.tl) this.tl.kill();
        this.tl = gsap.timeline({
            defaults: { ease: "power2.in" },
            onComplete: () => {
                this.modal.classList.remove("is-active");
                this.modal.setAttribute("aria-hidden", "true");
                document.documentElement.classList.remove("modal-open");
                window.lenis?.start();
                this.isOpen = false;
            }
        });
        this.tl
            .to(this.contentChildren, { opacity: 0, y: 12, duration: 0.25, stagger: 0.03 })
            .to(this.panel, { opacity: 0, scale: 0.94, y: 20, duration: 0.35 }, "-=0.1")
            .to(this.overlay, { opacity: 0, duration: 0.3 }, "-=0.25");
    }

    /**
     * Construye los swatches del modal a partir de las variedades y los colores
     * heredados de la tarjeta original.
     */
    _buildSwatches(activeIdx, colors) {
        this.swatchesEl.innerHTML = "";
        this.swatchEls = [];

        this.currentVarieties.forEach((variety, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "product-modal__swatch" + (i === activeIdx ? " active" : "");
            btn.style.backgroundColor = colors[i] || "#cccccc";
            btn.title = variety.name;
            btn.setAttribute("aria-label", variety.name);
            btn.addEventListener("click", () => this._selectVariety(i));
            this.swatchesEl.appendChild(btn);
            this.swatchEls.push(btn);
        });
    }

    /** Cambia la variedad activa dentro del modal con transición animada. */
    _selectVariety(idx) {
        if (this.swatchEls[idx]?.classList.contains("active")) return;

        this.swatchEls.forEach((s, i) => s.classList.toggle("active", i === idx));
        const variety = this.currentVarieties[idx];
        if (!variety) return;

        const textEls = [this.nameEl, this.descEl, this.priceEl, this.ingredientsEl];
        gsap.killTweensOf([this.imgEl, ...textEls]);

        gsap.timeline()
            .to(textEls, { opacity: 0, y: -6, duration: 0.2, stagger: 0.04, ease: "power2.in" })
            .to(
                this.imgEl,
                {
                    scale: 0.97,
                    opacity: 0.75,
                    duration: 0.2,
                    ease: "power2.inOut",
                    onComplete: () => this._renderVariety(idx)
                },
                0
            )
            .to(this.imgEl, { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" })
            .to(textEls, { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power2.out" }, "-=0.2");

        this._resetCta();
    }

    /** Vuelca el contenido de una variedad en el DOM del modal. */
    _renderVariety(idx) {
        const variety = this.currentVarieties[idx];
        if (!variety) return;

        this.nameEl.textContent = variety.name;
        this.descEl.textContent = variety.desc;
        this.priceEl.textContent = variety.price;

        this.imgEl.style.setProperty("--hue", variety.style.hue);
        this.imgEl.style.setProperty("--sat", variety.style.sat);
        this.imgEl.style.setProperty("--bright", variety.style.bright);

        this._renderIngredients(variety.desc);
    }

    /** Deriva los ingredientes desde la descripción (separada por "+"). */
    _renderIngredients(desc) {
        this.ingredientsEl.innerHTML = "";
        desc
            .split("+")
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((part) => {
                const chip = document.createElement("span");
                chip.className = "product-modal__chip";
                chip.textContent = part;
                this.ingredientsEl.appendChild(chip);
            });
    }

    _handleAddToBag() {
        if (!this.ctaLabel) return;
        this.ctaLabel.textContent = "Agregado ✓";
        gsap.fromTo(
            this.ctaBtn,
            { scale: 0.96 },
            { scale: 1, duration: 0.4, ease: "back.out(3)" }
        );
        if (this.ctaResetId) clearTimeout(this.ctaResetId);
        this.ctaResetId = setTimeout(() => this._resetCta(), 1600);
    }

    _resetCta() {
        if (this.ctaResetId) {
            clearTimeout(this.ctaResetId);
            this.ctaResetId = null;
        }
        if (this.ctaLabel) this.ctaLabel.textContent = this.defaultCtaText;
    }
}
