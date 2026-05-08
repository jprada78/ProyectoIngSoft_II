// Define la URL del backend dependiendo del entorno
const API_BASE_URL =
  window.location.port === "5500" || window.location.port === "5501"
    ? "http://localhost:3000"
    : "";

// Configuración general del módulo de corresponsal
const CORRESPONSAL_CONFIG = {
  iconBasePath: "./icons/",

  icons: {
    logo: "logo.png",
    dashboard: "dashboard2.png",
    sale: "carrito2.png",
    expense: "factura2.png",
    inventory: "Inventario2.png",
    corresponsal: "corresponsal1.png",
    shortcuts: "acceso-directo2.png",
    notifications: "notificacion2.png",
    logout: "cerrar-sesion.png",
    save: "Guardar.png",
  },

  apiUrl: `${API_BASE_URL}/api/corresponsal`, // endpoint del backend
};

// Se ejecuta cuando carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
  setupMobileMenu();
  setupCorresponsalForm(); // formulario de transacciones
});

// ICONOS DINÁMICOS
function applyIcons() {
  document.querySelectorAll(".js-icon").forEach((iconElement) => {
    const iconKey = iconElement.dataset.icon;
    const iconFile = CORRESPONSAL_CONFIG.icons[iconKey];

    if (!iconFile) return;

    iconElement.src = `${CORRESPONSAL_CONFIG.iconBasePath}${iconFile}`;
    iconElement.addEventListener("error", () => {
      iconElement.style.visibility = "hidden";
    });
  });
}

// FORMULARIO CORRESPONSAL
function setupCorresponsalForm() {
  const form = document.getElementById("corresponsal-form");
  const message = document.getElementById("form-message");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector(".save-button");

    // Obtiene datos del formulario
    const data = getCorresponsalData(form);

    if (!isValidData(data)) {
      showMessage(message, "Completa tipo, entidad y monto.", true);
      return;
    }

    submitButton.disabled = true;
    showMessage(message, "Guardando transacción...", false);

    try {
      // Envía datos al backend
      await saveData(data);
      form.reset(); // limpia formulario
      showMessage(message, "", false);

      showSuccessModal(); // muestra modal de éxito

      // Redirige al dashboard
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1300);
    } catch (error) {
      console.error(error);
      showMessage(message, "No se pudo guardar la transacción.", true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

// Obtiene datos del formulario
function getCorresponsalData(form) {
  const formData = new FormData(form);

  return {
    transactionType: String(formData.get("transactionType") || "").trim(),
    entity: String(formData.get("entity") || "").trim(),
    amount: Number(formData.get("amount") || 0),
    commission: Number(formData.get("commission") || 0),
  };
}

// Valida datos antes de enviar
function isValidData(data) {
  return data.transactionType && data.entity && data.amount > 0;
}

// PETICIÓN AL BACKEND
async function saveData(data) {
  const response = await fetch(CORRESPONSAL_CONFIG.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Error al guardar");
  }

  return result;
}

// MENSAJES Y UI
function showMessage(messageElement, text, isError) {
  if (!messageElement) return;

  messageElement.textContent = text;
  messageElement.classList.toggle
  ("form-message--error", isError); // Cambia estilo si es error
}

function showSuccessModal() {
  const modal = document.getElementById("success-modal");
  if (!modal) return;

  modal.hidden = false;
}

// LOGOUT
function setupLogout() {
  const logoutButton = document.querySelector(".logout-button");

  if (!logoutButton) return;

  logoutButton.addEventListener("click", () => {

    // Limpia datos de sesión
    localStorage.removeItem("smartcontrol_user");
    localStorage.removeItem("smartcontrol_token");
    sessionStorage.clear();

    // Redirige al login
    window.location.href = "index.html";
  });
}

// MENÚ RESPONSIVE
function setupMobileMenu() {
  const openButton = document.querySelector(".mobile-menu-button");
  const closeButton = document.querySelector(".sidebar-close-button");
  const overlay = document.querySelector(".sidebar-overlay");
  const navLinks = document.querySelectorAll(".sidebar .nav-item");

  if (!openButton || !overlay) return;

  // Abre menú lateral
  const openMenu = () => {
    document.body.classList.add("menu-open");
    overlay.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
  };

  // Cierra menú
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

  // Cierra menú al seleccionar opción
  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}
