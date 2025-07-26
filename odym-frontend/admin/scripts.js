// Variables globales
let sidebarOpen = true;
const API_BASE_URL = 'http://localhost:3000/api';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación de admin
    checkAdminAuth();
    
    // Configurar eventos
    setupEvents();
    
    // Cargar modales
    loadModals();
});

// Verificar autenticación de administrador
function checkAdminAuth() {
    // Usar AuthService para obtener datos del usuario
    if (!window.AuthService || !window.AuthService.isAuthenticated()) {
        redirectToLogin();
        return;
    }
    
    const user = window.AuthService.getUser();
    
    if (!user || !user._id) {
        redirectToLogin();
        return;
    }
    
    // Verificar si el usuario tiene rol de admin
    if (user.role === 'admin') {
        // Usuario autenticado como admin
        updateAdminInfo(user);
    } else {
        // Verificar en el servidor como respaldo
        fetch(`${API_BASE_URL}/customers/is-admin/${user._id}`)
            .then(response => response.json())
            .then(data => {
                if (!data.isAdmin) {
                    alert('Acceso denegado. Se requieren permisos de administrador.');
                    redirectToLogin();
                } else {
                    // Usuario autenticado como admin
                    updateAdminInfo(user);
                }
            })
            .catch(error => {
                console.error('Error verificando permisos de admin:', error);
                redirectToLogin();
            });
    }
}

// Redirigir al login de administradores
function redirectToLogin() {
    window.location.href = './login.html';
}

// Actualizar información del admin en la interfaz
function updateAdminInfo(user) {
    // Actualizar nombre del admin en el header
    const adminNameElement = document.querySelector('header .font-medium');
    if (adminNameElement) {
        adminNameElement.textContent = user.fullName || user.username || 'Admin User';
    }
    
    // Actualizar inicial del avatar
    const avatarElement = document.querySelector('header .bg-orange-600');
    if (avatarElement && user.fullName) {
        avatarElement.textContent = user.fullName.charAt(0).toUpperCase();
    }
}

// Cerrar sesión
function logout() {
    if (window.AuthService) {
        window.AuthService.logout();
    } else {
        localStorage.removeItem('user');
        redirectToLogin();
    }
}

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