const SALE_CONFIG = {
  // Cambia esta ruta si tu carpeta de iconos esta en otro lugar.
  // Si registroVentas.html esta en la raiz y los iconos estan en /icons, deja "./icons/".
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
  apiUrl: "/api/sales",
};

document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
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
      showMessage(message, "Venta guardada correctamente.", false);
    } catch (error) {
      showMessage(message, "No se pudo guardar la venta. Intenta nuevamente.", true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

function getSaleData(form) {
  const formData = new FormData(form);

  return {
    product: String(formData.get("product") || "").trim(),
    saleType: String(formData.get("saleType") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    amount: Number(formData.get("amount") || 0),
    paymentMethod: String(formData.get("paymentMethod") || "").trim(),
    createdAt: new Date().toISOString(),
  };
}

function isValidSale(sale) {
  return sale.saleType && sale.description && sale.amount > 0 && sale.paymentMethod;
}

async function saveSale(sale) {
  try {
    const response = await fetch(SALE_CONFIG.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(sale),
    });

    if (!response.ok) {
      throw new Error("API unavailable");
    }

    return await response.json();
  } catch (error) {
    saveSaleLocally(sale);
    return sale;
  }
}

function saveSaleLocally(sale) {
  const storageKey = "smartcontrol_sales";
  const currentSales = JSON.parse(localStorage.getItem(storageKey) || "[]");

  currentSales.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ...sale,
  });

  localStorage.setItem(storageKey, JSON.stringify(currentSales));
}

function showMessage(messageElement, text, isError) {
  messageElement.textContent = text;
  messageElement.classList.toggle("form-message--error", isError);
}