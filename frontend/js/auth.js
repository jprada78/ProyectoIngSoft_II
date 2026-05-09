// Define la URL del backend dependiendo si es local o producción
const API_URL =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "https://proyectoingsoft-ii.onrender.com";

// REGISTRO DESDE FRONTEND

document.getElementById("btnGuardar").addEventListener("click", async () => {

    // Obtiene valores del formulario
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const pregunta = document.getElementById("pregunta").value;
    const respuesta = document.getElementById("respuesta").value;

    // Validación de campos vacíos
    if (!password || !confirmPassword || !pregunta || !respuesta) {
        alert("Todos los campos son obligatorios");
        return;
    }

    // Validación de contraseñas
    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    try {
        // Envía datos al backend para registrar
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password,
                pregunta,
                respuesta
            })
        });

        const data = await res.text();

        console.log("RESPUESTA BACKEND:", data);

        // Si hay error, lo muestra
        if (!res.ok) {
            alert("Error: " + data);
            return;
        }

        // Cambia comportamiento del link según estado
        const link = document.getElementById("link-registrar");

        link.textContent = "¿Olvidó contraseña?";
        link.onclick = (e) => {
            e.preventDefault();
            showScreen("recuperar");
            cargarPregunta();
        };

        // Ir a pantalla de éxito (opcional)
        showScreen("registro-exitoso");

        // Volver al login después de 2 segundos
        setTimeout(() => {
            showScreen("login-inicial");
        }, 2000);

    } catch (error) {
        console.error(error);
        alert("Error al conectar con el servidor");
    }
});

// Botón cancelar registro
document.getElementById("btnCancelar").addEventListener("click", () => {
    showScreen("login-inicial");
});

// LOGIN

document.getElementById("btnLogin").addEventListener("click", async () => {

    const password = document.getElementById("loginPassword").value;

    if (!password) {
        alert("Ingrese la contraseña");
        return;
    }

    try {
        // Envía contraseña al backend
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
        });

        const data = await res.text();

        // Si login es correcto, entra al dashboard
        if (res.ok) {
            window.location.href = "dashboard.html";
        } else {
            alert(data);
        }

    } catch (error) {
        console.error(error);
        alert("Error al conectar con servidor");
    }
});

// VERIFICAR RESPUESTA (RECUPERACIÓN)
document.getElementById("btnVerificar").addEventListener("click", async () => {

    const respuesta = document.getElementById("respuestaRecuperacion").value;

    // Envía respuesta al backend
    const res = await fetch(`${API_URL}/verificar-respuesta`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ respuesta })
    });

    // Si es correcta, pasa a cambiar contraseña
    if (res.ok) {
        showScreen("nueva-password");
    } else {
        alert("Respuesta incorrecta");
    }
});

// NUEVA CONTRASEÑA
document.getElementById("btnNuevaPassword").addEventListener("click", async () => {

    const nueva = document.getElementById("nuevaPassword").value;
    const confirmar = document.getElementById("confirmarNuevaPassword").value;

    // Validación de coincidencia
    if (nueva !== confirmar) {
        alert("No coinciden");
        return;
    }

    // Envía nueva contraseña al backend
    const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ nuevaPassword: nueva })
    });

    // Si se actualiza correctamente
    if (res.ok) {
        showScreen("registro-exitoso");
        setTimeout(() => {
            showScreen("login-inicial");
        }, 2000);
    }
});

// Cancelar recuperación
document.getElementById("btnCancelarRecuperar").addEventListener("click", () => {
    showScreen("login-inicial");
});

// Cancelar cambio de contraseña
document.getElementById("btnCancelarNueva").addEventListener("click", () => {
    showScreen("login-inicial");
});

// CARGAR PREGUNTA DE SEGURIDAD
async function cargarPregunta() {
    try {
        const res = await fetch(`${API_URL}/pregunta`);
        const data = await res.json();

        // Muestra pregunta en el input
        document.getElementById("preguntaRecuperacion").value = data.pregunta;

    } catch (error) {
        console.error(error);
    }
}

// VERIFICAR SI EXISTE USUARIO
async function verificarUsuario() {
    try {
        const res = await fetch(`${API_URL}/existe-usuario`);
        const data = await res.json();

        const link = document.getElementById("link-registrar");

        // Si ya hay usuario → opción recuperar
        if (data.existe) {
            link.textContent = "¿Olvidó contraseña?";
            link.onclick = (e) => {
                e.preventDefault();
                showScreen("recuperar");
                cargarPregunta();
            };
        } else {
            // Si no hay usuario → opción registrar
            link.textContent = "Registrar contraseña por primera vez";
            link.onclick = (e) => {
                e.preventDefault();
                showScreen("registro");
            };
        }

    } catch (error) {
        console.error(error);
    }
}

// Se ejecuta cuando carga la página
window.addEventListener("load", () => {
    verificarUsuario();
});

document.getElementById("btnGoogleLogin").addEventListener("click", async () => {
    try {
        const result = await firebaseAuth.signInWithPopup(googleProvider);
        const idToken = await result.user.getIdToken();

        const res = await fetch(`${API_URL}/auth/google`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ idToken })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "No se pudo iniciar sesión con Google");
            await firebaseAuth.signOut();
            return;
        }

        localStorage.setItem("smartcontrol_user", JSON.stringify(data.user));
        localStorage.setItem("smartcontrol_token", idToken);

        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("ERROR GOOGLE LOGIN:", error);
        alert("Error al iniciar sesión con Google");
    }
});
