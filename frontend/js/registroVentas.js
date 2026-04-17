const API_BASE_URL =
  window.location.port === "5500" || window.location.port === "5501"
    ? "http://localhost:3000"
    : "";
const SALE_CONFIG = {

  iconBasePath: "./icons/",

  // Cambia aqui los nombres por los archivos reales que tienes.
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

  // Cuando tengas Node + Express + MySQL, crea este endpoint para guardar ventas.
  apiUrl: `${API_BASE_URL}/api/sales`,
};

document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
  setupSaleForm();
});

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

function setupSaleForm() {
  const form = document.getElementById("sale-form");
  const message = document.getElementById("form-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector(".save-button");
    const sale = getSaleData(form);

    if (!isValidSale(sale)) {
      showMessage(message, "Completa todos los campos obligatorios.", true);
      return;
    }

    submitButton.disabled = true;
    showMessage(message, "Guardando venta...", false);

    try {
      await saveSale(sale);
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

function getSaleData(form) {
  const formData = new FormData(form);
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


function isValidSale(sale) {
  const hasValidRequiredFields =
    sale.saleType &&
    sale.description &&
    sale.amount > 0 &&
    sale.paymentMethod;

  const hasValidQuantity =
    sale.quantity === null ||
    (Number.isInteger(sale.quantity) && sale.quantity > 0);

  return hasValidRequiredFields && hasValidQuantity;
}


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
