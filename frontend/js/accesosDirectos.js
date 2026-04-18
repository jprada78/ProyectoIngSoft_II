const API_BASE_URL =
  window.location.port === "5500" || window.location.port === "5501"
    ? "http://localhost:3000"
    : "";

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

    // 👇 nuevos para accesos directos
    external: "link.png" // icono de abrir enlace (opcional)
  }
};

document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
  setupMobileMenu();
  setupLinks();
});

function applyIcons() {
  document.querySelectorAll(".js-icon").forEach((iconElement) => {
    const iconKey = iconElement.dataset.icon;
    const iconFile = ACCESS_CONFIG.icons[iconKey];

    if (!iconFile) return;

    iconElement.src = `${ACCESS_CONFIG.iconBasePath}${iconFile}`;

    iconElement.addEventListener("error", () => {
      iconElement.style.visibility = "hidden";
    });
  });
}

function setupLinks() {
  const links = document.querySelectorAll(".access-card");

  links.forEach(card => {
    card.addEventListener("click", () => {
      const url = card.dataset.url;
      if (url) {
        window.open(url, "_blank");
      }
    });
  });
}

function setupLogout() {
  const logoutButton = document.querySelector(".logout-button");

  if (!logoutButton) return;

  logoutButton.addEventListener("click", () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}

function setupMobileMenu() {
  const openButton = document.querySelector(".mobile-menu-button");
  const closeButton = document.querySelector(".sidebar-close-button");
  const overlay = document.querySelector(".sidebar-overlay");
  const navLinks = document.querySelectorAll(".sidebar .nav-item");

  if (!openButton || !overlay) return;

  const openMenu = () => {
    document.body.classList.add("menu-open");
    overlay.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    document.body.classList.remove("menu-open");
    openButton.setAttribute("aria-expanded", "false");

    setTimeout(() => {
      if (!document.body.classList.contains("menu-open")) {
        overlay.hidden = true;
      }
    }, 200);
  };

  openButton.addEventListener("click", openMenu);
  closeButton?.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}
