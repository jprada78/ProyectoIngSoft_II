const API_BASE_URL =
  window.location.port === "5500" || window.location.port === "5501"
    ? "http://localhost:3000"
    : "";

const CONFIG = {
  iconBasePath: "./icons/",

  icons: {
    logo: "logo.png",
    dashboard: "dashboard2.png",
    sale: "carrito2.png",
    expense: "factura2.png",
    inventory: "Inventario2.png",
    corresponsal: "corresponsal2.png",
    shortcuts: "acceso-directo2.png",
    notifications: "notificacion1.png",
    logout: "cerrar-sesion.png",
    save: "Guardar.png",
  },

  storageKey: "smartcontrol_notifications"
};

document.addEventListener("DOMContentLoaded", () => {
  applyIcons();
  setupLogout();
  setupMobileMenu();
  setupNotificationsForm();
  setupChannelFields();
  loadSavedConfig();
});

/* ICONOS */
function applyIcons() {
  document.querySelectorAll(".js-icon").forEach((el) => {
    const key = el.dataset.icon;
    const file = CONFIG.icons[key];
    if (!file) return;

    el.src = `${CONFIG.iconBasePath}${file}`;
    el.onerror = () => {
      el.style.visibility = "hidden";
    };
  });
}

/* FORM */
function setupNotificationsForm() {
  const form = document.getElementById("notifications-form");
  const message = document.getElementById("form-message");

  if (!form || !message) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const button = form.querySelector(".save-button");
    const config = getFormData();

    if (!isValidConfig(config)) {
      showMessage(message, "Activa al menos un canal y completa su dato.", true);
      return;
    }

    button.disabled = true;
    showMessage(message, "Guardando configuración...", false);

    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(config));
      showSuccessModal();
      showMessage(message, "Configuración guardada correctamente.", false);
    } catch (err) {
      showMessage(message, "Error al guardar configuración.", true);
    } finally {
      button.disabled = false;
    }
  });
}

/* MOSTRAR / OCULTAR CAMPOS */
function setupChannelFields() {
  const emailCheckbox = document.getElementById("email");
  const smsCheckbox = document.getElementById("sms");

  emailCheckbox?.addEventListener("change", updateChannelFields);
  smsCheckbox?.addEventListener("change", updateChannelFields);

  updateChannelFields();
}

function updateChannelFields() {
  const emailChecked = document.getElementById("email")?.checked;
  const smsChecked = document.getElementById("sms")?.checked;

  const emailField = document.getElementById("email-field");
  const smsField = document.getElementById("sms-field");

  if (emailField) {
    emailField.hidden = !emailChecked;
  }

  if (smsField) {
    smsField.hidden = !smsChecked;
  }
}

/* OBTENER DATOS */
function getFormData() {
  return {
    email: document.getElementById("email").checked,
    sms: document.getElementById("sms").checked,
    emailAddress: String(document.getElementById("email-address")?.value || "").trim(),
    smsNumber: String(document.getElementById("sms-number")?.value || "").trim(),
    outStock: document.getElementById("out-stock").checked,
    criticalStock: document.getElementById("critical-stock").checked,
    lowStock: document.getElementById("low-stock").checked,
  };
}

/* VALIDACION */
function isValidConfig(config) {
  if (!config.email && !config.sms) {
    return false;
  }

  if (config.email && !config.emailAddress) {
    return false;
  }

  if (config.sms && !config.smsNumber) {
    return false;
  }

  return true;
}

/* CARGAR CONFIG GUARDADA */
function loadSavedConfig() {
  const saved = localStorage.getItem(CONFIG.storageKey);
  if (!saved) {
    updateChannelFields();
    return;
  }

  try {
    const config = JSON.parse(saved);

    document.getElementById("email").checked = config.email || false;
    document.getElementById("sms").checked = config.sms || false;
    document.getElementById("out-stock").checked = config.outStock || false;
    document.getElementById("critical-stock").checked = config.criticalStock || false;
    document.getElementById("low-stock").checked = config.lowStock || false;

    if (document.getElementById("email-address")) {
      document.getElementById("email-address").value = config.emailAddress || "";
    }

    if (document.getElementById("sms-number")) {
      document.getElementById("sms-number").value = config.smsNumber || "";
    }

    updateChannelFields();
  } catch (e) {
    console.error("Error cargando configuración", e);
  }
}

/* MENSAJES */
function showMessage(el, text, isError) {
  el.textContent = text;
  el.classList.toggle("form-message--error", isError);
}

/* LOGOUT */
function setupLogout() {
  const btn = document.querySelector(".logout-button");
  if (!btn) return;

  btn.addEventListener("click", () => {
    localStorage.removeItem("smartcontrol_user");
    localStorage.removeItem("smartcontrol_token");
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}

/* MENU MOBILE */
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

/* MODAL */
function showSuccessModal() {
  const modal = document.getElementById("success-modal");
  if (!modal) return;

  modal.hidden = false;

  setTimeout(() => {
    modal.hidden = true;
  }, 1500);
}
