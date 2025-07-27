/**
 * Admin Authentication Handler
 * Prevents admin login bugs and ensures proper admin session management
 */
(() => {
  const AdminAuth = (() => {
    const BASE_URL = 'http://localhost:5500/odym-frontend';

    const methods = {
      /**
       * Enhanced admin detection with strict validation
       */
      isAdminUser: (user) => {
        if (!user) return false;
        
        // Strict admin detection
        const adminEmails = [
          'admin@odym.com',
          'admin@admin.com',
          'administrador@odym.com'
        ];
        
        const adminUsernames = [
          'admin',
          'administrator',
          'administrador'
        ];
        
        return adminEmails.includes(user.email?.toLowerCase()) || 
               adminUsernames.includes(user.username?.toLowerCase()) ||
               user.role === 'admin' ||
               user.type === 'admin' ||
               user.isAdmin === true;
      },

      /**
       * Clean admin login without interference
       */
      loginAsAdmin: async (identifier, password) => {
        try {
          // Clear any existing session first
          if (window.AuthCleanup) {
            AuthCleanup.cleanupAll();
          } else {
            localStorage.clear();
            sessionStorage.clear();
          }

          const response = await fetch('http://localhost:3000/api/customers/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password })
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Credenciales inválidas');
          }

          // Verify admin access
          if (!methods.isAdminUser(data.customer)) {
            throw new Error('Acceso denegado. Se requieren permisos de administrador.');
          }

          // Mark as admin
          const adminUser = {
            ...data.customer,
            isAdmin: true,
            type: 'admin',
            role: 'admin',
            loginTime: new Date().getTime()
          };

          // Set admin session
          localStorage.setItem('user', JSON.stringify(adminUser));
          
          // Force redirect to admin panel
          setTimeout(() => {
            window.location.href = `${BASE_URL}/admin/index.html`;
          }, 200);

          return true;

        } catch (error) {
          console.error('Admin login error:', error);
          alert(error.message);
          return false;
        }
      },

      /**
       * Force admin logout
       */
      adminLogout: () => {
        if (window.AuthCleanup) {
          AuthCleanup.cleanupAll();
        } else {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        window.location.href = `${BASE_URL}/auth/login.html`;
      },

      /**
       * Check if current user is admin
       */
      checkAdminAccess: () => {
        const user = localStorage.getItem('user');
        if (!user) return false;
        
        try {
          const userData = JSON.parse(user);
          return methods.isAdminUser(userData);
        } catch (error) {
          console.error('Error checking admin access:', error);
          return false;
        }
      }
    };

    return {
      isAdminUser: methods.isAdminUser,
      loginAsAdmin: methods.loginAsAdmin,
      adminLogout: methods.adminLogout,
      checkAdminAccess: methods.checkAdminAccess
    };
  })();

  // Make AdminAuth globally accessible
  window.AdminAuth = AdminAuth;
})();
