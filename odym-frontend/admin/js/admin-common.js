/**
 * Common JavaScript functions for ODYM Admin Panel
 */

// Simple AuthService implementation for admin
const AuthService = {
    getUser() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    setUser(user) {
        try {
            localStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
            console.error('Error setting user:', error);
        }
    },

    logout() {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();

        // Emit auth change event
        window.dispatchEvent(new Event('auth-change'));

        // Redirect to login with full path
        window.location.href = '/odym-frontend/auth/login.html';
    },

    isAdmin(user = null) {
        const currentUser = user || this.getUser();
        if (!currentUser) return false;

        // Check admin privileges
        return currentUser.role === 'admin' ||
            currentUser.isAdmin === true ||
            currentUser.type === 'admin' ||
            ['admin@odym.com', 'admin@admin.com', 'administrador@odym.com'].includes(currentUser.email?.toLowerCase()) ||
            ['admin', 'administrator', 'administrador'].includes(currentUser.username?.toLowerCase());
    }
};

// Global admin logout function
function adminLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        console.log('🚪 Cerrando sesión de admin...');
        AuthService.logout();
    }
}

// Global admin authentication check
function checkAdminAuth() {
    console.log('🔐 Verificando autenticación de admin...');

    const user = AuthService.getUser();
    if (!user) {
        console.log('❌ Usuario no autenticado, redirigiendo a login...');
        window.location.href = '/odym-frontend/auth/login.html';
        return false;
    }

    if (!AuthService.isAdmin(user)) {
        console.log('❌ Usuario sin permisos de admin, redirigiendo...');
        alert('Acceso denegado. Se requieren permisos de administrador.');
        window.location.href = '/odym-frontend/index.html';
        return false;
    }

    console.log('✅ Usuario admin verificado:', user);
    return user;
}

// Initialize admin page
function initAdminPage() {
    // Check authentication first
    const user = checkAdminAuth();
    if (!user) return;

    // Update admin name in header if element exists
    const adminNameEl = document.getElementById('admin-name');
    if (adminNameEl) {
        adminNameEl.textContent = user.fullName || user.username || 'Admin User';
    }

    // Set active sidebar link based on current page
    setActiveSidebarLink();

    // Setup sidebar toggle if exists
    setupSidebarToggle();

    console.log('✅ Página de admin inicializada correctamente');
}

// Set active sidebar link based on current page
function setActiveSidebarLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && href === currentPage) {
            link.classList.add('active');
        }
    });
}

// Generate complete sidebar HTML
function generateSidebarHTML(activePage = '') {
    return `
        <aside id="sidebar" class="bg-white shadow-md w-64 fixed h-full z-30 overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center">
                    <span class="text-2xl font-extrabold text-gray-800">OD<span class="text-orange-600">YM</span></span>
                    <span class="ml-2 text-sm font-medium text-gray-600">Admin</span>
                </div>
            </div>
            
            <nav class="mt-6">
                <div class="px-4 mb-2">
                    <p class="text-xs uppercase tracking-wider text-gray-500">General</p>
                </div>
                <a href="index.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'index.html' ? 'active' : ''}">
                    <i class="fas fa-tachometer-alt mr-3"></i>
                    <span>Dashboard</span>
                </a>
                <div class="px-4 mt-6 mb-2">
                    <p class="text-xs uppercase tracking-wider text-gray-500">Gestión</p>
                </div>
                <a href="products.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'products.html' ? 'active' : ''}">
                    <i class="fas fa-box mr-3"></i>
                    <span>Productos</span>
                </a>
                <a href="categories.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'categories.html' ? 'active' : ''}">
                    <i class="fas fa-tags mr-3"></i>
                    <span>Categorías</span>
                </a>
                <a href="orders.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'orders.html' ? 'active' : ''}">
                    <i class="fas fa-shopping-cart mr-3"></i>
                    <span>Pedidos</span>
                </a>
                <a href="bills.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'bills.html' ? 'active' : ''}">
                    <i class="fas fa-file-invoice mr-3"></i>
                    <span>Facturas</span>
                </a>
                <a href="clients.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'clients.html' ? 'active' : ''}">
                    <i class="fas fa-users mr-3"></i>
                    <span>Clientes</span>
                </a>
                <a href="admins.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'admins.html' ? 'active' : ''}">
                    <i class="fas fa-user-shield mr-3"></i>
                    <span>Administradores</span>
                </a>
                <a href="distributors.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'distributors.html' ? 'active' : ''}">
                    <i class="fas fa-motorcycle mr-3"></i>
                    <span>Repartidores</span>
                </a>
                <a href="subscriptions.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'subscriptions.html' ? 'active' : ''}">
                    <i class="fas fa-crown mr-3"></i>
                    <span>Suscripciones</span>
                </a>
                <div class="px-4 mt-6 mb-2">
                    <p class="text-xs uppercase tracking-wider text-gray-500">Configuración</p>
                </div>
                <a href="settings.html" class="sidebar-link flex items-center px-6 py-3 ${activePage === 'settings.html' ? 'active' : ''}">
                    <i class="fas fa-cog mr-3"></i>
                    <span>Ajustes</span>
                </a>
                <a href="#" onclick="adminLogout()" class="sidebar-link flex items-center px-6 py-3 text-red-600 hover:bg-red-100">
                    <i class="fas fa-sign-out-alt mr-3"></i>
                    <span>Cerrar sesión</span>
                </a>
            </nav>
        </aside>
    `;
}

// Setup sidebar toggle functionality
function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
        });
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

// Utility function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Utility function to show loading state
function showLoading(elementId, message = 'Cargando...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin mr-2"></i>
                ${message}
            </div>
        `;
    }
}

// Utility function to show error state
function showError(elementId, message = 'Error al cargar datos') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex items-center justify-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                ${message}
            </div>
        `;
    }
}

// API helper functions
const API = {
    baseURL: 'http://localhost:3000/api',

    async get(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API GET error for ${endpoint}:`, error);
            throw error;
        }
    },

    async post(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API POST error for ${endpoint}:`, error);
            throw error;
        }
    },

    async put(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API PUT error for ${endpoint}:`, error);
            throw error;
        }
    },

    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API DELETE error for ${endpoint}:`, error);
            throw error;
        }
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPage);
} else {
    initAdminPage();
}

// Make functions globally available
window.AuthService = AuthService;
window.adminLogout = adminLogout;
window.checkAdminAuth = checkAdminAuth;
window.initAdminPage = initAdminPage;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.showLoading = showLoading;
window.showError = showError;
window.generateSidebarHTML = generateSidebarHTML;
window.API = API;