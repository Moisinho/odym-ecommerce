// Variables globales
let sidebarOpen = true;
const API_BASE_URL = 'http://localhost:3000/api';
let authCheckInProgress = false;

// Inicialización con protección contra carga dual mejorada
document.addEventListener('DOMContentLoaded', function() {
    // Prevenir carga dual durante transición de login
    if (preventDualLoading()) {
        return;
    }
    
    // Verificar autenticación de admin con delay más largo para evitar race conditions
    setTimeout(() => {
        checkAdminAuth();
    }, 300);
    
    // Configurar eventos
    setupEvents();
    
    // Cargar modales
    loadModals();
});

// Prevenir carga dual del dashboard durante login - versión mejorada
function preventDualLoading() {
    // Verificar si venimos de una redirección de login
    const urlParams = new URLSearchParams(window.location.search);
    const isRedirected = urlParams.get('redirected') === 'true';
    
    // Verificar si hay un proceso de login en curso
    const loginInProgress = sessionStorage.getItem('admin_login_in_progress');
    
    if (loginInProgress && !isRedirected) {

        // Mantener el loading state existente en lugar de reemplazar todo el body
        const loadingDiv = document.getElementById('admin-loading');
        const dashboardDiv = document.getElementById('admin-dashboard');
        
        if (loadingDiv) {
            loadingDiv.style.display = 'flex';
            loadingDiv.innerHTML = `
                <div class="text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p class="text-gray-600">Completando inicio de sesión...</p>
                </div>
            `;
        }
        
        if (dashboardDiv) {
            dashboardDiv.style.display = 'none';
        }
        
        // Esperar a que termine el login con timeout de seguridad
        let attempts = 0;
        const maxAttempts = 20; // 10 segundos máximo
        
        const checkLoginComplete = setInterval(() => {
            attempts++;
            
            if (!sessionStorage.getItem('admin_login_in_progress') || attempts >= maxAttempts) {
                clearInterval(checkLoginComplete);
                
                if (attempts >= maxAttempts) {
                    console.warn('⚠️ Timeout esperando login, recargando...');
                    sessionStorage.removeItem('admin_login_in_progress');
                }
                
                window.location.reload();
            }
        }, 500);
        
        return true;
    }
    
    // Limpiar flag de redirección
    if (isRedirected) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        // Limpiar flag de login si existe
        sessionStorage.removeItem('admin_login_in_progress');
    }
    
    return false;
}

// Verificar autenticación de administrador con protección mejorada
function checkAdminAuth() {
    if (authCheckInProgress) {
        return;
    }
    
    authCheckInProgress = true;
    
    try {
        // Verificar si hay login en progreso antes de proceder
        if (sessionStorage.getItem('admin_login_in_progress')) {
            authCheckInProgress = false;
            setTimeout(checkAdminAuth, 500);
            return;
        }
        
        // Verificar si AuthService está disponible con reintentos
        if (!window.AuthService) {
            console.log('⏳ AuthService no disponible, esperando...');
            setTimeout(() => {
                authCheckInProgress = false;
                checkAdminAuth();
            }, 100);
            return;
        }
        
        // Verificar autenticación
        if (!window.AuthService.isAuthenticated()) {
            redirectToLogin();
            return;
        }
        
        const user = window.AuthService.getUser();
        
        if (!user) {
            redirectToLogin();
            return;
        }
        
        // Verificar permisos de admin con múltiples criterios
        const isAdmin = checkAdminPermissions(user);
        
        if (isAdmin) {
            updateAdminInfo(user);
            showDashboard();
        } else {
            alert('Acceso denegado. Se requieren permisos de administrador.');
            redirectToLogin();
        }
        
    } catch (error) {
        console.error('❌ Error en verificación de auth:', error);
        redirectToLogin();
    } finally {
        authCheckInProgress = false;
    }
}

// Verificar permisos de administrador
function checkAdminPermissions(user) {
    if (!user) return false;
    
    // Criterios múltiples para detectar admin
    const adminCriteria = [
        // Por email
        user.email === 'admin@odym.com',
        user.email === 'admin@admin.com', 
        user.email === 'administrador@odym.com',
        // Por username
        user.username === 'admin',
        user.username === 'administrator',
        user.username === 'administrador',
        // Por propiedades de rol
        user.role === 'admin',
        user.type === 'admin',
        user.isAdmin === true,
        user.sessionType === 'admin'
    ];
    
    return adminCriteria.some(criteria => criteria === true);
}

// Mostrar dashboard después de autenticación exitosa
function showDashboard() {
    // Hide loading screen and show dashboard
    const loadingDiv = document.getElementById('admin-loading');
    const dashboardDiv = document.getElementById('admin-dashboard');
    
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
    
    if (dashboardDiv) {
        dashboardDiv.style.display = 'flex';
    }
    
    // Remover cualquier loading state
    document.body.style.opacity = '1';
    document.body.style.pointerEvents = 'auto';
    
    // Limpiar flag de login en progreso
    sessionStorage.removeItem('admin_login_in_progress');

}

// Redirigir al login de administradores
function redirectToLogin() {
    window.location.href = '../auth/login.html';
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
    const modalsContainer = document.getElementById('modals-container');
    
    // Solo cargar modales si el contenedor existe
    if (modalsContainer) {
        fetch('modals.html')
            .then(response => response.text())
            .then(html => {
                modalsContainer.innerHTML = html;
                setupModals();
            })
            .catch(error => {
                console.log('ℹ️ No se pudieron cargar los modales (normal en algunas páginas):', error.message);
            });
    } else {
        console.log('ℹ️ No hay contenedor de modales en esta página');
    }
}

// Configurar eventos
function setupEvents() {
    // Toggle sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            const content = document.querySelector('.flex-1');
            
            if (sidebar && content) {
                if (sidebarOpen) {
                    sidebar.style.transform = 'translateX(-100%)';
                    content.style.marginLeft = '0';
                } else {
                    sidebar.style.transform = 'translateX(0)';
                    content.style.marginLeft = '16rem';
                }
                
                sidebarOpen = !sidebarOpen;
            }
        });
    }
    
    // Resaltar elemento activo en el sidebar
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
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

// Función para configurar modales (placeholder)
function setupModals() {

}

// ... (resto de funciones para manejar modales y notificaciones)
