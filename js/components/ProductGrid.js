
export class ProductGrid {
    constructor(gridSelector, productCardsData, productsData) {
        this.grid = document.querySelector(gridSelector);
        this.productCardsData = productCardsData;
        this.productsData = productsData;

        if (this.grid && this.productCardsData && this.productsData) {
            this.render();
        }
    }

    render() {
        this.grid.innerHTML = "";

        this.productCardsData.forEach((cardData) => {
            const productId = cardData.id;
            const productInfo = this.productsData[productId];
            if (!productInfo || !productInfo.varieties || !productInfo.varieties.length) return;

            const initialVariety = productInfo.varieties[0];
            const cardEl = document.createElement("div");
            cardEl.className = "product-card";
            cardEl.setAttribute("data-product-id", productId);
            
            // Los estilos iniciales de opacidad y transform previenen el parpadeo
            // antes de que actúe la animación de entrada inicial de GSAP (ProductGallery)
            cardEl.style.opacity = "0";
            cardEl.style.transform = "translateY(40px)";

            // Generar HTML de los swatches
            let swatchesHtml = "";
            cardData.swatches.forEach((swatch, idx) => {
                const activeClass = idx === 0 ? " active" : "";
                swatchesHtml += `
                    <button class="swatch-dot${activeClass}" data-variety-index="${idx}" style="background-color: ${swatch.color};" title="${swatch.title}"></button>
                `;
            });

            // Si la imagen es una de las por defecto inexistentes (producto1.png, etc.), usamos la de la variedad.
            // Si el administrador la cambió por otra ruta, usamos esa.
            const isDefaultMissing = /producto[1-4]\.png$/.test(cardData.image);
            const displayImage = isDefaultMissing ? (initialVariety.image || cardData.image) : (cardData.image || initialVariety.image);

            cardEl.innerHTML = `
                <div class="product-img-wrapper">
                    <img src="${displayImage}" alt="${cardData.brand} ${initialVariety.name}" class="product-image" id="prod-img-${productId}">
                    <button class="product-cta">Agregar al Carrito</button>
                </div>
                <div class="product-info">
                    <span class="product-brand">${cardData.brand}</span>
                    <h3 class="product-name" id="prod-name-${productId}">${initialVariety.name}</h3>
                    <p class="product-desc" id="prod-desc-${productId}">${initialVariety.desc}</p>
                    <div class="product-meta">
                        <span class="product-price" id="prod-price-${productId}">${initialVariety.price}</span>
                        <div class="product-swatches">
                            ${swatchesHtml}
                        </div>
                    </div>
                </div>
            `;

            this.grid.appendChild(cardEl);
        });
    }
}
