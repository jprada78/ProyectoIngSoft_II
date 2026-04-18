const API_BASE_URL =
    window.location.port === "5500" || window.location.port === "5501"
        ? "http://localhost:3000"
        : "";

const DASHBOARD_CONFIG = {
    iconBasePath: "./icons/",

    icons: {
        logo: "logo.png",
        dashboard: "dashboard1.png",
        sale: "carrito2.png",
        expense: "factura2.png",
        inventory: "Inventario2.png",
        corresponsal: "corresponsal2.png",
        shortcuts: "acceso-directo2.png",
        notifications: "notificacion2.png",
        logout: "cerrar-sesion.png",
        alert: "alerta.png",
        boxAlert: "box-alert.png",
        salesCard: "ventas-blue.png",
        expensesCard: "gastos-red.png",
        profitCard: "ganancias.png",
        calendarCard: "calendario.png",
        trend: "flecha.png",
    },

    // Este endpoint puede devolver el mismo formato.
    apiUrl: `${API_BASE_URL}/api/dashboard/summary`,

};

const fallbackData = {
    alert: {
        count: 0,
        product: "",
    },
    cards: {
        salesDay: 0,
        expensesDay: 0,
        netProfit: 0,
        monthTotal: 0,
    },
    topProducts: [],
    salesByType: [],
};

const currencyFormatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

let currentDashboardData = fallbackData;

document.addEventListener("DOMContentLoaded", async () => {
    applyIcons();
    setupLogout();
    setupMobileMenu();
    renderDashboard(fallbackData);

    const dashboardData = await loadDashboardData();
    renderDashboard(dashboardData);
});

function applyIcons() {
    document.querySelectorAll(".js-icon").forEach((iconElement) => {
        const iconKey = iconElement.dataset.icon;
        const iconFile = DASHBOARD_CONFIG.icons[iconKey];

        if (!iconFile) return;

        iconElement.src = `${DASHBOARD_CONFIG.iconBasePath}${iconFile}`;
        iconElement.addEventListener("error", () => {
            iconElement.style.visibility = "hidden";
        });
    });
}

async function loadDashboardData() {
    try {
        const response = await fetch(DASHBOARD_CONFIG.apiUrl, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Dashboard API unavailable");
        }

        return await response.json();
    } catch (error) {
        return fallbackData;
    }
}

function renderDashboard(data) {
    currentDashboardData = data;

    renderStockAlert(data.alert);

    document.getElementById("sales-day").textContent = formatMoney(data.cards.salesDay);
    document.getElementById("expenses-day").textContent = formatMoney(data.cards.expensesDay);
    document.getElementById("net-profit").textContent = formatMoney(data.cards.netProfit);
    document.getElementById("month-total").textContent = formatMoney(data.cards.monthTotal);

    renderDashboardState(data);
    renderTopProducts(data.topProducts);
    drawSalesByTypeChart(data.salesByType);
}

function renderStockAlert(alert) {
    const stockAlert = document.getElementById("stock-alert");

    if (!alert || alert.count <= 0) {
        stockAlert.hidden = true;
        return;
    }

    stockAlert.hidden = false;
    document.getElementById("alert-count").textContent = alert.count;
    document.getElementById("alert-product").textContent = alert.product;
}

function renderDashboardState(data) {
    const hasSales =
        data.cards.monthTotal > 0 ||
        data.topProducts.length > 0 ||
        data.salesByType.length > 0;

    document.querySelector(".top-products").hidden = !hasSales;
    document.querySelector(".chart-panel").hidden = !hasSales;
    document.getElementById("empty-dashboard").hidden = hasSales;
}

function renderTopProducts(products) {
    const list = document.getElementById("top-products-list");
    list.innerHTML = "";

    products.slice(0, 5).forEach((product, index) => {
        const row = document.createElement("article");
        row.className = "product-row";

        row.innerHTML = `
      <span class="product-rank">${index + 1}</span>
      <div>
        <p class="product-name">${escapeHtml(product.name)}</p>
        <p class="product-units">${product.units} unidades vendidas</p>
      </div>
      <div class="product-income-wrap">
        <p class="product-income">${formatMoney(product.income)}</p>
        <p class="product-income-label">Ingresos totales</p>
      </div>
    `;

        list.appendChild(row);
    });
}

function drawSalesByTypeChart(items) {
    const canvas = document.getElementById("sales-type-chart");
    const context = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 600;
    const cssHeight = canvas.clientHeight || 320;

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);

    if (!items || items.length === 0) return;

    const padding = {
        top: 22,
        right: 24,
        bottom: 48,
        left: 78,
    };

    const chartWidth = cssWidth - padding.left - padding.right;
    const chartHeight = cssHeight - padding.top - padding.bottom;
    const rawMaxValue = Math.max(...items.map((item) => Number(item.value) || 0));
    const maxValue = getNiceMaxValue(rawMaxValue);
    const ticks = getChartTicks(maxValue, 5);

    context.font = "14px Arial, Helvetica, sans-serif";
    context.lineWidth = 1;

    ticks.forEach((tick) => {
        const y = padding.top + chartHeight - (tick / maxValue) * chartHeight;

        context.strokeStyle = tick === 0 ? "#7f828a" : "#e1e5ec";
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(padding.left + chartWidth, y);
        context.stroke();

        context.fillStyle = "#4f5663";
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillText(formatChartMoney(tick), padding.left - 12, y);
    });

    context.strokeStyle = "#7f828a";
    context.beginPath();
    context.moveTo(padding.left, padding.top);
    context.lineTo(padding.left, padding.top + chartHeight);
    context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    context.stroke();

    const gap = 28;
    const barArea = chartWidth - gap * 2;
    const slotWidth = barArea / items.length;
    const barWidth = Math.min(260, Math.max(48, slotWidth * 0.62));

    items.forEach((item, index) => {
        const value = Number(item.value) || 0;
        const x = padding.left + gap + slotWidth * index + (slotWidth - barWidth) / 2;
        const barHeight = (value / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        roundRect(context, x, y, barWidth, barHeight, 8, "#3164e5");

        context.fillStyle = "#666a73";
        context.textAlign = "center";
        context.textBaseline = "top";
        context.font = "14px Arial, Helvetica, sans-serif";
        context.fillText(item.label, x + barWidth / 2, padding.top + chartHeight + 14);
    });
}

function getNiceMaxValue(value) {
    if (value <= 0) return 1000;

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;

    let niceNormalized;

    if (normalized <= 1) {
        niceNormalized = 1;
    } else if (normalized <= 2) {
        niceNormalized = 2;
    } else if (normalized <= 5) {
        niceNormalized = 5;
    } else {
        niceNormalized = 10;
    }

    return niceNormalized * magnitude;
}

function getChartTicks(maxValue, tickCount) {
    const step = maxValue / tickCount;
    const ticks = [];

    for (let index = 0; index <= tickCount; index += 1) {
        ticks.push(step * index);
    }

    return ticks;
}

function formatChartMoney(value) {
    if (value >= 1000000) {
        return `$${removeTrailingZero(value / 1000000)}M`;
    }

    if (value >= 1000) {
        return `$${removeTrailingZero(value / 1000)}k`;
    }

    return `$${Math.round(value)}`;
}

function removeTrailingZero(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function roundRect(context, x, y, width, height, radius, color) {
    const safeRadius = Math.min(radius, width / 2, height / 2);

    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.lineTo(x + width - safeRadius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    context.lineTo(x + width, y + height);
    context.lineTo(x, y + height);
    context.lineTo(x, y + safeRadius);
    context.quadraticCurveTo(x, y, x + safeRadius, y);
    context.closePath();
    context.fill();
}

function formatMoney(value) {
    return currencyFormatter.format(value).replace("COP", "$").trim();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

window.addEventListener("resize", () => {
    drawSalesByTypeChart(currentDashboardData.salesByType);
});

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

