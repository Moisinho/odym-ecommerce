// Auth module
const Auth = (() => {
    // Estado de autenticación
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    
    // Elementos del DOM
    const elements = {
        authModal: document.getElementById('authModal'),
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        authModalTitle: document.getElementById('authModalTitle'),
        loginTab: document.getElementById('loginTab'),
        registerTab: document.getElementById('registerTab'),
        userButton: document.querySelector('.user-auth-button')
    };
    
    // Inicializar
    function init() {
        bindEvents();
        updateUI();
    }
    
    // Vincular eventos
    function bindEvents() {
        // Tabs
        if (elements.loginTab) {
            elements.loginTab.addEventListener('click', showLoginForm);
        }
        if (elements.registerTab) {
            elements.registerTab.addEventListener('click', showRegisterForm);
        }
        
        // Botón de usuario
        if (elements.userButton) {
            elements.userButton.addEventListener('click', function(e) {
                if (currentUser) {
                    e.preventDefault();
                    toggleUserMenu();
                } else {
                    toggleAuthModal();
                }
            });
        }
    }
    
    // Mostrar formulario de login
    function showLoginForm() {
        elements.loginForm.classList.remove('hidden');
        elements.registerForm.classList.add('hidden');
        elements.authModalTitle.textContent = 'Iniciar sesión';
        
        // Actualizar tabs
        elements.loginTab.classList.add('active-tab');
        elements.registerTab.classList.remove('active-tab');
    }
    
    // Mostrar formulario de registro
    function showRegisterForm() {
        elements.loginForm.classList.add('hidden');
        elements.registerForm.classList.remove('hidden');
        elements.authModalTitle.textContent = 'Crear cuenta';
        
        // Actualizar tabs
        elements.registerTab.classList.add('active-tab');
        elements.loginTab.classList.remove('active-tab');
    }
    
    // Alternar modal de autenticación
    function toggleAuthModal() {
        elements.authModal.classList.toggle('active');
        document.body.style.overflow = elements.authModal.classList.contains('active') ? 'hidden' : '';
        
        if (elements.authModal.classList.contains('active')) {
            showLoginForm();
        }
    }
    
    // Cerrar modal de autenticación
    function closeAuthModal() {
        elements.authModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Manejar login
    function handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = {
                name: user.name,
                email: user.email
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Sesión iniciada correctamente');
            closeAuthModal();
            updateUI();
        } else {
            showNotification('Credenciales incorrectas', 'error');
        }
    }
    
    // Manejar registro
    function handleRegister(event) {
        event.preventDefault();
        
        const firstName = document.getElementById('registerFirstName').value;
        const lastName = document.getElementById('registerLastName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validaciones
        if (password !== confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.some(u => u.email === email)) {
            showNotification('Este email ya está registrado', 'error');
            return;
        }
        
        const newUser = {
            name: `${firstName} ${lastName}`,
            email: email,
            password: password
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            name: newUser.name,
            email: newUser.email
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification('Cuenta creada correctamente');
        closeAuthModal();
        updateUI();
    }
    
    // Cerrar sesión
    function logout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUI();
        showNotification('Sesión cerrada correctamente');
    }
    
    // Mostrar menú de usuario
    function toggleUserMenu() {
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';
        userMenu.innerHTML = `
            <div class="user-menu-item" onclick="Auth.logout()">Cerrar sesión</div>
            <a href="account.html" class="user-menu-item">Mi cuenta</a>
            <a href="orders.html" class="user-menu-item">Mis pedidos</a>
        `;
        
        elements.userButton.appendChild(userMenu);
        
        document.addEventListener('click', function closeMenu(e) {
            if (!elements.userButton.contains(e.target)) {
                userMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }
    
    // Actualizar UI según estado de autenticación
    function updateUI() {
        if (!elements.userButton) return;
        
        if (currentUser) {
            elements.userButton.innerHTML = `
                <div class="user-profile">
                    <span class="user-name">${currentUser.name.split(' ')[0]}</span>
                    <div class="user-avatar">${currentUser.name.charAt(0)}</div>
                </div>
            `;
        } else {
            elements.userButton.innerHTML = '<i class="fas fa-user"></i>';
        }
    }
    
    // Mostrar notificación
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // API pública
    return {
        init,
        toggleAuthModal,
        closeAuthModal,
        handleLogin,
        handleRegister,
        logout,
        currentUser: () => currentUser
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    
    // Asignar manejadores si los formularios existen
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => Auth.handleLogin(e));
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => Auth.handleRegister(e));
    }
});

// Hacer Auth accesible globalmente
window.Auth = Auth;