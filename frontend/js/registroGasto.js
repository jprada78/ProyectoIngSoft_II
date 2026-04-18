const API_BASE_URL =
  window.location.port === "5500" || window.location.port === "5501"
    ? "http://localhost:3000"
    : "";

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

  apiUrl: `${API_BASE_URL}/api/expenses`,
};

document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
  setupMobileMenu();
  setupExpenseForm();
});

function applyIcons() {
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

function setupExpenseForm() {
  const form = document.getElementById("expense-form");
  const message = document.getElementById("form-message");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector(".save-button");
    const expense = getExpenseData(form);

    if (!isValidExpense(expense)) {
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

    submitButton.disabled = true;
    showMessage(message, "Guardando gasto...", false);

    try {
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

function getExpenseData(form) {
  const formData = new FormData(form);
  const quantityValue = String(formData.get("quantity") || "").trim();

  return {
    product: String(formData.get("product") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    quantity: quantityValue ? Number(quantityValue) : null,
    amount: Number(formData.get("amount") || 0),
  };
}

function isValidExpense(expense) {
  const isInventoryExpense = expense.category.toLowerCase() === "inventario";

  const hasRequiredFields =
    expense.description &&
    expense.category &&
    expense.amount > 0;

  const hasValidQuantity =
    expense.quantity === null ||
    (Number.isInteger(expense.quantity) && expense.quantity > 0);

  if (!hasRequiredFields || !hasValidQuantity) {
    return false;
  }

  if (isInventoryExpense && expense.quantity === null) {
    return false;
  }

  return true;
}

async function saveExpense(expense) {
  const response = await fetch(EXPENSE_CONFIG.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(expense),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al guardar gasto");
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
