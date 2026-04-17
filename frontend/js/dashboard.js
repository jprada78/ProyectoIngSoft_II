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
    if (!items || items.length === 0) return;
    const canvas = document.getElementById("sales-type-chart");
    const context = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 600;
    const cssHeight = canvas.clientHeight || 260;

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);

    const padding = {
        top: 8,
        right: 18,
        bottom: 31,
        left: 39,
    };

    const chartWidth = cssWidth - padding.left - padding.right;
    const chartHeight = cssHeight - padding.top - padding.bottom;
    const maxValue = Math.max(3000, ...items.map((item) => item.value));
    const ticks = [0, 1000, 2000, 3000];

    context.font = "12px Arial, Helvetica, sans-serif";
    context.lineWidth = 1;

    ticks.forEach((tick) => {
        const y = padding.top + chartHeight - (tick / maxValue) * chartHeight;

        context.strokeStyle = tick === 0 ? "#7f828a" : "#d8d9df";
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(padding.left + chartWidth, y);
        context.stroke();

        context.fillStyle = "#666a73";
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillText(`$${tick / 1000}k`, padding.left - 8, y);
    });

    context.strokeStyle = "#7f828a";
    context.beginPath();
    context.moveTo(padding.left, padding.top);
    context.lineTo(padding.left, padding.top + chartHeight);
    context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    context.stroke();

    if (items.length === 0) return;

    const gap = 28;
    const barArea = chartWidth - gap * 2;
    const barWidth = Math.min(263, Math.max(38, barArea / items.length - 14));

    items.forEach((item, index) => {
        const slotWidth = barArea / items.length;
        const x = padding.left + gap + slotWidth * index + (slotWidth - barWidth) / 2;
        const barHeight = (item.value / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        roundRect(context, x, y, barWidth, barHeight, 8, "#3164e5");

        context.fillStyle = "#666a73";
        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillText(item.label, x + barWidth / 2, padding.top + chartHeight + 10);
    });
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
