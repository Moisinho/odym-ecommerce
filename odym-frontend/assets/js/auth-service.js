(() => {
  const AuthService = (() => {
    const BASE_URL = 'http://localhost:5500/odym-frontend';

    const methods = {
      isAuthenticated: () => {
        const user = localStorage.getItem('user');
        return !!user;
      }

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
        const publicPages = ['/auth/login.html', '/auth/register.html'];
        const currentPath = window.location.pathname;
        
        if (!methods.isAuthenticated() && !publicPages.some(page => currentPath.includes(page))) {
          window.location.href = `${BASE_URL}/auth/login.html`;
          return false;
        }
        
        if (methods.isAuthenticated() && publicPages.some(page => currentPath.includes(page))) {
          window.location.href = BASE_URL;
          return false;
        }
        
        return true;
      }
    };

    return {
      init: () => {
        methods.checkAuth();
        // Emitir evento inicial de autenticación
        window.dispatchEvent(new Event('auth-change'));
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
