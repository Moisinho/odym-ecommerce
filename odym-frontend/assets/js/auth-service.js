(() => {
  const AuthService = (() => {
    const BASE_URL = 'http://localhost:5500/odym-frontend';

    const methods = {
      isAuthenticated: () => {
        const user = localStorage.getItem('user');
        return !!user;
      },

      getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
      },

      setUser: (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        // Emitir evento de cambio de autenticación
        window.dispatchEvent(new Event('auth-change'));
      },

      logout: () => {
        localStorage.removeItem('user');
        // Emitir evento de cambio de autenticación
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = `${BASE_URL}/auth/login.html`;
      },

      checkAuth: () => {
        const publicPages = ['/auth/login.html', '/auth/register.html', '/logout.html'];
        const currentPath = window.location.pathname;
        
        // Permitir navegación libre para páginas públicas
        const alwaysPublicPages = ['/', '/index.html', '/products.html', '/success.html', '/cancel.html'];
        const isAlwaysPublic = alwaysPublicPages.some(page => 
          currentPath.includes(page) || 
          currentPath.endsWith(page)
        );
        
        // Solo redirigir si está en páginas protegidas sin autenticación
        if (!methods.isAuthenticated() && !publicPages.some(page => currentPath.includes(page))) {
          // No redirigir de páginas públicas
          if (isAlwaysPublic) {
            return true;
          }
          
          // Redirigir solo de páginas protegidas
          if (currentPath.includes('/account/') || currentPath.includes('/admin/')) {
            window.location.href = `${BASE_URL}/auth/login.html`;
            return false;
          }
        }
        
        // Redirigir usuarios autenticados de páginas de login/registro
        if (methods.isAuthenticated() && publicPages.some(page => currentPath.includes(page))) {
          window.location.href = BASE_URL;
          return false;
        }
        
        return true;
      },

      // --- Lógica para el menú de usuario en el header ---
      initUserMenu: () => {
        const userBtn = document.querySelector('.user-auth-button');
        const userMenu = document.getElementById('userMenu');
        const cartBtn = document.querySelector('.fa-shopping-cart')?.parentElement;

        function renderUserMenu() {
          const user = methods.getUser();
          
          if (user) {
            // Mostrar carrito y botón de usuario
            if (cartBtn) cartBtn.style.display = '';
            if (userBtn) userBtn.style.display = '';
            
            // Mostrar menú de usuario
            if (userMenu) {
              userMenu.innerHTML = `
                <div class="px-4 py-2 border-b">
                  <div class="font-bold text-gray-800">${user.fullName || user.username}</div>
                  <div class="text-xs text-gray-500">${user.email || ''}</div>
                </div>
                <button id="logoutBtn" class="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Cerrar sesión</button>
              `;
            }
            
            // Remover botón de login si existe
            const loginBtn = document.querySelector('.login-button');
            if (loginBtn) loginBtn.remove();
            
          } else {
            // Para usuarios no autenticados
            if (cartBtn) cartBtn.style.display = ''; // Mostrar carrito para todos
            
            // Reemplazar botón de usuario con botón de login
            if (userBtn) {
              userBtn.style.display = 'none'; // Ocultar botón de usuario
              
              // Crear botón de login si no existe
              let loginBtn = document.querySelector('.login-button');
              if (!loginBtn) {
                const userContainer = userBtn.parentElement;
                loginBtn = document.createElement('button');
                loginBtn.className = 'login-button bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300';
                loginBtn.textContent = 'Iniciar Sesión';
                loginBtn.onclick = () => window.location.href = '/odym-frontend/auth/login.html';
                
                if (userContainer) {
                  userContainer.appendChild(loginBtn);
                }
              }
            }
            
            // Limpiar menú
            if (userMenu) {
              userMenu.innerHTML = '';
            }
          }
        }

        if (userBtn && userMenu) {
          // Mostrar/ocultar menú al hacer click en el icono de usuario
          userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('hidden');
            renderUserMenu();
          });

          // Cerrar menú al hacer click fuera
          document.addEventListener('click', (e) => {
            if (!userMenu.classList.contains('hidden')) {
              userMenu.classList.add('hidden');
            }
          });

          // Delegar clicks en el menú
          userMenu.addEventListener('click', (e) => {
            if (e.target.id === 'logoutBtn') {
              methods.logout();
            }
          });
        }

        // Render inicial y en cambios de auth
        renderUserMenu();
        window.addEventListener('auth-change', renderUserMenu);
        
        // Render inmediatamente al cargar
        setTimeout(renderUserMenu, 100);
      }
    };

    return {
      init: () => {
        methods.checkAuth();
        // Emitir evento inicial de autenticación
        window.dispatchEvent(new Event('auth-change'));
        // Inicializar menú de usuario
        methods.initUserMenu();
      },
      isAuthenticated: methods.isAuthenticated,
      getUser: methods.getUser,
      setUser: methods.setUser,
      logout: methods.logout,
      checkAuth: methods.checkAuth
    };
  })();

  // Hacer AuthService globalmente accesible
  window.AuthService = AuthService;
  
  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    AuthService.init();
  });
})();
