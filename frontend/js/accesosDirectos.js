// Define la URL base del backend dependiendo del entorno
// Si estoy en Live Server (puertos 5500 o 5501), uso localhost:3000
// Si no, uso la misma ruta (producción)
const API_BASE_URL =
  window.location.port === "5500" || window.location.port === "5501"
    ? "http://localhost:3000"
    : "";

// Configuración general de accesos e iconos
const ACCESS_CONFIG = {
  iconBasePath: "./icons/",

  icons: {
    logo: "logo.png",
    dashboard: "dashboard2.png",
    sale: "carrito2.png",
    expense: "factura2.png",
    inventory: "Inventario2.png",
    corresponsal: "corresponsal2.png",
    shortcuts: "acceso-directo1.png",
    notifications: "notificacion2.png",
    logout: "cerrar-sesion.png",

    // Nuevos para accesos directos
    external: "link.png" // icono de abrir enlace (opcional)
  }
};

// Se ejecuta cuando el DOM ya cargó
document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
  setupMobileMenu();
  setupLinks();
});

// Aplica iconos automáticamente a elementos con clase .js-icon
function applyIcons() {
  document.querySelectorAll(".js-icon").forEach((iconElement) => {
    // Obtiene el nombre del icono desde data-icon
    const iconKey = iconElement.dataset.icon;
    // Busca el archivo en la config
    const iconFile = ACCESS_CONFIG.icons[iconKey];

    // Si no existe, no hace nada
    if (!iconFile) return;

    // Asigna la ruta completa al src
    iconElement.src = `${ACCESS_CONFIG.iconBasePath}${iconFile}`;

    // Si el icono falla al cargar, lo oculta
    iconElement.addEventListener("error", () => {
      iconElement.style.visibility = "hidden";
    });
  });
}

// Configura tarjetas como enlaces externos
function setupLinks() {
  const links = document.querySelectorAll(".access-card");

  links.forEach(card => {
    card.addEventListener("click", () => {

      // Obtiene la URL desde data-url
      const url = card.dataset.url;

      // Si existe, abre en nueva pestaña
      if (url) {
        window.open(url, "_blank");
      }
    });
  });
}

// Configura el botón de cerrar sesión
function setupLogout() {
  const logoutButton = document.querySelector(".logout-button");

  // Si no existe el botón, no hace nada
  if (!logoutButton) return;

  logoutButton.addEventListener("click", () => {

    // Limpia almacenamiento local y de sesión
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}

// Manejo del menú responsive (móvil)
function setupMobileMenu() {

  // Elementos del menú
  const openButton = document.querySelector(".mobile-menu-button");
  const closeButton = document.querySelector(".sidebar-close-button");
  const overlay = document.querySelector(".sidebar-overlay");
  const navLinks = document.querySelectorAll(".sidebar .nav-item");

  // Si no existe botón o overlay, no hace nada
  if (!openButton || !overlay) return;

  // Abre el menú
  const openMenu = () => {
    document.body.classList.add("menu-open"); // activa clase en body
    overlay.hidden = false; // muestra overlay
    openButton.setAttribute("aria-expanded", "true"); // accesibilidad
  };

  // Cierra el menú
  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    openButton.setAttribute("aria-expanded", "false");

    // Espera para ocultar overlay (animación)
    setTimeout(() => {
      if (!document.body.classList.contains("menu-open")) {
        overlay.hidden = true;
      }
    }, 200);
  };

  // Eventos
  openButton.addEventListener("click", openMenu);
  closeButton?.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  // Cierra menú al hacer click en opciones
  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Cierra con tecla ESC
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}
