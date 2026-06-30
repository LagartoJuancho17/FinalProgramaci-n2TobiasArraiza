/* ============================================================
   Explore pure potency — lógica de slider + animaciones GSAP
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ---------------- Datos (productos reales del sitio) ---------------- */
const ROWS = [
  {
    title: ['Pure', 'Brilliance'],
    hero: 'images/explore-1.jpg',
    bg: '#F1CCCF',
    category: 'Pure Brilliance',
    products: [
      { name: 'AHA Brightening Exfoliant Cleanser/Face Wash', price: '₹899', img: 'images/ZurDj7VsGrYSvh0W_1.jpg', img2: 'images/ZurDkbVsGrYSvh0X_2.jpg' },
      { name: 'Bio Exfoliant Brightening Sleeping Mask',       price: '₹899', img: 'images/ZurMbbVsGrYSviXa_1.jpg', img2: 'images/ZurMb7VsGrYSviXc_2.jpg' },
      { name: 'AHA Brightening Exfoliant Toner/Essence',       price: '₹899', img: 'images/ZurL27VsGrYSviVl_1.jpg', img2: 'images/ZurL3bVsGrYSviVo_2.jpg' },
    ]
  },
  {
    title: ['Varnaya', 'Blends'],
    hero: 'images/explore-2.jpg',
    bg: '#D8D0C4',
    category: 'Varnaya Blends',
    products: [
      { name: 'Rosehip & Bakuchiol Skin Perfecting Oil', price: '₹899', img: 'images/ZurQ9LVsGrYSvimZ_1.jpg', img2: 'images/ZurQ9rVsGrYSvimb_2.jpg' },
      { name: 'Manjistha and Saffron Moisture Gel',      price: '₹899', img: 'images/ZurQjbVsGrYSvik0_1.jpg', img2: 'images/ZurQj7VsGrYSvik3_2.jpg' },
      { name: 'Acne Calming Herb Rescue Mask',           price: '₹899', img: 'images/ZurNf7VsGrYSviaK_1.jpg', img2: 'images/ZurNgbVsGrYSviaN_2.jpg' },
      { name: 'Kumkumadi Radiance Facial Oil',           price: '₹899', img: 'images/ZurP_7VsGrYSvijF_1.jpg', img2: 'images/ZurQAbVsGrYSvijG_2.jpg' },
    ]
  }
];

/* ---------------- Iconos SVG ---------------- */
const CART_SVG = `
  <svg class="card__cart" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="13" cy="13" r="13" fill="white"/>
    <path d="M8.77357 10.7989C8.81474 10.099 9.39438 9.55243 10.0955 9.55243H16.0403C16.7415 9.55243 17.3211 10.099 17.3623 10.7989L17.7342 17.1212C17.779 17.8819 17.1742 18.5233 16.4122 18.5233H9.72364C8.9617 18.5233 8.35692 17.8819 8.40167 17.1212L8.77357 10.7989Z" stroke="#424242" stroke-width="0.6"/>
    <path d="M15.883 10.9417C15.883 8.76477 14.6224 7 13.0675 7C11.5125 7 10.252 8.76477 10.252 10.9417" stroke="#424242" stroke-width="0.6" stroke-linecap="round"/>
  </svg>`;

const chevron = (dir) => `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

/* ---------------- Construir el DOM ---------------- */
const rowsEl = document.getElementById('rows');

ROWS.forEach((row) => {
  const cards = row.products.map((p) => `
    <a class="card" href="#" style="background-color:${row.bg}" aria-label="${p.name}">
      <div class="card__head">
        <span class="card__category">${row.category}</span>
        ${CART_SVG}
      </div>
      <div class="card__media">
        <img class="card__img1" src="${p.img}"  alt="${p.name}" draggable="false" />
        <img class="card__img2" src="${p.img2}" alt="${p.name}" draggable="false" />
      </div>
      <div class="card__foot">
        <h3 class="card__name">${p.name}</h3>
        <p class="card__price">${p.price}</p>
      </div>
    </a>`).join('');

  const rowEl = document.createElement('div');
  rowEl.className = 'row';
  rowEl.innerHTML = `
    <div class="row__media">
      <img src="${row.hero}" alt="${row.title.join(' ')}" />
    </div>
    <div class="row__content">
      <div class="row__head">
        <h3 class="row__title">${row.title[0]}<span class="font-serif">${row.title[1]}</span></h3>
        <div class="row__nav">
          <button class="slider-arrow" data-dir="prev" aria-label="Anterior">${chevron('left')}</button>
          <button class="slider-arrow" data-dir="next" aria-label="Siguiente">${chevron('right')}</button>
        </div>
      </div>
      <div class="slider">
        <div class="slider__viewport">
          <div class="slider__track">${cards}</div>
        </div>
      </div>
    </div>`;
  rowsEl.appendChild(rowEl);
});

/* ============================================================
   SLIDER: navegación con flechas + scroll (rueda) + arrastre
   ============================================================ */
class Slider {
  constructor(rowEl) {
    this.viewport = rowEl.querySelector('.slider__viewport');
    this.track = rowEl.querySelector('.slider__track');
    this.cards = [...rowEl.querySelectorAll('.card')];
    this.prevBtn = rowEl.querySelector('[data-dir="prev"]');
    this.nextBtn = rowEl.querySelector('[data-dir="next"]');
    this.gap = 20;
    this.index = 0;
    this.animating = false;

    this.layout();
    this.bind();
    window.addEventListener('resize', () => this.layout());
  }

  // cantidad de tarjetas visibles según el ancho
  get visible() { return window.innerWidth <= 900 ? 1 : 2; }

  layout() {
    const vw = this.viewport.clientWidth;
    const v = this.visible;
    this.cardW = (vw - this.gap * (v - 1)) / v;
    this.step = this.cardW + this.gap;
    this.maxIndex = Math.max(0, this.cards.length - v);
    this.cards.forEach((c) => (c.style.width = this.cardW + 'px'));
    this.index = Math.min(this.index, this.maxIndex);
    gsap.set(this.track, { x: -this.index * this.step });
    this.updateButtons();
  }

  updateButtons() {
    this.prevBtn.disabled = this.index <= 0;
    this.nextBtn.disabled = this.index >= this.maxIndex;
  }

  goTo(i, dur = 0.7) {
    i = Math.max(0, Math.min(i, this.maxIndex));
    if (i === this.index && !this.animating) { this.updateButtons(); return; }
    this.index = i;
    this.animating = true;
    gsap.to(this.track, {
      x: -this.index * this.step,
      duration: dur,
      ease: 'power3.out',
      onComplete: () => (this.animating = false),
    });
    this.updateButtons();
  }

  next() { this.goTo(this.index + 1); }
  prev() { this.goTo(this.index - 1); }

  bind() {
    this.nextBtn.addEventListener('click', () => this.next());
    this.prevBtn.addEventListener('click', () => this.prev());

    /* ----- rueda del mouse: mover horizontalmente ----- */
    let wheelLock = false;
    this.viewport.addEventListener('wheel', (e) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const dir = delta > 0 ? 1 : -1;
      const atStart = this.index <= 0;
      const atEnd = this.index >= this.maxIndex;
      // si ya no hay a dónde ir, dejamos que la página haga scroll normal
      if ((dir > 0 && atEnd) || (dir < 0 && atStart)) return;
      e.preventDefault();
      if (wheelLock) return;
      wheelLock = true;
      this.goTo(this.index + dir);
      setTimeout(() => (wheelLock = false), 450);
    }, { passive: false });

    /* ----- arrastre (mouse / touch) ----- */
    let startX = 0, baseX = 0, dragging = false, moved = false;

    const down = (e) => {
      dragging = true; moved = false;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      baseX = -this.index * this.step;
      gsap.killTweensOf(this.track);
      this.viewport.classList.add('is-dragging');
    };
    const move = (e) => {
      if (!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const dx = x - startX;
      if (Math.abs(dx) > 5) moved = true;
      gsap.set(this.track, { x: baseX + dx });
    };
    const up = (e) => {
      if (!dragging) return;
      dragging = false;
      this.viewport.classList.remove('is-dragging');
      const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
      const dx = x - startX;
      // arrastre suficiente => cambia de tarjeta
      if (Math.abs(dx) > this.step * 0.22) {
        this.goTo(this.index + (dx < 0 ? 1 : -1));
      } else {
        this.goTo(this.index);
      }
    };

    this.viewport.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    this.viewport.addEventListener('touchstart', down, { passive: true });
    this.viewport.addEventListener('touchmove', move, { passive: true });
    this.viewport.addEventListener('touchend', up);

    // las tarjetas son demo: evitamos el salto del enlace "#"
    this.cards.forEach((card) => {
      card.addEventListener('click', (e) => e.preventDefault());
    });
  }
}

/* ============================================================
   ANIMACIONES DE ENTRADA (GSAP + ScrollTrigger)
   ============================================================ */
function initAnimations() {
  // Título principal
  gsap.from('.explore__title .line > span', {
    yPercent: 110,
    duration: 1,
    ease: 'power4.out',
    stagger: 0.12,
  });
  gsap.from('.explore__arrowcurve', {
    opacity: 0, y: -10, duration: 0.8, delay: 0.5, ease: 'power2.out',
  });

  document.querySelectorAll('.row').forEach((rowEl) => {
    const media = rowEl.querySelector('.row__media img');
    const heroBox = rowEl.querySelector('.row__media');

    // Reveal de la fila
    gsap.from(rowEl.querySelector('.row__title'), {
      scrollTrigger: { trigger: rowEl, start: 'top 75%' },
      y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
    });
    gsap.from(rowEl.querySelectorAll('.card'), {
      scrollTrigger: { trigger: rowEl, start: 'top 70%' },
      y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
    });
    gsap.from(rowEl.querySelector('.row__nav'), {
      scrollTrigger: { trigger: rowEl, start: 'top 70%' },
      opacity: 0, duration: 0.9, delay: 0.3, ease: 'power2.out',
    });

    // Parallax de la imagen grande
    gsap.fromTo(media,
      { yPercent: -8 },
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: heroBox, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });
}

/* ---------------- Init ---------------- */
window.addEventListener('load', () => {
  document.querySelectorAll('.row').forEach((rowEl) => new Slider(rowEl));
  initAnimations();
  ScrollTrigger.refresh();
});
