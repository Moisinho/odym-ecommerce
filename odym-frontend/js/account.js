// account.js - Para manejar la página de cuenta de usuario
document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.currentUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Mostrar información del usuario
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    
    // Cargar pedidos del usuario
    loadUserOrders(user.email);
});

function loadUserOrders(email) {
    // Aquí iría la lógica para cargar los pedidos del usuario
    console.log("Cargando pedidos para:", email);
}