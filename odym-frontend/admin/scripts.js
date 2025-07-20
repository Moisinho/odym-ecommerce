// Variables globales
let sidebarOpen = true;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Configurar eventos
    setupEvents();
    
    // Cargar modales
    loadModals();
});

// Cargar modales desde archivo externo
function loadModals() {
    fetch('modals.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('modals-container').innerHTML = html;
            setupModals();
        });
}

// Configurar eventos
function setupEvents() {
    // Toggle sidebar
    document.getElementById('sidebarToggle')?.addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        const content = document.querySelector('.flex-1');
        
        if (sidebarOpen) {
            sidebar.style.transform = 'translateX(-100%)';
            content.style.marginLeft = '0';
        } else {
            sidebar.style.transform = 'translateX(0)';
            content.style.marginLeft = '16rem';
        }
        
        sidebarOpen = !sidebarOpen;
    });
    
    // Resaltar elemento activo en el sidebar
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Funciones para mostrar/ocultar modales
function showProductModal() {
    document.getElementById('productModal').classList.remove('hidden');
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('productModal').classList.add('hidden');
}

// ... (resto de funciones para manejar modales y notificaciones)