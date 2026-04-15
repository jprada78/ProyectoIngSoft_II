// 🔐 REGISTRO DESDE FRONTEND

document.getElementById("btnGuardar").addEventListener("click", async () => {

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const pregunta = document.getElementById("pregunta").value;
    const respuesta = document.getElementById("respuesta").value;

    // Validación
    if (!password || !confirmPassword || !pregunta || !respuesta) {
        alert("Todos los campos son obligatorios");
        return;
    }

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/register", {
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

document.getElementById("btnCancelar").addEventListener("click", () => {
    showScreen("login-inicial");
});

// 🔐 LOGIN

document.getElementById("btnLogin").addEventListener("click", async () => {

    const password = document.getElementById("loginPassword").value;

    if (!password) {
        alert("Ingrese la contraseña");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
        });

        const data = await res.text();

        if (res.ok) {
            alert("✅ Bienvenido");
        } else {
            alert(data);
        }

    } catch (error) {
        console.error(error);
        alert("Error al conectar con servidor");
    }
});

document.getElementById("btnVerificar").addEventListener("click", async () => {

    const respuesta = document.getElementById("respuestaRecuperacion").value;

    const res = await fetch("http://localhost:3000/verificar-respuesta", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ respuesta })
    });

    if (res.ok) {
        showScreen("nueva-password");
    } else {
        alert("Respuesta incorrecta");
    }
});

document.getElementById("btnNuevaPassword").addEventListener("click", async () => {

    const nueva = document.getElementById("nuevaPassword").value;
    const confirmar = document.getElementById("confirmarNuevaPassword").value;

    if (nueva !== confirmar) {
        alert("No coinciden");
        return;
    }

    const res = await fetch("http://localhost:3000/reset-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ nuevaPassword: nueva })
    });

    if (res.ok) {
        showScreen("registro-exitoso");
        setTimeout(() => {
        showScreen("login-inicial");
        }, 2000);
    }
});

// Cancelar en recuperar
document.getElementById("btnCancelarRecuperar").addEventListener("click", () => {
    showScreen("login-inicial");
});

// Cancelar en nueva contraseña
document.getElementById("btnCancelarNueva").addEventListener("click", () => {
    showScreen("login-inicial");
});

async function cargarPregunta() {
    try {
        const res = await fetch("http://localhost:3000/pregunta");
        const data = await res.json();

        document.getElementById("preguntaRecuperacion").value = data.pregunta;

    } catch (error) {
        console.error(error);
    }
}

async function verificarUsuario() {
    try {
        const res = await fetch("http://localhost:3000/existe-usuario");
        const data = await res.json();

        const link = document.getElementById("link-registrar");

        if (data.existe) {
            link.textContent = "¿Olvidó contraseña?";
            link.onclick = (e) => {
                e.preventDefault();
                showScreen("recuperar");
                cargarPregunta();
            };
        } else {
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

window.addEventListener("load", () => {
    verificarUsuario();
});