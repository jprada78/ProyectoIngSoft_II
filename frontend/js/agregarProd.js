const API_BASE_URL =
    window.location.port === "5500" || window.location.port === "5501"
        ? "http://localhost:3000"
        : "";

const PRODUCT_CONFIG = {
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
    categoryPrefixes: {
        "Papelería": "PAP",
        "Juguetería": "JUG",
        "Comida": "COM",
        "Otros": "OTR",
    },
};

document.addEventListener("DOMContentLoaded", () => {
    applyIcons();
    setupLogout();
    setupMobileMenu();
    setupProductForm();
    loadProductIfEditing();
});

function applyIcons() {
    document.querySelectorAll(".js-icon").forEach((iconElement) => {
        const iconKey = iconElement.dataset.icon;
        const iconFile = PRODUCT_CONFIG.icons[iconKey];

        if (!iconFile) return;

        iconElement.src = `${PRODUCT_CONFIG.iconBasePath}${iconFile}`;
        iconElement.addEventListener("error", () => {
            iconElement.style.visibility = "hidden";
        });
    });
}

function setupProductForm() {
    const form = document.getElementById("product-form");
    const message = document.getElementById("form-message");

    if (!form || !message) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitButton = form.querySelector(".save-button");
        const product = getProductData(form);

        if (!isValidProduct(product)) {
            showMessage(message, "Completa todos los campos correctamente.", true);
            return;
        }

        submitButton.disabled = true;
        showMessage(message, "Guardando producto...", false);

        try {
            await saveProduct(product);
            window.location.href = "inventario.html";
        } catch (error) {
            showMessage(message, "No se pudo guardar el producto. Intenta nuevamente.", true);
        } finally {
            submitButton.disabled = false;
        }
    });
}

async function loadProductIfEditing() {
    const productId = new URLSearchParams(window.location.search).get("id");

    if (!productId) return;

    try {
        const products = await fetchProducts();
        const product = products.find((item) => item.id === productId);

        if (!product) return;

        setValue("product-name", product.name);
        setValue("product-category", product.category);
        setValue("sale-price", product.salePrice);
        setValue("cost", product.cost);
        setValue("stock", product.stock);
        setValue("min-stock", product.minStock);
        setText("form-title", "Editar Producto");
        setText("save-button-text", "Guardar");
    } catch (error) {
        console.error("ERROR CARGAR PRODUCTO:", error);
    }
}

async function fetchProducts() {
    const response = await fetch(PRODUCT_CONFIG.apiUrl, {
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

function getProductData(form) {
    const formData = new FormData(form);
    const editingId = new URLSearchParams(window.location.search).get("id");

    return {
        id: editingId || "",
        name: String(formData.get("name") || "").trim(),
        category: String(formData.get("category") || "").trim(),
        salePrice: Number(formData.get("salePrice") || 0),
        cost: Number(formData.get("cost") || 0),
        stock: Number(formData.get("stock") || 0),
        minStock: Number(formData.get("minStock") || 0),
    };
}

function isValidProduct(product) {
    return (
        product.name &&
        product.category &&
        Number.isFinite(product.salePrice) &&
        product.salePrice >= 0 &&
        Number.isFinite(product.cost) &&
        product.cost >= 0 &&
        Number.isInteger(product.stock) &&
        product.stock >= 0 &&
        Number.isInteger(product.minStock) &&
        product.minStock >= 0
    );
}

async function saveProduct(product) {
    const productToSave = await buildProductToSave(product);

    const response = await fetch(PRODUCT_CONFIG.apiUrl, {
        method: product.id ? "PUT" : "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(productToSave),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "No se pudo guardar el producto");
    }

    return data;
}


async function buildProductToSave(product) {
    if (product.id) {
        return product;
    }

    const products = await fetchProducts();

    return {
        ...product,
        id: generateProductId(product.category, products),
    };
}

function generateProductId(category, products) {
    const prefix = PRODUCT_CONFIG.categoryPrefixes[category] || "OTR";
    const categoryProducts = products.filter((product) => String(product.id).startsWith(`${prefix}-`));
    const nextNumber =
        categoryProducts.reduce((max, product) => {
            const numericPart = Number(String(product.id).split("-")[1] || 0);
            return Math.max(max, numericPart);
        }, 0) + 1;

    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

function showMessage(messageElement, text, isError) {
    messageElement.textContent = text;
    messageElement.classList.toggle("form-message--error", isError);
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = String(value);
    }
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
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