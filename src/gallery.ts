import gsap from "gsap";

/* ---------- Configuración ---------- */

// Las 16 imágenes de images/explore. Cada tile las usa una sola vez (malla 4×4).
const IMAGE_NAMES: string[] = [
  "v1-a", "b1-a", "v2-a", "b2-a",
  "v3-a", "b3-a", "v4-a", "explore-1",
  "v1-b", "b1-b", "v2-b", "b2-b",
  "v3-b", "b3-b", "v4-b", "explore-2",
];
const IMAGES: string[] = IMAGE_NAMES.map(
  (n) => `/assets/images/explore/${n}.jpg`
);

const TILES_PER_AXIS = 3;   // 3x3
const DRAG_EASE = 0.09;     
const THROW = 16;           // inercia al soltar
const WHEEL_FACTOR = 1;     // velocidad trackpad
const TITLE_DRIFT = 0;    // velocidad titulo

/* ---------- Tipos ---------- */

interface Vec2 { // posición x, y del plano
  x: number;
  y: number;
}

//DOM


function buildContentTile(): HTMLDivElement {
  const content = document.createElement("div");
  content.className = "content grid w-max grid-cols-4 gap-[8vw] p-[4vw]";
  content.setAttribute("aria-hidden", "false");

  for (const src of IMAGES) {
    const media = document.createElement("div");
    media.className =
      "media relative aspect-square w-[22vw] select-none max-md:w-[46vw]";

    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    img.className =
      "block h-full w-full !object-contain pointer-events-none select-none";

    media.appendChild(img);
    content.appendChild(media);
  }
  return content;
}

//Relleno la malla con los tiles 3x3
function buildContainer(container: HTMLElement): void {
  container.style.gridTemplateColumns = `repeat(${TILES_PER_AXIS}, max-content)`;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < TILES_PER_AXIS * TILES_PER_AXIS; i++) {
    frag.appendChild(buildContentTile());
  }
  container.appendChild(frag);
}

//GALERIA

class InfiniteGallery {
  private readonly drag: HTMLElement;
  private readonly title: HTMLElement;
  private readonly tile: HTMLElement;

  // Estado del plano (px, acumuladores no acotados).
  private current: Vec2 = { x: 0, y: 0 };
  private target: Vec2 = { x: 0, y: 0 };
  private prev: Vec2 = { x: 0, y: 0 };

  // Tamaño de un tile en px (se mide y recalcula en resize).
  private tileW = 1;
  private tileH = 1;

  // Arrastre.
  private dragging = false;
  private pointerId = -1;
  private startPointer: Vec2 = { x: 0, y: 0 };
  private startTarget: Vec2 = { x: 0, y: 0 };
  private pointerVel: Vec2 = { x: 0, y: 0 };
  private lastPointer: Vec2 = { x: 0, y: 0 };

  // Setters de alto rendimiento.
  private readonly setX: (v: number) => void;
  private readonly setY: (v: number) => void;
  private readonly setTitleX: (v: number) => void;
  private readonly setTitleY: (v: number) => void;

  private resizeRaf = 0;

  constructor(drag: HTMLElement, container: HTMLElement, title: HTMLElement) {
    this.drag = drag;
    this.title = title;

    buildContainer(container);
    this.tile = container.querySelector<HTMLElement>(".content")!;

    this.setX = gsap.quickSetter(container, "x", "px") as (v: number) => void;
    this.setY = gsap.quickSetter(container, "y", "px") as (v: number) => void;

    // El título se centra con xPercent/yPercent y deriva con x/y.
    gsap.set(title, { xPercent: -50, yPercent: -50 });
    this.setTitleX = gsap.quickSetter(title, "x", "px") as (v: number) => void;
    this.setTitleY = gsap.quickSetter(title, "y", "px") as (v: number) => void;

    this.measure();
    this.bind();

    // Arranca el bucle de render en el ticker de GSAP.
    gsap.ticker.add(this.render);

    this.reveal();
  }

  /** Mide el tamaño real (px) de un tile para el wrap infinito. */
  private measure(): void {
    const r = this.tile.getBoundingClientRect();
    this.tileW = r.width || 1;
    this.tileH = r.height || 1;
  }

  /* ----- Entradas ----- */

  private bind(): void {
    const drag = this.drag;

    drag.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerup", this.onPointerUp, { passive: true });
    window.addEventListener("pointercancel", this.onPointerUp, { passive: true });

    drag.addEventListener("wheel", this.onWheel, { passive: false });

    window.addEventListener("resize", this.onResize, { passive: true });
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.dragging = true;
    this.pointerId = e.pointerId;
    try {
      this.drag.setPointerCapture(e.pointerId);
    } catch {
      /* algunos navegadores rechazan la captura; el arrastre sigue funcionando */
    }

    this.startPointer = { x: e.clientX, y: e.clientY };
    this.startTarget = { x: this.target.x, y: this.target.y };
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.pointerVel = { x: 0, y: 0 };

    this.drag.classList.remove("cursor-grab");
    this.drag.classList.add("cursor-grabbing");
    // Leve zoom táctil mientras se arrastra (transición CSS de 0.5s).
    this.drag.style.transform = "scale(0.985)";
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging || e.pointerId !== this.pointerId) return;

    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    // Velocidad suavizada para la inercia.
    this.pointerVel.x = this.pointerVel.x * 0.6 + dx * 0.4;
    this.pointerVel.y = this.pointerVel.y * 0.6 + dy * 0.4;
    this.lastPointer = { x: e.clientX, y: e.clientY };

    this.target.x = this.startTarget.x + (e.clientX - this.startPointer.x);
    this.target.y = this.startTarget.y + (e.clientY - this.startPointer.y);
  };

  private onPointerUp = (_e: PointerEvent): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.pointerId = -1;

    this.drag.classList.remove("cursor-grabbing");
    this.drag.classList.add("cursor-grab");
    this.drag.style.transform = "scale(1)";

    // Impulso de inercia según la última velocidad del puntero.
    this.target.x += this.pointerVel.x * THROW;
    this.target.y += this.pointerVel.y * THROW;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.target.x -= e.deltaX * WHEEL_FACTOR;
    this.target.y -= e.deltaY * WHEEL_FACTOR;
  };

  private onResize = (): void => {
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    this.resizeRaf = requestAnimationFrame(() => this.measure());
  };

  /* ----- Bucle de render ----- */

  private render = (): void => {
    // Suavizado hacia el objetivo (lerp).
    this.current.x += (this.target.x - this.current.x) * DRAG_EASE;
    this.current.y += (this.target.y - this.current.y) * DRAG_EASE;

    // Envolver módulo el tamaño de un tile → plano infinito, sin costuras.
    const wx = gsap.utils.wrap(-this.tileW, 0, this.current.x);
    const wy = gsap.utils.wrap(-this.tileH, 0, this.current.y);
    this.setX(wx);
    this.setY(wy);

    // Deriva del título según la velocidad del plano (se recentra en reposo).
    const vx = this.current.x - this.prev.x;
    const vy = this.current.y - this.prev.y;
    this.setTitleX(vx * TITLE_DRIFT);
    this.setTitleY(vy * TITLE_DRIFT);

    this.prev.x = this.current.x;
    this.prev.y = this.current.y;
  };

  /* ----- Animaciones de entrada ----- */

  private reveal(): void {
    const media = this.drag.querySelectorAll<HTMLElement>(".media");

    // Estado inicial de las imágenes.
    gsap.set(media, { autoAlpha: 0, scale: 0.82, yPercent: 8 });

    const tl = gsap.timeline({ delay: 0.2 });

    // Título: cada línea sube desde su máscara (overflow-hidden).
    const lines = this.title.querySelectorAll<HTMLElement>(".line-inner");
    tl.from(
      lines,
      {
        yPercent: 120,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.12,
      },
      0
    );

    // Imágenes: aparecen con blur/escala en cascada desde el centro.
    tl.to(
      media,
      {
        autoAlpha: 1,
        scale: 1,
        yPercent: 0,
        duration: 1.1,
        ease: "power3.out",
        stagger: { amount: 1.1, from: "center", grid: "auto" },
      },
      0.25
    );

    // Pista de interacción.
    const hint = document.querySelector<HTMLElement>(".gallery-hint");
    if (hint) {
      tl.from(hint, { autoAlpha: 0, y: 12, duration: 0.8, ease: "power2.out" }, 0.9);
    }
  }
}

/* ---------- Arranque ---------- */

function boot(): void {
  const drag = document.querySelector<HTMLElement>("#gallerydrag");
  const container = document.querySelector<HTMLElement>(".gallery-container");
  const title = document.querySelector<HTMLElement>(".title-wrapper");
  if (!drag || !container || !title) return;

  new InfiniteGallery(drag, container, title);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
