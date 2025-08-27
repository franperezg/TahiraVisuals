// ==========================================
// Variables Globales
// ==========================================

let currentActiveSection = "home";
let navigationObserver = null;
let scrollThrottleTimer = null;
let resizeThrottleTimer = null;

// Cache de elementos DOM para performance
const domCache = {
  navbar: null,
  navLinks: null,
  sections: new Map(),
  hamburger: null,
  navMenu: null,
  body: document.body,
};

// Estado del menú hamburger
const menuState = {
  isOpen: false,
  isAnimating: false,
};

// ==========================================
// Inicialización Principal
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🧭 Inicializando navegación optimizada...");

  try {
    // Inicializar en orden
    cacheDOMElements();
    handleExternalNavigation();
    setupNavigationListeners();
    setupScrollHandling();
    updateActiveNavigation();
    setupHamburgerMenu();
    setupBackToTopButton();

    console.log("✅ Navegación lista!");
  } catch (error) {
    console.error("❌ Error en inicialización:", error);
    setupBasicFallback();
  }
});

// ==========================================
// Cache de Elementos DOM
// ==========================================

function cacheDOMElements() {
  // Cache elementos principales
  domCache.navbar = document.getElementById("navbar");
  domCache.navLinks = document.querySelectorAll(".nav-link");
  domCache.hamburger = document.getElementById("hamburger");
  domCache.navMenu = document.getElementById("nav-menu");

  // Cache secciones con métricas
  const sections = ["home", "about", "portfolio", "info", "contact"];
  sections.forEach((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      domCache.sections.set(sectionId, {
        element,
        offsetTop: element.offsetTop,
        height: element.offsetHeight,
      });
    }
  });

  console.log(`📦 Cached ${domCache.sections.size} secciones`);
}

// ==========================================
// Navegación Activa
// ==========================================

function updateActiveNavigation() {
  if (!domCache.navbar) return;

  const navbarHeight = domCache.navbar.offsetHeight;
  const scrollPosition = window.pageYOffset + navbarHeight;
  let newActiveSection = "home";

  // Encontrar sección más visible
  let maxVisibility = 0;
  domCache.sections.forEach((sectionData, sectionId) => {
    const { element } = sectionData;
    const rect = element.getBoundingClientRect();
    const elementTop = rect.top + window.pageYOffset;
    const elementBottom = elementTop + rect.height;

    // Calcular qué porcentaje de la sección está visible
    const viewportTop = window.pageYOffset + navbarHeight;
    const viewportBottom = viewportTop + window.innerHeight - navbarHeight;

    const visibleTop = Math.max(elementTop, viewportTop);
    const visibleBottom = Math.min(elementBottom, viewportBottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const totalHeight = rect.height;
    const visibility = totalHeight > 0 ? visibleHeight / totalHeight : 0;

    if (visibility > maxVisibility && visibility > 0) {
      maxVisibility = visibility;
      newActiveSection = sectionId;
    }
  });

  // Solo actualizar si hay cambio
  if (newActiveSection !== currentActiveSection) {
    currentActiveSection = newActiveSection;
    updateNavigationUI();

    // Dispatch custom event
    document.dispatchEvent(
      new CustomEvent("sectionChanged", {
        detail: { section: newActiveSection },
      })
    );
  }
}

function updateNavigationUI() {
  // Optimizar DOM manipulation
  requestAnimationFrame(() => {
    domCache.navLinks.forEach((link) => {
      link.classList.remove("active");
    });

    const selectors = [
      `.nav-link[href="#${currentActiveSection}"]`,
      `.nav-link[href="${currentActiveSection}.html"]`,
    ];

    selectors.forEach((selector) => {
      const activeLink = document.querySelector(selector);
      if (activeLink) {
        activeLink.classList.add("active");
      }
    });
  });
}

// ==========================================
// Navegación Externa
// ==========================================
function handleExternalNavigation() {
  const targetSection = sessionStorage.getItem("scrollToSection");
  const fromExternal = sessionStorage.getItem("scrollFromExternal");

  if (targetSection && fromExternal === "true") {
    console.log("🔄 Navegación externa detectada, scrolling a:", targetSection);

    // Limpiar sessionStorage
    sessionStorage.removeItem("scrollToSection");
    sessionStorage.removeItem("scrollFromExternal");

    // Scroll después de que se carguen los estilos
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollToSectionWithOffset(targetSection);
      }, 100);
    });
  }
}

// ==========================================
// Scroll Suave
// ==========================================

function scrollToSectionWithOffset(sectionId) {
  const sectionData = domCache.sections.get(sectionId);

  if (!sectionData || !domCache.navbar) {
    console.warn(`⚠️ Sección "${sectionId}" no encontrada`);
    return;
  }

  const { element } = sectionData;
  const navbarHeight = domCache.navbar.offsetHeight;
  const targetPosition = Math.max(0, element.offsetTop - navbarHeight);

  console.log(`🎯 Scrolling a: ${sectionId} (posición: ${targetPosition})`);

  // Smooth scroll optimizado con requestAnimationFrame
  smoothScrollTo(targetPosition).then(() => {
    // Forzar actualización después del scroll
    setTimeout(() => {
      updateActiveNavigation();
    }, 100);
  });
}

function scrollToSection(sectionId) {
  scrollToSectionWithOffset(sectionId);
}

function smoothScrollTo(targetPosition) {
  return new Promise((resolve) => {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 100; // 800ms duration
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentPosition = startPosition + distance * easeOut;
      window.scrollTo(0, currentPosition);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animation);
  });
}

// ==========================================
// Event Listeners de Navegación
// ==========================================

function setupNavigationListeners() {
  domCache.navLinks.forEach((link) => {
    link.addEventListener("click", handleNavLinkClick);
  });
}

function handleNavLinkClick(event) {
  const link = event.currentTarget;
  const href = link.getAttribute("href");

  // Patrones de enlaces externos
  const externalPatterns = [".html", "http://", "https://", "mailto:", "tel:"];

  const isExternal = externalPatterns.some(
    (pattern) => href && href.includes(pattern)
  );

  if (isExternal) {
    console.log("🔗 Enlace externo - navegación normal:", href);
    closeHamburgerMenu();
    return; // Permitir navegación normal
  }

  // Enlaces internos con hash
  if (href && href.startsWith("#")) {
    event.preventDefault();
    const targetSection = href.substring(1);
    scrollToSection(targetSection);
    closeHamburgerMenu();
    return;
  }

  // Otros casos
  closeHamburgerMenu();
}

// ==========================================
// Scroll Handling
// ==========================================

function setupScrollHandling() {
  // Usar passive listeners para mejor performance
  window.addEventListener("scroll", optimizedScrollHandler, { passive: true });
  window.addEventListener("resize", optimizedResizeHandler, { passive: true });
}

function handleNavbarScroll() {
  if (!domCache.navbar) return;

  const scrollY = window.pageYOffset;
  const threshold = 100;

  // Agregar/quitar clase scrolled
  if (scrollY > threshold) {
    domCache.navbar.classList.add("scrolled");
  } else {
    domCache.navbar.classList.remove("scrolled");
  }
}

// Throttle optimizado usando requestAnimationFrame
function optimizedScrollHandler() {
  if (scrollThrottleTimer) return;

  scrollThrottleTimer = requestAnimationFrame(() => {
    handleNavbarScroll();
    updateActiveNavigation();
    scrollThrottleTimer = null;
  });
}

function optimizedResizeHandler() {
  if (resizeThrottleTimer) return;

  resizeThrottleTimer = requestAnimationFrame(() => {
    // Recalcular métricas de secciones
    domCache.sections.forEach((sectionData, sectionId) => {
      const { element } = sectionData;
      sectionData.offsetTop = element.offsetTop;
      sectionData.height = element.offsetHeight;
    });

    // Cerrar menú en desktop
    if (window.innerWidth > 768 && menuState.isOpen) {
      closeHamburgerMenu();
    }

    resizeThrottleTimer = null;
  });
}

// Función de throttle tradicional como fallback
function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ==========================================
// Hamburger Menú
// ==========================================

function setupHamburgerMenu() {
  if (!domCache.hamburger || !domCache.navMenu || !domCache.navbar) {
    console.warn("⚠️ Elementos del menú hamburger no encontrados");
    return;
  }

  // Event listeners
  domCache.hamburger.addEventListener("click", handleHamburgerToggle);

  // Cerrar en links de navegación
  domCache.navLinks.forEach((link) => {
    link.addEventListener("click", closeHamburgerMenu);
  });

  // Cerrar al hacer click fuera
  document.addEventListener("click", handleOutsideClick);

  // Keyboard support
  document.addEventListener("keydown", handleMenuKeydown);

  // Touch gestures para móvil
  setupTouchGestures();

  console.log("🍔 Menú hamburger configurado");
}

function handleHamburgerToggle(event) {
  event.stopPropagation();

  if (menuState.isAnimating) return;

  if (menuState.isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

function openMenu() {
  if (menuState.isAnimating || menuState.isOpen) return;

  menuState.isAnimating = true;
  menuState.isOpen = true;

  domCache.hamburger.classList.add("active");
  domCache.navMenu.classList.add("open");
  domCache.navbar.classList.add("menu-open");
  domCache.body.classList.add("no-scroll");

  // Focus management
  setTimeout(() => {
    const firstLink = domCache.navMenu.querySelector(".nav-link");
    if (firstLink) firstLink.focus();
    menuState.isAnimating = false;
  }, 300);
}

function closeMenu() {
  if (menuState.isAnimating || !menuState.isOpen) return;

  menuState.isAnimating = true;
  menuState.isOpen = false;

  domCache.hamburger.classList.remove("active");
  domCache.navMenu.classList.remove("open");
  domCache.navbar.classList.remove("menu-open");
  domCache.body.classList.remove("no-scroll");

  setTimeout(() => {
    menuState.isAnimating = false;
  }, 300);
}

function closeHamburgerMenu() {
  closeMenu();
}

function handleOutsideClick(event) {
  if (!menuState.isOpen) return;

  const isClickInsideMenu = domCache.navMenu.contains(event.target);
  const isClickOnHamburger = domCache.hamburger.contains(event.target);

  if (!isClickInsideMenu && !isClickOnHamburger) {
    closeMenu();
  }
}

function handleMenuKeydown(event) {
  if (event.key === "Escape" && menuState.isOpen) {
    closeMenu();
  }
}

function setupTouchGestures() {
  let startY = 0;
  let currentY = 0;

  domCache.navMenu.addEventListener(
    "touchstart",
    (e) => {
      if (!menuState.isOpen) return;
      startY = e.touches[0].clientY;
    },
    { passive: true }
  );

  domCache.navMenu.addEventListener(
    "touchmove",
    (e) => {
      if (!menuState.isOpen) return;
      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      // Swipe up para cerrar (> 100px)
      if (deltaY < -100) {
        closeMenu();
      }
    },
    { passive: true }
  );
}

// ==========================================
// Back to Top Button
// ==========================================

function setupBackToTopButton() {
  const footerBackToTop = document.getElementById("footerBackToTop");

  if (!footerBackToTop) {
    console.log("ℹ️ Botón back-to-top no encontrado");
    return;
  }

  footerBackToTop.addEventListener("click", handleBackToTopClick);

  // Soporte para teclado
  footerBackToTop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBackToTopClick();
    }
  });

  console.log("⬆️ Botón back-to-top configurado");
}

function handleBackToTopClick() {
  // Smooth scroll al inicio
  smoothScrollTo(0);

  // Feedback visual mejorado
  const button = document.getElementById("footerBackToTop");
  if (button) {
    button.style.transform = "scale(0.9)";
    button.style.transition = "transform 0.1s ease";

    setTimeout(() => {
      button.style.transform = "scale(1.05)";
    }, 100);

    setTimeout(() => {
      button.style.transform = "";
      button.style.transition = "";
    }, 200);
  }
}

// ==========================================
// Fallback
// ==========================================

function setupBasicFallback() {
  console.log("🔄 Activando fallback básico...");

  // Navegación básica
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const section = document.getElementById(href.substring(1));
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Hamburger básico
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navMenu.classList.toggle("open");
      document.body.classList.toggle("no-scroll");
    });
  }

  // Back to top básico
  const backToTop = document.getElementById("footerBackToTop");
  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

// ==========================================
// API Pública para Compatibilidad
// ==========================================

// Exportar funciones para uso externo
window.NavigationAPI = {
  scrollToSection,
  closeHamburgerMenu,
  updateActiveNavigation,
  getCurrentSection: () => currentActiveSection,
};

// Cleanup en unload
window.addEventListener("beforeunload", () => {
  if (scrollThrottleTimer) {
    cancelAnimationFrame(scrollThrottleTimer);
  }
  if (resizeThrottleTimer) {
    cancelAnimationFrame(resizeThrottleTimer);
  }
});
