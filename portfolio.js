// ==========================================
// Carga Imagenes
// ==========================================

const portfolioData = [
  {
    id: 1,
    category: "eventos",
    image: "../images/portfolio-images/59.jpg",
    alt: "Evento corporativo con ambiente elegante y luces cálidas",
  },
  {
    id: 2,
    category: "eventos",
    image: "../images/portfolio-images/60.jpg",
    alt: "Conferencia tecnológica con ponente en escenario",
  },
  {
    id: 3,
    category: "retratos",
    image: "../images/portfolio-images/59.jpg",
    alt: "Retrato profesional con iluminación natural suave",
  },
  {
    id: 4,
    category: "polas",
    image: "../images/portfolio-images/60.jpg",
    alt: "Fotografía instantánea con estética vintage y colores cálidos",
  },
  {
    id: 5,
    category: "fiestas",
    image: "../images/portfolio-images/59.jpg",
    alt: "Celebración familiar con momentos de alegría nocturna",
  },
  {
    id: 6,
    category: "eventos",
    image: "../images/portfolio-images/59.jpg",
    alt: "Lanzamiento de producto con ambiente profesional",
  },
  {
    id: 7,
    category: "retratos",
    image: "../images/portfolio-images/60.jpg",
    alt: "Retrato artístico con juego de luces y sombras",
  },
  {
    id: 8,
    category: "eventos",
    image: "../images/portfolio-images/60.jpg",
    alt: "Conferencia de negocios con networking",
  },
  {
    id: 9,
    category: "polas",
    image: "../images/portfolio-images/59.jpg",
    alt: "Serie de polaroids con estética retro y nostálgica",
  },
  {
    id: 10,
    category: "fiestas",
    image: "../images/portfolio-images/60.jpg",
    alt: "Fiesta de aniversario con decoración elegante",
  },
];

// ==========================================
// Variables Globales
// ==========================================

let currentFilter = "all";
let itemsPerPage = 100;
let currentPage = 1;
let currentModalIndex = 0;
let filteredData = [];

// Cache de elementos DOM para performance
const portfolioCache = {
  galleryGrid: null,
  filterButtons: null,
  modal: null,
  modalImg: null,
  prevBtn: null,
  nextBtn: null,
  closeBtn: null,
};

// Estado para optimizar renders
const portfolioState = {
  isFiltering: false,
  isModalOpen: false,
  animationFrame: null,
};

// ==========================================
// Inicialización Principal
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🎨 Inicializando Portfolio optimizado...");

  try {
    // Cache elementos DOM una sola vez
    cachePortfolioElements();

    setupPortfolioPage();
    setupModal();
    setupCrossPageNavigation();
    filterGallery("all");

    console.log("✅ Portfolio cargado!");
  } catch (error) {
    console.error("❌ Error en portfolio:", error);
    setupBasicPortfolio();
  }
});

// ==========================================
// Cache de Elementos DOM
// ==========================================

function cachePortfolioElements() {
  portfolioCache.galleryGrid = document.getElementById(
    "portfolio-gallery-grid"
  );
  portfolioCache.filterButtons = document.querySelectorAll(".filter-btn");
  portfolioCache.modal = document.getElementById("imageModal");
  portfolioCache.modalImg = document.getElementById("modalImage");
  portfolioCache.prevBtn = document.getElementById("prevBtn");
  portfolioCache.nextBtn = document.getElementById("nextBtn");
  portfolioCache.closeBtn = document.querySelector(".close");

  console.log(
    `📦 Cached ${
      Object.keys(portfolioCache).filter((key) => portfolioCache[key]).length
    } elementos`
  );
}

// ==========================================
// Setup Functions
// ==========================================

function setupPortfolioPage() {
  if (!portfolioCache.filterButtons.length) {
    console.warn("⚠️ No se encontraron botones de filtro");
    return;
  }

  portfolioCache.filterButtons.forEach((button) => {
    button.addEventListener("click", handleFilterClick.bind(button));

    // Keyboard support
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleFilterClick.call(button);
      }
    });
  });
}

function handleFilterClick() {
  // Prevenir múltiples clicks durante el proceso
  if (this.disabled || portfolioState.isFiltering) return;

  portfolioState.isFiltering = true;

  // Deshabilitar temporalmente para evitar clicks múltiples
  portfolioCache.filterButtons.forEach((btn) => (btn.disabled = true));

  // Actualizar UI inmediatamente con requestAnimationFrame
  requestAnimationFrame(() => {
    portfolioCache.filterButtons.forEach((btn) =>
      btn.classList.remove("active")
    );
    this.classList.add("active");

    const category = this.getAttribute("data-filter");

    // Ejecutar filtro
    filterGallery(category);

    // Re-habilitar botones después de un delay mínimo
    setTimeout(() => {
      portfolioCache.filterButtons.forEach((btn) => (btn.disabled = false));
      portfolioState.isFiltering = false;
    }, 100);
  });
}

function setupModal() {
  if (!portfolioCache.modal || !portfolioCache.modalImg) {
    console.warn("⚠️ Elementos del modal no encontrados");
    return;
  }

  // Event listeners
  portfolioCache.closeBtn?.addEventListener("click", closeModal);
  portfolioCache.prevBtn?.addEventListener("click", () => navigateModal(-1));
  portfolioCache.nextBtn?.addEventListener("click", () => navigateModal(1));

  portfolioCache.modal.addEventListener("click", handleModalBackdropClick);
  document.addEventListener("keydown", handleModalKeydown);
}

function handleModalBackdropClick(e) {
  if (e.target.id === "imageModal") {
    closeModal();
  }
}

function handleModalKeydown(e) {
  if (!portfolioState.isModalOpen) return;

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      navigateModal(-1);
      break;
    case "ArrowRight":
      e.preventDefault();
      navigateModal(1);
      break;
    case "Escape":
      e.preventDefault();
      closeModal();
      break;
  }
}

function setupCrossPageNavigation() {
  const externalLinksWithHash = document.querySelectorAll(
    'a[href^="index.html#"]'
  );

  externalLinksWithHash.forEach((link) => {
    link.addEventListener("click", handleCrossPageNavigation);
  });
}

function handleCrossPageNavigation(e) {
  e.preventDefault();
  const href = this.getAttribute("href");
  const [page, hash] = href.split("#");

  // SessionStorage con timestamp
  sessionStorage.setItem("scrollToSection", hash);
  sessionStorage.setItem("scrollFromExternal", "true");
  sessionStorage.setItem("navigationTimestamp", Date.now().toString());

  // Transición suave
  document.body.style.opacity = "0.9";
  setTimeout(() => {
    window.location.href = page;
  }, 100);
}

// ==========================================
// Funciones de Galería
// ==========================================

function filterGallery(category) {
  currentFilter = category;
  currentPage = 1;

  console.log(`🔍 Filtrando por: ${category}`);

  // Filtrar inmediatamente con spread operator para mejor performance
  filteredData =
    category === "all"
      ? [...portfolioData]
      : portfolioData.filter((item) => item.category === category);

  // Limpiar y mostrar inmediatamente
  if (portfolioCache.galleryGrid) {
    if (portfolioState.animationFrame) {
      cancelAnimationFrame(portfolioState.animationFrame);
    }

    portfolioState.animationFrame = requestAnimationFrame(() => {
      portfolioCache.galleryGrid.innerHTML = "";
      displayItems();
      portfolioState.animationFrame = null;
    });
  }

  updateLoadMoreButton();
}

function displayItems() {
  if (!portfolioCache.galleryGrid) return;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itemsToShow = filteredData.slice(startIndex, endIndex);

  // Creación de HTML con template literals
  const htmlItems = itemsToShow
    .map((item, index) => {
      const globalIndex = startIndex + index;
      return `
      <div class="gallery-item" 
           data-category="${item.category}"
           data-index="${globalIndex}"
           onclick="openModal(${globalIndex})"
           tabindex="0"
           role="button"
           aria-label="Ver imagen ${index + 1}">
        <img class="portfolio-item-image" 
             src="${item.image}" 
             alt="${item.alt || `Fotografía de ${item.category}`}"
             loading="lazy">
      </div>
    `;
    })
    .join("");

  // Insertar todo de una vez (más eficiente)
  portfolioCache.galleryGrid.innerHTML = htmlItems;

  // Aplicar animaciones de entrada
  requestAnimationFrame(() => {
    const items = portfolioCache.galleryGrid.querySelectorAll(".gallery-item");

    let animationIndex = 0;

    function animateNextItem() {
      if (animationIndex < items.length) {
        items[animationIndex].classList.add("animate");
        animationIndex++;

        if (animationIndex < items.length) {
          setTimeout(animateNextItem, 30); // Reducido de 50ms a 30ms
        }
      }
    }

    animateNextItem();
  });
}

function openModal(index) {
  if (index < 0 || index >= filteredData.length || portfolioState.isModalOpen)
    return;

  currentModalIndex = index;
  const item = filteredData[index];

  if (!portfolioCache.modal || !portfolioCache.modalImg) return;

  portfolioState.isModalOpen = true;

  console.log(`🖼️ Abriendo modal: ${index + 1}/${filteredData.length}`);

  // Reset completo de estilos con requestAnimationFrame
  requestAnimationFrame(() => {
    portfolioCache.modalImg.style.transform = "";
    portfolioCache.modalImg.style.opacity = "";
    portfolioCache.modalImg.style.transition = "";

    portfolioCache.modal.style.display = "block";

    // Preload de imagen para mejor UX
    const img = new Image();
    img.onload = () => {
      portfolioCache.modalImg.src = item.image;
      portfolioCache.modalImg.alt = item.alt || "";
    };
    img.onerror = () => {
      console.warn(`⚠️ Error cargando imagen: ${item.image}`);
      portfolioCache.modalImg.src = item.image; // Intentar cargar anyway
      portfolioCache.modalImg.alt = item.alt || "";
    };
    img.src = item.image;

    // Actualizar navegación
    updateModalNavigation(index);

    document.body.style.overflow = "hidden";

    // Focus management para accesibilidad
    portfolioCache.modal.setAttribute("aria-hidden", "false");
    portfolioCache.closeBtn?.focus();
  });
}

function updateModalNavigation(index) {
  if (portfolioCache.prevBtn) {
    portfolioCache.prevBtn.style.display = index > 0 ? "flex" : "none";
  }
  if (portfolioCache.nextBtn) {
    portfolioCache.nextBtn.style.display =
      index < filteredData.length - 1 ? "flex" : "none";
  }
}

function navigateModal(direction) {
  const newIndex = currentModalIndex + direction;

  if (newIndex >= 0 && newIndex < filteredData.length) {
    currentModalIndex = newIndex;
    const item = filteredData[newIndex];

    portfolioCache.modalImg.style.opacity = "0.3";

    setTimeout(() => {
      portfolioCache.modalImg.src = item.image;
      portfolioCache.modalImg.alt = item.alt || "";

      updateModalNavigation(newIndex);

      portfolioCache.modalImg.style.opacity = "1";
    }, 150);
  }
}

function closeModal() {
  if (!portfolioState.isModalOpen) return;

  console.log("❌ Cerrando modal");

  portfolioState.isModalOpen = false;

  // Optimizar cierre con requestAnimationFrame
  requestAnimationFrame(() => {
    if (portfolioCache.modal) {
      portfolioCache.modal.style.display = "none";
    }

    // Reset completo al cerrar
    if (portfolioCache.modalImg) {
      portfolioCache.modalImg.style.transform = "";
      portfolioCache.modalImg.style.opacity = "";
      portfolioCache.modalImg.style.transition = "";
    }

    document.body.style.overflow = "";

    // Focus management
    portfolioCache.modal?.setAttribute("aria-hidden", "true");
  });
}

// ==========================================
// Funciones Auxiliares
// ==========================================

function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (loadMoreBtn) {
    const hasMore = currentPage * itemsPerPage < filteredData.length;
    loadMoreBtn.style.display = hasMore ? "block" : "none";
  }
}

// ==========================================
// Fallback Básico
// ==========================================

function setupBasicPortfolio() {
  console.log("🔄 Activando portfolio básico...");

  // Filtros básicos
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const category = button.getAttribute("data-filter");
      const items =
        category === "all"
          ? portfolioData
          : portfolioData.filter((item) => item.category === category);

      const galleryGrid = document.getElementById("portfolio-gallery-grid");
      if (galleryGrid) {
        galleryGrid.innerHTML = "";
        items.forEach((item, index) => {
          const div = document.createElement("div");
          div.className = "gallery-item";
          div.onclick = () => openModal(index);
          div.innerHTML = `<img src="${item.image}" alt="${item.alt}">`;
          galleryGrid.appendChild(div);
        });
      }
    });
  });

  // Modal básico
  const modal = document.getElementById("imageModal");
  const closeBtn = document.querySelector(".close");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      document.body.style.overflow = "";
    });
  }
}

// ==========================================
// Cleanup y Performance
// ==========================================

// Cleanup al cerrar página
window.addEventListener("beforeunload", () => {
  if (portfolioState.animationFrame) {
    cancelAnimationFrame(portfolioState.animationFrame);
  }

  // Limpiar event listeners si es necesario
  console.log("🧹 Portfolio cleanup completado");
});

// Performance monitoring
if (window.performance) {
  window.addEventListener("load", () => {
    const loadTime = performance.now();
    console.log(`⚡ Portfolio load time: ${Math.round(loadTime)}ms`);
  });
}

// API pública para control externo
window.PortfolioAPI = {
  filterGallery,
  openModal,
  closeModal,
  getCurrentFilter: () => currentFilter,
  getFilteredData: () => [...filteredData],
  getCurrentModalIndex: () => currentModalIndex,
};
