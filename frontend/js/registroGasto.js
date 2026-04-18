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
    save: "Guardar.png",
  },

  // 👇 CAMBIO IMPORTANTE
  apiUrl: `${API_BASE_URL}/api/expenses`,
};

document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector(".save-button");
    const expense = getExpenseData(form);

    if (!isValidExpense(expense)) {
      showMessage(message, "Completa todos los campos obligatorios.", true);
      return;
    }

    submitButton.disabled = true;
    showMessage(message, "Guardando gasto...", false);

    try {
      await saveExpense(expense);
      form.reset();
      showSuccessModal();

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1300);

    } catch (error) {
      showMessage(message, "No se pudo guardar el gasto.", true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

function getExpenseData(form) {
  const formData = new FormData(form);

  return {
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    amount: Number(formData.get("amount") || 0),
    createdAt: new Date().toISOString(),
  };
}

function isValidExpense(expense) {
  return (
    expense.description &&
    expense.category &&
    expense.amount > 0
  );
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
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}

function showSuccessModal() {
  const modal = document.getElementById("success-modal");

  if (!modal) return;

  modal.hidden = false;
}