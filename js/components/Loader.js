import gsap from "gsap";

/**
 * Clase Loader
 * Maneja la pantalla de carga animada (loading screen) al inicio del sitio.
 * Controla el contador numérico de progreso (0% a 100%), la barra de progreso,
 * la entrada de los logos/textos, el bloqueo de scroll y la salida animada del loader.
 * 
 * NOTA: Utiliza aceleraciones nativas de GSAP (power2/power4) para máxima compatibilidad
 * sin requerir el plugin CustomEase.
 */
export class Loader {
    /**
     * @param {string} selector - Selector del contenedor del loader.
     * @param {Function} onCompleteCallback - Callback a ejecutar cuando la animación de carga finalice.
     */
    constructor(selector, onCompleteCallback) {
        this.loader = document.querySelector(selector);
        this.onCompleteCallback = onCompleteCallback;

        if (!this.loader) {
            if (typeof this.onCompleteCallback === "function") {
                this.onCompleteCallback();
            }
            return;
        }

        this.logo = this.loader.querySelector(".logo_loader");
        this.textLeft = this.loader.querySelector(".text-loader-left");
        this.textRight = this.loader.querySelector(".text-loader-right");
        this.counter = this.loader.querySelector(".counter-txt");
        this.bar = this.loader.querySelector(".progress-bar");
        this.barWrapper = this.loader.querySelector(".progress-bar-wrapper");

        this.init();
    }

    init() {
        // Bloquear el scroll del navegador mientras carga
        document.body.style.overflow = "hidden";

        // Obtener ancho real del envoltorio de la barra (fallback a 250px)
        const barW = this.barWrapper ? this.barWrapper.offsetWidth : 250;

        // Estado inicial de los elementos (todo oculto/resetado)
        gsap.set(this.loader, { y: "0%", display: "flex" });
        if (this.logo) gsap.set(this.logo, { opacity: 0, scale: 0.92 });
        if (this.textLeft) gsap.set(this.textLeft, { opacity: 0, x: 20 });
        if (this.textRight) gsap.set(this.textRight, { opacity: 0, x: -20 });
        if (this.bar) gsap.set(this.bar, { width: 0 });
        if (this.counter) this.counter.textContent = "0";

        const counterObj = { val: 0 };
        const tl = gsap.timeline();

        // 1. Animación del contador (0 a 100) y de la barra de progreso (Power2 es equivalente al ease-in-out estándar)
        tl.to(counterObj, {
            val: 100,
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                if (this.counter) {
                    this.counter.textContent = Math.round(counterObj.val);
                }
            }
        }, 0);

        if (this.bar) {
            tl.to(this.bar, {
                width: barW,
                duration: 2,
                ease: "power2.inOut"
            }, 0);
        }

        // 2. Animación del logo central (fade + escala)
        if (this.logo) {
            tl.to(this.logo, {
                opacity: 1,
                scale: 1,
                duration: 0.7,
                ease: "power2.out"
            }, 0.2);
        }

        // 3. Animación de los textos laterales (Drillot y Studio)
        const textElements = [];
        if (this.textLeft) textElements.push(this.textLeft);
        if (this.textRight) textElements.push(this.textRight);

        if (textElements.length > 0) {
            tl.to(textElements, {
                opacity: 1,
                x: 0,
                duration: 0.7,
                ease: "power2.out"
            }, 0.5);
        }

        // 4. Salida del loader (se desliza hacia arriba) y habilitación de la página (Power4.inOut es equivalente al loaderOut cúbico)
        tl.to(this.loader, {
            y: "-100%",
            duration: 0.8,
            ease: "power4.inOut",
            onComplete: () => {
                // Habilitar scroll nativo del body
                document.body.style.overflow = "";
                this.loader.style.display = "none";
                
                // Ejecutar callback para arrancar Lenis y las animaciones de la página
                if (typeof this.onCompleteCallback === "function") {
                    this.onCompleteCallback();
                }
            }
        }, 3);
    }
}
