import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Importar cargador y clases de componentes
import { DataLoader } from "./js/services/DataLoader.js";
import { Loader } from "./js/components/Loader.js";
import { Carousel } from "./js/components/Carousel.js";
import { Spotlight } from "./js/components/Spotlight.js";
import { HorizontalGallery } from "./js/components/HorizontalGallery.js";
import { Services } from "./js/components/Services.js";
import { ProductGallery } from "./js/components/ProductGallery.js";

// Registrar plugins de GSAP
gsap.registerPlugin(SplitText, CustomEase, ScrollTrigger);

// Crear aceleración personalizada para las transiciones de slides
CustomEase.create(
    "hop",
    "M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1"
);

// Variable para mantener la referencia del carrusel y controlar su animación de texto
let carouselInstance = null;

/**
 * Inicialización de todos los componentes de la página en segundo plano
 * @param {Object} data - Datos dinámicos cargados desde el JSON.
 */
function initAllComponents(data) {
    carouselInstance = new Carousel(".carousel", data.carouselSlides);
    new Spotlight(".spotlight");
    new HorizontalGallery(".horizontal-gallery");
    new Services(".services-section");
    new ProductGallery(".products-section", data.productsData);
}

// Arrancar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Empezar a descargar los datos del JSON inmediatamente
    const dataPromise = DataLoader.loadData("./assets/data.json");

    try {
        // 2. Esperar e inicializar los componentes y reproducir el video en segundo plano (debajo del loader)
        const data = await dataPromise;
        initAllComponents(data);

        // 3. Inicializar la pantalla de carga (Loader)
        new Loader(".loader", () => {
            // Este callback se ejecuta cuando el loader termina de deslizarse hacia arriba
            
            // Inicializar el scroll suave (Lenis) y vincularlo a ScrollTrigger
            const lenis = new Lenis();
            lenis.on("scroll", ScrollTrigger.update);
            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);

            // Iniciar la animación del título del carrusel
            if (carouselInstance) {
                carouselInstance.startTextAnimation();
                carouselInstance.playActiveVideo(); // Asegurar que el video empiece a reproducirse al revelarse
            }
        });

    } catch (error) {
        console.error("Fallo crítico en la inicialización de componentes:", error);
    }
});
