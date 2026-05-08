// cambiar entre pantallas.

// Controla qué pantalla se muestra

// Función que permite cambiar entre pantallas del sistema (tipo login, registro, etc.)
function showScreen(screenId) {

    // Selecciona todas las pantallas del sistema
    const screens = document.querySelectorAll('.screen');

    // Quita la clase 'active' a todas para ocultarlas
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // Activa solo la pantalla que se quiere mostrar
    document.getElementById(screenId).classList.add('active');
}

// Evento que se ejecuta cuando el usuario hace clic en "registrar contraseña"
document.getElementById('link-registrar')
    .addEventListener('click', function(e) {
        e.preventDefault(); // Evita comportamiento por defecto del enlace
        showScreen('registro');
});
