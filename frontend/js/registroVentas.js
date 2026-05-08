// CONFIGURACIÓN BASE DEL API
const API_BASE_URL =
  window.location.port === "5500" || window.location.port === "5501"
    ? "http://localhost:3000"
    : "";

// CONFIGURACIÓN DEL MÓDULO DE VENTAS
const SALE_CONFIG = {

  iconBasePath: "./icons/",

  icons: {
    logo: "logo.png",
    dashboard: "dashboard2.png",
    sale: "carrito1.png",
    expense: "factura2.png",
    inventory: "Inventario2.png",
    corresponsal: "corresponsal2.png",
    shortcuts: "acceso-directo2.png",
    notifications: "notificacion2.png",
    logout: "cerrar-sesion.png",
    search: "lupa.png",
    save: "Guardar.png",
  },

  // Endpoint del backend para guardar ventas
  apiUrl: `${API_BASE_URL}/api/sales`,
};

// INICIALIZACIÓN DEL SISTEMA
document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
  setupMobileMenu();
  setupSaleForm();
});

// CARGA DINÁMICA DE ÍCONOS
function applyIcons() {
  document.querySelectorAll(".js-icon").forEach((iconElement) => {
    const iconKey = iconElement.dataset.icon;
    const iconFile = SALE_CONFIG.icons[iconKey];

    if (!iconFile) return;

    iconElement.src = `${SALE_CONFIG.iconBasePath}${iconFile}`;
    iconElement.addEventListener("error", () => {
      iconElement.style.visibility = "hidden";
    });
  });
}

// CONFIGURACIÓN DEL FORMULARIO
function setupSaleForm() {
  const form = document.getElementById("sale-form");
  const message = document.getElementById("form-message");

  // Evento al enviar el formulario
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector(".save-button");

    // Obtiene los datos del formulario
    const sale = getSaleData(form);

    if (!isValidSale(sale)) {
      showMessage(message, "Completa todos los campos obligatorios.", true);
      return;
    }

    // Bloquea el botón para evitar doble envío
    submitButton.disabled = true;
    showMessage(message, "Guardando venta...", false);

    try {
      // Envía la venta al backend
      await saveSale(sale);

      //Limpia el formulario
      form.reset();
      showSuccessModal();

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1300);
    } catch (error) {
      showMessage(message, "No se pudo guardar la venta. Intenta nuevamente.", true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

// OBTENER DATOS DEL FORMULARIO
function getSaleData(form) {
  const formData = new FormData(form);

  // Obtiene la cantidad como string
  const quantityValue = String(formData.get("quantity") || "").trim();

  return {
    product: String(formData.get("product") || "").trim(),
    saleType: String(formData.get("saleType") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    quantity: quantityValue ? Number(quantityValue) : null,
    amount: Number(formData.get("amount") || 0),
    paymentMethod: String(formData.get("paymentMethod") || "").trim(),
    createdAt: new Date().toISOString(),
  };
}

// VALIDACIÓN DE DATOS
function isValidSale(sale) {

  // Validación de campos obligatorios
  const hasValidRequiredFields =
    sale.saleType &&
    sale.description &&
    sale.amount > 0 &&
    sale.paymentMethod;

    // Validación de cantidad
  const hasValidQuantity =
    sale.quantity === null ||
    (Number.isInteger(sale.quantity) && sale.quantity > 0);

  return hasValidRequiredFields && hasValidQuantity;
}

// ENVÍO AL BACKEND
async function saveSale(sale) {
  const response = await fetch(SALE_CONFIG.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(sale),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo guardar la venta");
  }

  return data;
}

function showMessage(messageElement, text, isError) {
  messageElement.textContent = text;
  messageElement.classList.toggle("form-message--error", isError);
}

function setupLogout() {
  const logoutButton = document.querySelector(".logout-button");

  if (!logoutButton) return;

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("smartcontrol_user");
    localStorage.removeItem("smartcontrol_token");
    sessionStorage.clear();

    window.location.href = "index.html";
  });
}

function showSuccessModal() {
  const modal = document.getElementById("success-modal");

  if (!modal) return;

  modal.hidden = false;
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
