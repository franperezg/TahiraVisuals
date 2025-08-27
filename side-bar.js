// ==========================================
// Variables y Cache
// ==========================================

// Cache de elementos DOM para evitar querySelector repetidos
const socialCache = {
  socialSidebar: null,
  heroSection: null,
  aboutSection: null,
  portfolioSection: null,
  navbar: null,
  footer: null,
  socialButtons: null,
  mobileSocialButtons: null
};

// Estado para optimizar renders
const socialState = {
  isScrolled: false,
  isHidden: false,
  lastScrollY: 0,
  animationFrame: null,
  resizeTimeout: null
};

// ==========================================
// Inicialización Principal
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🔗 Inicializando Social Sidebar optimizado...");
  
  try {
    // Cache elementos DOM una sola vez
    cacheSocialElements();
    
    // Configurar funcionalidades
    setupSocialButtons();
    setupSocialScrollEffect();
    setupSocialSidebarFooterHide();

    console.log("✅ Social Sidebar listo!");
    
  } catch (error) {
    console.error("❌ Error en Social Sidebar:", error);
    setupBasicSocialButtons();
  }
});

// ==========================================
// Cache de elementos DOM
// ==========================================

function cacheSocialElements() {
  socialCache.socialSidebar = document.querySelector(".social-sidebar");
  socialCache.heroSection = document.getElementById("home");
  socialCache.aboutSection = document.getElementById("about");
  socialCache.portfolioSection = document.getElementById("portfolio");
  socialCache.navbar = document.getElementById("navbar");
  socialCache.footer = document.querySelector(".footer-social");
  socialCache.socialButtons = document.querySelectorAll(".social-btn");
  socialCache.mobileSocialButtons = document.querySelectorAll(".mobile-social-btn");
  
  console.log(`📦 Cached ${Object.keys(socialCache).length} elementos sociales`);
}

// ==========================================
// Cambio de Color según Scroll
// ==========================================

function setupSocialScrollEffect() {
  if (!socialCache.socialSidebar || !socialCache.heroSection || 
      !socialCache.aboutSection || !socialCache.navbar) {
    console.warn("⚠️ Elementos requeridos para scroll effect no encontrados");
    return;
  }

  // Función optimizada para obtener métricas
  function getScrollMetrics() {
    const navbarHeight = socialCache.navbar.offsetHeight;
    const heroHeight = socialCache.heroSection.offsetHeight;
    const aboutHeight = socialCache.aboutSection.offsetHeight;
    const portfolioHeight = socialCache.portfolioSection?.offsetHeight || 0;
    
    return {
      navbarHeight,
      heroEndPoint: heroHeight + aboutHeight + portfolioHeight - navbarHeight
    };
  }

  // Función optimizada para actualizar colores
  function updateSocialColors() {
    const scrollPosition = window.pageYOffset;
    
    // Solo recalcular métricas si es necesario (en resize)
    const { heroEndPoint } = getScrollMetrics();
    
    const shouldBeScrolled = scrollPosition > heroEndPoint;
    
    // Solo actualizar DOM si hay cambio real
    if (shouldBeScrolled !== socialState.isScrolled) {
      socialState.isScrolled = shouldBeScrolled;
      
      // Usar requestAnimationFrame para optimizar DOM updates
      if (socialState.animationFrame) {
        cancelAnimationFrame(socialState.animationFrame);
      }
      
      socialState.animationFrame = requestAnimationFrame(() => {
        if (shouldBeScrolled) {
          socialCache.socialSidebar.classList.add("scrolled");
        } else {
          socialCache.socialSidebar.classList.remove("scrolled");
        }
      });
    }
  }

  // Throttle optimizado usando requestAnimationFrame
  function optimizedScrollHandler() {
    if (socialState.animationFrame) return;
    
    socialState.animationFrame = requestAnimationFrame(() => {
      updateSocialColors();
      socialState.animationFrame = null;
    });
  }

  // Handler de resize optimizado con debounce
  function optimizedResizeHandler() {
    if (socialState.resizeTimeout) {
      clearTimeout(socialState.resizeTimeout);
    }
    
    socialState.resizeTimeout = setTimeout(() => {
      requestAnimationFrame(updateSocialColors);
    }, 100);
  }

  // Event listeners optimizados
  window.addEventListener("scroll", optimizedScrollHandler, { passive: true });
  window.addEventListener("resize", optimizedResizeHandler, { passive: true });

  // Observer para cambios en navbar (más eficiente que MutationObserver)
  if (socialCache.navbar && 'ResizeObserver' in window) {
    const navbarResizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateSocialColors);
    });
    navbarResizeObserver.observe(socialCache.navbar);
  }

  // Ejecutar inicialmente después de que se cargue todo
  requestAnimationFrame(() => {
    setTimeout(updateSocialColors, 50);
  });
}

// ==========================================
// Botones Sociales
// ==========================================

function setupSocialButtons() {
  if (!socialCache.socialButtons.length) {
    console.warn("⚠️ No se encontraron botones sociales");
    return;
  }

  // Event delegation más eficiente para múltiples botones
  function handleSocialButtonClick(button) {
    // Prevenir múltiples animaciones simultáneas
    if (button.style.transform) return;
    
    button.style.transform = "translateX(8px) scale(1.05)";
    button.style.transition = "transform 0.2s ease";

    setTimeout(() => {
      button.style.transform = "";
      setTimeout(() => {
        button.style.transition = "";
      }, 200);
    }, 200);
  }

  function handleMobileSocialButtonClick(button) {
    if (button.style.transform) return;
    
    button.style.transform = "translateY(-5px) scale(1.05)";
    button.style.transition = "transform 0.2s ease";

    setTimeout(() => {
      button.style.transform = "";
      setTimeout(() => {
        button.style.transition = "";
      }, 200);
    }, 200);
  }

  // Setup botones de escritorio
  socialCache.socialButtons.forEach((button) => {
    // Click effect optimizado
    button.addEventListener("click", function(e) {
      handleSocialButtonClick(this);
    }, { passive: true });

    // Accesibilidad mejorada
    button.addEventListener("focus", function() {
      this.style.color = "var(--color-terracotta)";
    });

    button.addEventListener("blur", function() {
      this.style.color = "";
    });

    // Keyboard support
    button.addEventListener("keydown", function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSocialButtonClick(this);
      }
    });
  });

  // Setup botones móviles si existen
  if (socialCache.mobileSocialButtons.length) {
    socialCache.mobileSocialButtons.forEach((button) => {
      button.addEventListener("click", function(e) {
        handleMobileSocialButtonClick(this);
      }, { passive: true });

      button.addEventListener("keydown", function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleMobileSocialButtonClick(this);
        }
      });
    });
  }

  console.log(`🎨 Configurados ${socialCache.socialButtons.length} botones sociales`);
}

// ==========================================
// Ocultar sidebar en Footer
// ==========================================

function setupSocialSidebarFooterHide() {
  // Verificar si estamos en desktop y si existen los elementos
  if (window.innerWidth <= 900) {
    console.log("📱 Modo móvil - social sidebar footer hide deshabilitado");
    return;
  }

  if (!socialCache.socialSidebar || !socialCache.footer) {
    console.warn("⚠️ Elementos requeridos para footer hide no encontrados");
    return;
  }

  // Variables de estado local
  let lastKnownScrollY = 0;
  let scrollThrottleFrame = null;

  function hideSidebar() {
    if (socialState.isHidden) return;

    socialState.isHidden = true;
    socialCache.socialSidebar.classList.add("hide-at-footer");
    console.log("👻 Social sidebar: fadeOutLeft");
  }

  function showSidebar() {
    if (!socialState.isHidden) return;

    socialState.isHidden = false;
    socialCache.socialSidebar.classList.remove("hide-at-footer");
    console.log("👀 Social sidebar: fadeInLeft");
  }

  function handleSocialSidebarVisibility() {
    // Solo en desktop
    if (window.innerWidth <= 900) return;

    const footerRect = socialCache.footer.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Footer visible cuando su parte superior entra en pantalla
    const footerVisible = footerRect.top <= windowHeight;

    if (footerVisible !== socialState.isHidden) {
      if (footerVisible) {
        hideSidebar();
      } else {
        showSidebar();
      }
    }
  }

  // Scroll handler optimizado con requestAnimationFrame
  function optimizedFooterScrollHandler() {
    const currentScrollY = window.pageYOffset;
    
    // Solo procesar si hay cambio significativo en scroll
    if (Math.abs(currentScrollY - lastKnownScrollY) < 10) return;
    
    lastKnownScrollY = currentScrollY;
    
    if (scrollThrottleFrame) return;
    
    scrollThrottleFrame = requestAnimationFrame(() => {
      handleSocialSidebarVisibility();
      scrollThrottleFrame = null;
    });
  }

  // Resize handler optimizado
  function optimizedFooterResizeHandler() {
    // Cancelar frame pendiente
    if (scrollThrottleFrame) {
      cancelAnimationFrame(scrollThrottleFrame);
      scrollThrottleFrame = null;
    }

    // Resetear estado en resize para móvil
    if (window.innerWidth <= 900) {
      socialCache.socialSidebar.classList.remove("hide-at-footer");
      socialState.isHidden = false;
      console.log("📱 Cambiado a móvil - reset social sidebar");
    } else {
      // Recalcular en desktop
      requestAnimationFrame(handleSocialSidebarVisibility);
    }
  }

  // Event listeners optimizados
  window.addEventListener("scroll", optimizedFooterScrollHandler, { passive: true });
  window.addEventListener("resize", optimizedFooterResizeHandler, { passive: true });

  // Ejecutar inicialmente
  requestAnimationFrame(handleSocialSidebarVisibility);
  
  console.log("👁️ Social sidebar footer hide configurado");
}

// ==========================================
// Throttle Function
// ==========================================

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ==========================================
// Fallback
// ==========================================

function setupBasicSocialButtons() {
  console.log("🔄 Activando social buttons básicos...");
  
  // Fallback simple para botones sociales
  const socialButtons = document.querySelectorAll(".social-btn, .mobile-social-btn");
  
  socialButtons.forEach(button => {
    button.addEventListener("click", function() {
      this.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.style.transform = "";
      }, 150);
    });
  });
}

// ==========================================
// Cleanup y Performance
// ==========================================

// Cleanup al cerrar página
window.addEventListener("beforeunload", () => {
  if (socialState.animationFrame) {
    cancelAnimationFrame(socialState.animationFrame);
  }
  if (socialState.resizeTimeout) {
    clearTimeout(socialState.resizeTimeout);
  }
  console.log("🧹 Social sidebar cleanup completado");
});

// Performance monitoring opcional
if (window.performance && console.time) {
  window.addEventListener("load", () => {
    const loadTime = performance.now();
    console.log(`⚡ Social sidebar load time: ${Math.round(loadTime)}ms`);
  });
}

// Exportar API para uso externo si es necesario
window.SocialSidebarAPI = {
  updateColors: () => {
    if (socialCache.socialSidebar) {
      requestAnimationFrame(() => {
        // Forzar actualización
        const event = new Event('scroll');
        window.dispatchEvent(event);
      });
    }
  },
  getCurrentState: () => ({
    isScrolled: socialState.isScrolled,
    isHidden: socialState.isHidden
  })
};