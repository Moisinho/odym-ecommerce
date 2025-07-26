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
          const user = methods.getUser();
          const isAdmin = methods.isAdminUser(user);
          
          if (isAdmin) {
            window.location.href = `${BASE_URL}/admin/`;
          } else {
            window.location.href = BASE_URL;
          }
          return false;
        }
        
        // Verificar si un usuario normal está intentando acceder al panel de admin
        if (methods.isAuthenticated() && currentPath.includes('/admin/')) {
          const user = methods.getUser();
          const isAdmin = methods.isAdminUser(user);
          
          if (!isAdmin) {
            // Usuario normal intentando acceder al admin, redirigir a inicio
            window.location.href = BASE_URL;
            return false;
          }
        }
        
        return true;
      },

      // Nueva función para detectar si un usuario es admin
      isAdminUser: (user) => {
        if (!user) return false;
        
        // Verificar diferentes formas de identificar un admin
        const adminIdentifiers = [
          // Por email
          user.email === 'admin@odym.com',
          user.email === 'admin@admin.com',
          user.email === 'administrador@odym.com',
          // Por username
          user.username === 'admin',
          user.username === 'administrator',
          user.username === 'administrador',
          // Por rol si existe
          user.role === 'admin',
          user.role === 'administrator',
          // Por tipo de usuario
          user.userType === 'admin',
          user.type === 'admin',
          // Por propiedad isAdmin
          user.isAdmin === true,
          // Por subscription/plan
          user.subscription === 'admin',
          user.subscription === 'ADMIN',
          user.plan === 'admin'
        ];
        
        return adminIdentifiers.some(condition => condition === true);
      },

      // --- Lógica para el menú de usuario en el header ---
      initUserMenu: () => {
        // Buscar el botón de usuario con múltiples selectores
        const userBtn = document.querySelector('.user-auth-button') ||
                       document.getElementById('userAuthButton') ||
                       document.querySelector('#userAuthButton');
        const userMenu = document.getElementById('userMenu');
        const cartBtn = document.querySelector('.fa-shopping-cart')?.parentElement;
        
        console.log('🔍 Inicializando menú de usuario...');
        console.log('👤 Botón de usuario encontrado:', !!userBtn);
        console.log('📋 Menú de usuario encontrado:', !!userMenu);
        console.log('🛒 Botón de carrito encontrado:', !!cartBtn);

        function renderUserMenu() {
          const user = methods.getUser();
          console.log('🔄 Renderizando menú de usuario...');
          console.log('👤 Usuario autenticado:', !!user);
          if (user) {
            console.log('📧 Email del usuario:', user.email);
            console.log('👤 Nombre del usuario:', user.fullName || user.username);
          }
          
          if (user) {
            // Mostrar carrito y botón de usuario
            if (cartBtn) cartBtn.style.display = '';
            if (userBtn) userBtn.style.display = '';
            
            // Mostrar menú de usuario
            if (userMenu) {
              console.log('📋 Actualizando contenido del menú...');
              userMenu.innerHTML = `
                <div class="px-4 py-2 border-b">
                  <div class="font-bold text-gray-800">${user.fullName || user.username || 'Usuario'}</div>
                  <div class="text-xs text-gray-500">${user.email || 'Sin email'}</div>
                </div>
                <button id="logoutBtn" class="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Cerrar sesión</button>
              `;
              console.log('✅ Menú actualizado correctamente');
            } else {
              console.error('❌ No se encontró el elemento userMenu');
            }
            
            // Remover botón de login si existe
            const loginBtn = document.querySelector('.login-button');
            if (loginBtn) loginBtn.remove();
            
          } else {
            console.log('🚫 Usuario no autenticado, mostrando botón de login');
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
          console.log('✅ Configurando event listeners del menú...');
          
          // Mostrar/ocultar menú al hacer click en el icono de usuario
          userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('🖱️ Click en botón de usuario');
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
              console.log('🚪 Cerrando sesión...');
              methods.logout();
            }
          });
          
          // Render inicial y en cambios de auth
          renderUserMenu();
          window.addEventListener('auth-change', renderUserMenu);
          
          // Render inmediatamente al cargar
          setTimeout(renderUserMenu, 100);
          
        } else {
          console.warn('⚠️ No se pudieron encontrar los elementos del menú de usuario');
          console.log('🔍 Reintentando en 500ms...');
          
          // Reintentar después de un delay
          setTimeout(() => {
            methods.initUserMenu();
          }, 500);
        }
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
      checkAuth: methods.checkAuth,
      isAdminUser: methods.isAdminUser,
      initUserMenu: methods.initUserMenu
    };
  })();

  // Hacer AuthService globalmente accesible
  window.AuthService = AuthService;
  
  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    AuthService.init();
  });
})();
