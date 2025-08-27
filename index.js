// ==========================================
// Variables Globales
// ==========================================

let currentSlide = 0;
let slideInterval = null;
let isPaused = false;
let isTransitioning = false;

// Cache de elementos DOM para performance
const slideshowCache = {
  slides: null,
  indicators: null,
  heroSection: null,
  portfolioBtn: null,
  portfolioGrid: null,
  portfolioPhotos: null,
};

// Estado de touch para móvil
const touchState = {
  startX: 0,
  endX: 0,
  startY: 0,
  endY: 0,
  isTouch: false,
};

// Observer global para animaciones
let globalObserver = null;

// ==========================================
// Inicialización Principal
// ==========================================

document.addEventListener("DOMContentLoaded", async function () {
  console.log("🚀 Inicializando Index optimizado...");

  try {
    // Inicializar slideshow del hero
    setupHeroSlideshow();

    // Configurar efectos del portfolio
    setupPortfolioPreview();

    // Configurar observer global para animaciones
    observeAnimationElements();

    // Precargar imágenes de forma asíncrona
    Promise.all([preloadSlideImages(), preloadPortfolioImages()])
      .then(() => {
        console.log("🖼️ Todas las imágenes precargadas");
      })
      .catch((error) => {
        console.warn("⚠️ Algunos errores en el preload:", error);
      });

    console.log("✅ Index cargado exitosamente!");
  } catch (error) {
    console.error("❌ Error en inicialización:", error);

    // Fallback básico
    setupBasicSlideshow();
  }
});

// ==========================================
// Función de Slideshow
// ==========================================

function setupHeroSlideshow() {
  // Cache elementos una sola vez
  slideshowCache.slides = document.querySelectorAll(".slide");
  slideshowCache.indicators = document.querySelectorAll(".indicator");
  slideshowCache.heroSection = document.querySelector(".hero");

  if (slideshowCache.slides.length === 0) {
    console.log("ℹ️ No hay slides para inicializar");
    return;
  }

  console.log(
    `🎬 Slideshow iniciado con ${slideshowCache.slides.length} slides`
  );

  // Configurar slides inicialmente
  setupSlidesInitialState();

  // Inicializar primer slide
  updateSlideDisplay();

  // Precargar imágenes de forma asíncrona
  preloadSlideImages();

  // Configurar event listeners
  setupSlideEventListeners();

  // Configurar controles adicionales
  setupKeyboardControls();
  setupTouchControls();
  setupVisibilityControl();

  // Iniciar auto-play
  startAutoPlay();
}

function setupSlidesInitialState() {
  slideshowCache.slides.forEach((slide, index) => {
    slide.style.opacity = index === 0 ? "1" : "0";
    slide.style.transition = "opacity 0.8s ease-in-out";
    slide.style.zIndex = index === 0 ? "2" : "1";
  });
}

function setupSlideEventListeners() {
  // Event listeners para indicadores
  slideshowCache.indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("📍 Indicador clickeado:", index);
      goToSlide(index);
      restartAutoPlay();
    });

    // Keyboard support para indicadores
    indicator.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goToSlide(index);
        restartAutoPlay();
      }
    });
  });

  // Control de hover optimizado
  if (slideshowCache.heroSection) {
    slideshowCache.heroSection.addEventListener(
      "mouseenter",
      handleMouseEnter,
      { passive: true }
    );
    slideshowCache.heroSection.addEventListener(
      "mouseleave",
      handleMouseLeave,
      { passive: true }
    );
  }
}

function handleMouseEnter() {
  console.log("⏸️ Pausando por hover");
  isPaused = true;
  stopAutoPlay();
}

function handleMouseLeave() {
  console.log("▶️ Reanudando después de hover");
  isPaused = false;
  if (!document.hidden) {
    startAutoPlay();
  }
}

// ==========================================
// Controles Avanzados
// ==========================================

function setupKeyboardControls() {
  document.addEventListener("keydown", (e) => {
    if (!slideshowCache.heroSection) return;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        previousSlide();
        restartAutoPlay();
        break;
      case "ArrowRight":
        e.preventDefault();
        nextSlide();
        restartAutoPlay();
        break;
      case " ": // Spacebar
        e.preventDefault();
        toggleAutoPlay();
        break;
      case "Home":
        e.preventDefault();
        goToSlide(0);
        restartAutoPlay();
        break;
      case "End":
        e.preventDefault();
        goToSlide(slideshowCache.slides.length - 1);
        restartAutoPlay();
        break;
    }
  });
}

function setupTouchControls() {
  if (!slideshowCache.heroSection) return;

  slideshowCache.heroSection.addEventListener("touchstart", handleTouchStart, {
    passive: true,
  });
  slideshowCache.heroSection.addEventListener("touchend", handleTouchEnd, {
    passive: true,
  });
}

function handleTouchStart(e) {
  touchState.startX = e.touches[0].clientX;
  touchState.startY = e.touches[0].clientY;
  touchState.isTouch = true;
}

function handleTouchEnd(e) {
  if (!touchState.isTouch) return;

  touchState.endX = e.changedTouches[0].clientX;
  touchState.endY = e.changedTouches[0].clientY;

  const deltaX = touchState.startX - touchState.endX;
  const deltaY = Math.abs(touchState.startY - touchState.endY);

  // Solo procesar swipe horizontal si es más horizontal que vertical
  if (Math.abs(deltaX) > 50 && deltaY < 100) {
    if (deltaX > 0) {
      // Swipe izquierda - siguiente
      nextSlide();
    } else {
      // Swipe derecha - anterior
      previousSlide();
    }
    restartAutoPlay();
  }

  touchState.isTouch = false;
}

function setupVisibilityControl() {
  // Pausar cuando la pestaña no está visible
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoPlay();
    } else if (!isPaused) {
      startAutoPlay();
    }
  });
}

// ==========================================
// Navegación de Slides
// ==========================================

function goToSlide(index) {
  if (
    index < 0 ||
    index >= slideshowCache.slides.length ||
    index === currentSlide ||
    isTransitioning
  ) {
    return;
  }

  console.log(`🎯 Cambiando a slide: ${currentSlide} → ${index}`);

  isTransitioning = true;
  const previousSlide = currentSlide;
  currentSlide = index;

  // Animación optimizada usando requestAnimationFrame
  animateSlideTransition(previousSlide, index);
}

function animateSlideTransition(fromIndex, toIndex) {
  const currentSlideEl = slideshowCache.slides[fromIndex];
  const nextSlideEl = slideshowCache.slides[toIndex];

  // Preparar slide siguiente
  nextSlideEl.style.zIndex = "3";
  nextSlideEl.style.opacity = "0";

  requestAnimationFrame(() => {
    // Fade out actual, fade in siguiente
    currentSlideEl.style.opacity = "0";
    nextSlideEl.style.opacity = "1";

    // Cleanup después de la transición
    setTimeout(() => {
      currentSlideEl.style.zIndex = "1";
      nextSlideEl.style.zIndex = "2";
      isTransitioning = false;
      updateIndicators();
    }, 250); // Tiempo de transición
  });
}

function nextSlide() {
  const nextIndex = (currentSlide + 1) % slideshowCache.slides.length;
  goToSlide(nextIndex);
}

function previousSlide() {
  const prevIndex =
    currentSlide === 0 ? slideshowCache.slides.length - 1 : currentSlide - 1;
  goToSlide(prevIndex);
}

function updateSlideDisplay() {
  updateIndicators();
}

function updateIndicators() {
  // Optimizar DOM updates
  requestAnimationFrame(() => {
    slideshowCache.indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === currentSlide);
    });
  });
}

// ==========================================
// Auto-Play
// ==========================================

function startAutoPlay() {
  stopAutoPlay(); // Limpiar primero

  if (!isPaused && !document.hidden) {
    slideInterval = setInterval(() => {
      if (!isPaused && !isTransitioning && !document.hidden) {
        console.log("⏭️ Auto-avance");
        nextSlide();
      }
    }, 5000);
    console.log("▶️ Auto-play iniciado");
  }
}

function stopAutoPlay() {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
    console.log("⏹️ Auto-play detenido");
  }
}

function toggleAutoPlay() {
  if (isPaused) {
    isPaused = false;
    startAutoPlay();
    console.log("▶️ Auto-play reanudado manualmente");
  } else {
    isPaused = true;
    stopAutoPlay();
    console.log("⏸️ Auto-play pausado manualmente");
  }
}

function restartAutoPlay() {
  stopAutoPlay();
  // Pausa breve después de interacción manual
  setTimeout(() => {
    if (!isPaused) {
      startAutoPlay();
    }
  }, 1000);
}

// ==========================================
// Preload de Imágenes
// ==========================================

function preloadSlideImages() {
  if (!slideshowCache.slides.length) return;

  console.log("🖼️ Iniciando preload de imágenes del slideshow...");

  const imagePromises = [];

  slideshowCache.slides.forEach((slide, index) => {
    // Obtener URL de background-image desde CSS computado
    const computedStyle = getComputedStyle(slide);
    const bgImage = computedStyle.backgroundImage;

    if (bgImage && bgImage !== "none") {
      const imageUrl = bgImage.slice(4, -1).replace(/['"]/g, "");
      const promise = loadImageWithTimeout(imageUrl, 8000)
        .then(() => {
          console.log(`✅ Imagen ${index + 1} cargada: ${imageUrl}`);
        })
        .catch((error) => {
          console.warn(`⚠️ Error cargando imagen ${index + 1}:`, error);
        });

      imagePromises.push(promise);
    }
  });

  // Procesar en paralelo pero con límite
  Promise.allSettled(imagePromises).then((results) => {
    const successful = results.filter((r) => r.status === "fulfilled").length;
    console.log(
      `🎯 Preload completado: ${successful}/${imagePromises.length} imágenes`
    );
  });
}

function loadImageWithTimeout(src, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      reject(new Error(`Timeout loading ${src}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`Failed to load ${src}`));
    };

    img.src = src;
  });
}

async function preloadPortfolioImages() {
  const portfolioImages = [
    "../images/background_eventos.webp",
    "../images/background_fiestas.webp",
    "../images/background_retratos.webp",
  ];

  console.log("🖼️ Precargando imágenes del portfolio...");

  const promises = portfolioImages.map((imageSrc) =>
    loadImageWithTimeout(imageSrc, 6000).catch((error) =>
      console.warn(`⚠️ Error precargando ${imageSrc}:`, error)
    )
  );

  await Promise.allSettled(promises);
  console.log("✅ Preload del portfolio completado");
}

// ==========================================
// Efectos Interactivos Portfolio Navigation
// ==========================================

function setupPortfolioPreview() {
  slideshowCache.portfolioBtn = document.getElementById("portfolio-btn");
  slideshowCache.portfolioGrid = document.getElementById("portfolio-grid");
  slideshowCache.portfolioPhotos =
    document.querySelectorAll(".portfolio-photo");

  if (!slideshowCache.portfolioBtn || !slideshowCache.portfolioGrid) {
    console.log("ℹ️ Elementos del portfolio no encontrados");
    return;
  }

  console.log("🎨 Configurando efectos del portfolio");

  // Efecto hover optimizado con RAF
  slideshowCache.portfolioBtn.addEventListener(
    "mouseenter",
    handlePortfolioHoverIn,
    { passive: true }
  );
  slideshowCache.portfolioBtn.addEventListener(
    "mouseleave",
    handlePortfolioHoverOut,
    { passive: true }
  );

  // Focus support para accesibilidad
  slideshowCache.portfolioBtn.addEventListener("focus", handlePortfolioHoverIn);
  slideshowCache.portfolioBtn.addEventListener("blur", handlePortfolioHoverOut);

  // Intersection observer para lazy effects
  setupPortfolioIntersectionObserver();
}

function handlePortfolioHoverIn() {
  requestAnimationFrame(() => {
    slideshowCache.portfolioGrid.classList.add("colorized");
  });
}

function handlePortfolioHoverOut() {
  requestAnimationFrame(() => {
    slideshowCache.portfolioGrid.classList.remove("colorized");

    // Reset transforms
    slideshowCache.portfolioPhotos.forEach((photo) => {
      photo.style.transform = "";
    });
  });
}

function setupPortfolioIntersectionObserver() {
  const portfolioObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-viewport");
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "50px",
    }
  );

  slideshowCache.portfolioPhotos.forEach((photo) => {
    portfolioObserver.observe(photo);
  });
}

// ==========================================
// Intersection Observer Global
// ==========================================

function setupGlobalObserver() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  globalObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        requestAnimationFrame(() => {
          entry.target.classList.add("animate");

          // Custom delay si está especificado
          const delay = entry.target.dataset.animateDelay;
          if (delay) {
            entry.target.style.animationDelay = `${delay}ms`;
          }

          // Dispatch custom event
          entry.target.dispatchEvent(
            new CustomEvent("elementAnimated", {
              detail: { element: entry.target },
            })
          );
        });
      }
    });
  }, observerOptions);

  return globalObserver;
}

function observeAnimationElements() {
  if (!globalObserver) {
    globalObserver = setupGlobalObserver();
  }

  // Elementos para animación
  const selectors = [
    ".step-container",
    ".pricing-content",
    ".pricing-image",
    ".package",
    ".fade-in",
    ".slide-up",
    "[data-animate]",
  ];

  let totalElements = 0;

  selectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      if (element) {
        globalObserver.observe(element);
        totalElements++;
      }
    });
  });

  console.log(`👀 Observando ${totalElements} elementos para animación`);
}

// ==========================================
// Fallback
// ==========================================

function setupBasicSlideshow() {
  console.log("🔄 Activando slideshow básico...");

  const slides = document.querySelectorAll(".slide");
  const indicators = document.querySelectorAll(".indicator");

  if (slides.length === 0) return;

  let basicCurrentSlide = 0;
  let basicInterval = null;

  function basicUpdateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === basicCurrentSlide);
    });
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle("active", index === basicCurrentSlide);
    });
  }

  function basicNextSlide() {
    basicCurrentSlide = (basicCurrentSlide + 1) % slides.length;
    basicUpdateSlides();
  }

  // Indicadores básicos
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", () => {
      basicCurrentSlide = index;
      basicUpdateSlides();
    });
  });

  // Auto-play básico
  basicInterval = setInterval(basicNextSlide, 5000);
  basicUpdateSlides();

  // Cleanup
  window.addEventListener("beforeunload", () => {
    if (basicInterval) clearInterval(basicInterval);
  });
}

// ==========================================
// Cleanup y Performance
// ==========================================

// Cleanup global al cerrar página
window.addEventListener("beforeunload", () => {
  stopAutoPlay();

  if (globalObserver) {
    globalObserver.disconnect();
  }

  console.log("🧹 Cleanup completado");
});

// Exportar API para uso externo
window.SlideshowAPI = {
  goToSlide,
  nextSlide,
  previousSlide,
  toggleAutoPlay,
  getCurrentSlide: () => currentSlide,
  getTotalSlides: () => slideshowCache.slides?.length || 0,
};
