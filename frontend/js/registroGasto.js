// CONFIGURACIÓN BASE DEL API
const API_BASE_URL =
  window.location.port === "5500" || window.location.port === "5501"
    ? "http://localhost:3000"
    : "";

// CONFIGURACIÓN DEL MÓDULO DE GASTOS
const EXPENSE_CONFIG = {
  iconBasePath: "./icons/",

  icons: {
    logo: "logo.png",
    dashboard: "dashboard2.png",
    sale: "carrito2.png",
    expense: "factura1.png",
    inventory: "Inventario2.png",
    corresponsal: "corresponsal2.png",
    shortcuts: "acceso-directo2.png",
    notifications: "notificacion2.png",
    logout: "cerrar-sesion.png",
    search: "lupa.png",
    save: "Guardar.png",
  },

  // Endpoint del backend para gestionar gastos
  apiUrl: `${API_BASE_URL}/api/expenses`,
};

// INICIALIZACIÓN DE LA PÁGINA
document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
  setupMobileMenu();
  setupExpenseForm(); // Configura el formulario de gastos
});

function applyIcons() {
  // Selecciona todos los elementos que deben tener íconos dinámicos
  document.querySelectorAll(".js-icon").forEach((iconElement) => {
    const iconKey = iconElement.dataset.icon;
    const iconFile = EXPENSE_CONFIG.icons[iconKey];

    if (!iconFile) return;

    iconElement.src = `${EXPENSE_CONFIG.iconBasePath}${iconFile}`;
    iconElement.addEventListener("error", () => {
      iconElement.style.visibility = "hidden";
    });
  });
}

// CONFIGURACIÓN DEL FORMULARIO
function setupExpenseForm() {
  const form = document.getElementById("expense-form");
  const message = document.getElementById("form-message");

  if (!form) return;

  // Evento al enviar el formulario
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector(".save-button");
    // Obtiene los datos del formulario
    const expense = getExpenseData(form);

    if (!isValidExpense(expense)) {

      // Verifica si es gasto de inventario
      const isInventoryExpense = expense.category.toLowerCase() === "inventario";

      showMessage(
        message,
        isInventoryExpense
          ? "Para inventario, ingresa cantidad y valor unitario."
          : "Completa todos los campos obligatorios.",
        true
      );
      return;
    }

    // Desactiva el botón para evitar múltiples envíos
    submitButton.disabled = true;
    showMessage(message, "Guardando gasto...", false);

    try {
      // Guarda el gasto en el backend
      await saveExpense(expense);
      form.reset();
      showMessage(message, "", false);
      showSuccessModal();

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1300);
    } catch (error) {
      console.error(error);
      showMessage(message, "No se pudo guardar el gasto.", true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

// OBTENER DATOS DEL FORMULARIO
function getExpenseData(form) {
  const formData = new FormData(form);

  // Obtiene la cantidad como string
  const quantityValue = String(formData.get("quantity") || "").trim();

  return {
    product: String(formData.get("product") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    quantity: quantityValue ? Number(quantityValue) : null,
    amount: Number(formData.get("amount") || 0),
  };
}

// VALIDACIÓN DE DATOS
function isValidExpense(expense) {
  const isInventoryExpense = expense.category.toLowerCase() === "inventario";

  // Campos obligatorios
  const hasRequiredFields =
    expense.description &&
    expense.category &&
    expense.amount > 0;

    // Validación de cantidad
  const hasValidQuantity =
    expense.quantity === null ||
    (Number.isInteger(expense.quantity) && expense.quantity > 0);

  if (!hasRequiredFields || !hasValidQuantity) {
    return false;
  }

  // Si es inventario, la cantidad es obligatoria
  if (isInventoryExpense && expense.quantity === null) {
    return false;
  }

  return true;
}

// GUARDAR GASTO EN EL BACKEND
async function saveExpense(expense) {
  const response = await fetch(EXPENSE_CONFIG.apiUrl, {
    method: "POST", //Crear gasto
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(expense), //Convertir a JSON
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al guardar gasto");
  }

  return data;
}

// MOSTRAR MENSAJES
function showMessage(messageElement, text, isError) {
  messageElement.textContent = text;
  messageElement.classList.toggle("form-message--error", isError);
}

// LOGOUT (CERRAR SESIÓN)
function setupLogout() {
  const logoutButton = document.querySelector(".logout-button");

  if (!logoutButton) return;

  logoutButton.addEventListener("click", () => {

    // Limpia datos del usuario
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

// MENÚ RESPONSIVE (MOBILE)
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

  // Eventos
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
