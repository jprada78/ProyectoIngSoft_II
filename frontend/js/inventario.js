const API_BASE_URL =
  window.location.port === "5500" || window.location.port === "5501"
    ? "http://localhost:3000"
    : "";

const INVENTORY_CONFIG = {
  iconBasePath: "./icons/",
  icons: {
    logo: "logo.png",
    dashboard: "dashboard2.png",
    sale: "carrito2.png",
    expense: "factura2.png",
    inventory: "Inventario1.png",
    corresponsal: "corresponsal2.png",
    shortcuts: "acceso-directo2.png",
    notifications: "notificacion2.png",
    logout: "cerrar-sesion.png",
  },
  apiUrl: `${API_BASE_URL}/api/products`,
};

document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
  setupMobileMenu();
  setupFilters();
  renderInventory();
});

function applyIcons() {
  document.querySelectorAll(".js-icon").forEach((iconElement) => {
    const iconKey = iconElement.dataset.icon;
    const iconFile = INVENTORY_CONFIG.icons[iconKey];

    if (!iconFile) return;

    iconElement.src = `${INVENTORY_CONFIG.iconBasePath}${iconFile}`;
    iconElement.addEventListener("error", () => {
      iconElement.style.visibility = "hidden";
    });
  });
}

function setupFilters() {
  const searchInput = document.getElementById("search-product");
  const categoryFilter = document.getElementById("category-filter");

  searchInput?.addEventListener("input", renderInventory);
  categoryFilter?.addEventListener("change", renderInventory);
}

async function renderInventory() {
  const searchValue = String(document.getElementById("search-product")?.value || "")
    .trim()
    .toLowerCase();
  const categoryValue = String(document.getElementById("category-filter")?.value || "").trim();

  try {
    const allProducts = await fetchProducts();

    const filteredProducts = allProducts.filter((product) => {
      const matchesSearch =
        !searchValue ||
        product.name.toLowerCase().includes(searchValue) ||
        product.id.toLowerCase().includes(searchValue);

      const matchesCategory = !categoryValue || product.category === categoryValue;

      return matchesSearch && matchesCategory;
    });

    renderTable(filteredProducts, allProducts.length);
    renderStats(allProducts);
  } catch (error) {
    console.error("ERROR CARGAR INVENTARIO:", error);
    renderTable([], 0);
    renderStats([]);
  }
}

async function fetchProducts() {
  const response = await fetch(INVENTORY_CONFIG.apiUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudo cargar el inventario");
  }

  return Array.isArray(data) ? data : [];
}

function renderTable(products, totalProducts = 0) {
  const tableBody = document.getElementById("inventory-body");
  const emptyState = document.getElementById("empty-state");
  const emptyStateText = document.getElementById("empty-state-text");

  if (!tableBody || !emptyState || !emptyStateText) return;

  if (products.length === 0) {
    tableBody.innerHTML = "";
    emptyState.hidden = false;
    emptyStateText.textContent =
      totalProducts > 0
        ? "No hay productos que coincidan con la búsqueda"
        : "No hay productos registrados";
    return;
  }

  emptyState.hidden = true;
  tableBody.innerHTML = products.map(createRowMarkup).join("");

  tableBody.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", async () => {
      await deleteProduct(button.dataset.id);
    });
  });

  tableBody.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = `agregarProd.html?id=${encodeURIComponent(button.dataset.id)}`;
    });
  });
}

function createRowMarkup(product) {
  const stock = Number(product.stock);
  const minStock = Number(product.minStock);
  const status = getStockStatus(stock, minStock);

  return `
    <tr>
      <td><span class="product-id">${formatIdForCell(product.id)}</span></td>
      <td>${escapeHtml(product.name)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${formatCurrency(product.salePrice)}</td>
      <td>${formatCurrency(product.cost)}</td>
      <td class="stock-cell"><strong>${stock}</strong> <span>/ ${minStock} min</span></td>
      <td><span class="status-badge ${status.className}">${status.label}</span></td>
      <td class="actions-cell">
        <button class="action-button action-button--edit" type="button" data-action="edit" data-id="${escapeAttribute(product.id)}" aria-label="Editar producto">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 20L8.5 19L19 8.5L15.5 5L5 15.5L4 20Z"></path>
            <path d="M13.5 7L17 10.5"></path>
          </svg>
        </button>
        <button class="action-button action-button--delete" type="button" data-action="delete" data-id="${escapeAttribute(product.id)}" aria-label="Eliminar producto">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 7H20"></path>
            <path d="M9 7V4H15V7"></path>
            <path d="M7 7L8 20H16L17 7"></path>
            <path d="M10 11V17"></path>
            <path d="M14 11V17"></path>
          </svg>
        </button>
      </td>
    </tr>
  `;
}

function renderStats(products) {
  const totals = products.reduce(
    (accumulator, product) => {
      const status = getStockStatus(Number(product.stock), Number(product.minStock)).key;
      accumulator.total += 1;
      accumulator[status] += 1;
      return accumulator;
    },
    { total: 0, normal: 0, low: 0, out: 0 }
  );

  setText("total-products", totals.total);
  setText("stock-normal", totals.normal);
  setText("stock-low", totals.low);
  setText("stock-out", totals.out);
}

async function deleteProduct(productId) {
  try {
    const response = await fetch(`${INVENTORY_CONFIG.apiUrl}/${encodeURIComponent(productId)}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "No se pudo eliminar el producto");
    }

    await renderInventory();
  } catch (error) {
    console.error("ERROR ELIMINAR PRODUCTO:", error);
  }
}

function getStockStatus(stock, minStock) {
  if (stock <= 0) {
    return { key: "out", label: "Agotado", className: "status-badge--out" };
  }

  if (stock <= minStock) {
    return { key: "low", label: "Bajo", className: "status-badge--low" };
  }

  return { key: "normal", label: "Normal", className: "status-badge--normal" };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatIdForCell(id) {
  const [prefix, numeric] = String(id).split("-");
  if (!prefix || !numeric) return escapeHtml(String(id));
  return `${escapeHtml(prefix)}-\n${escapeHtml(numeric)}`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = String(value);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
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
