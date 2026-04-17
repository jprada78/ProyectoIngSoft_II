// cambiar entre pantallas.

// Controla qué pantalla se muestra

function showScreen(screenId) {

    const screens = document.querySelectorAll('.screen');

    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    document.getElementById(screenId).classList.add('active');
}

// Evento registrar contraseña
document.getElementById('link-registrar')
    .addEventListener('click', function(e) {
        e.preventDefault();
        showScreen('registro');
});
