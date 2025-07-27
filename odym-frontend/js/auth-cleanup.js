/**
 * Enhanced Authentication Cleanup Service
 * Provides comprehensive cleanup for authentication data and session management
 */
(() => {
  const AuthCleanup = (() => {
    const AUTH_KEYS = [
      'user',
      'admin',
      'session',
      'auth_token',
      'refresh_token',
      'user_preferences',
      'cart',
      'wishlist',
      'recent_views',
      'search_history'
    ];

    const methods = {
      /**
       * Comprehensive cleanup of all authentication-related data
       */
      cleanupAll: () => {
        console.log('🧹 Iniciando limpieza completa de autenticación...');
        
        // Remove all authentication keys
        AUTH_KEYS.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`✅ Eliminado: ${key}`);
          }
        });

        // Clear session storage as well
        sessionStorage.clear();
        
        // Clear any cached admin data
        methods.clearAdminData();
        
        console.log('✅ Limpieza de autenticación completada');
      },

      /**
       * Clear admin-specific data
       */
      clearAdminData: () => {
        const adminKeys = [
          'admin_session',
          'admin_token',
          'admin_preferences',
          'admin_dashboard_state'
        ];
        
        adminKeys.forEach(key => {
          localStorage.removeItem(key);
        });
      },

      /**
       * Validate current session and cleanup if invalid
       */
      validateSession: () => {
        const user = localStorage.getItem('user');
        
        if (user) {
          try {
            const userData = JSON.parse(user);
            const now = new Date().getTime();
            const sessionTime = userData.lastActivity || 0;
            
            // Session expires after 24 hours
            if (now - sessionTime > 24 * 60 * 60 * 1000) {
              console.log('⏰ Sesión expirada, limpiando...');
              methods.cleanupAll();
              return false;
            }
            
            // Update last activity
            userData.lastActivity = now;
            localStorage.setItem('user', JSON.stringify(userData));
            
          } catch (error) {
            console.error('❌ Error al validar sesión:', error);
            methods.cleanupAll();
            return false;
          }
        }
        
        return true;
      },

      /**
       * Check if user is admin and validate admin session
       */
      validateAdminSession: () => {
        const user = localStorage.getItem('user');
        
        if (!user) return false;
        
        try {
          const userData = JSON.parse(user);
          
          // Check if user is admin
          const isAdmin = methods.isAdminUser(userData);
          
          if (isAdmin) {
            // Validate admin session
            const adminSession = localStorage.getItem('admin_session');
            if (!adminSession) {
              console.log('❌ Sesión de administrador no válida');
              return false;
            }
          }
          
          return isAdmin;
          
        } catch (error) {
          console.error('❌ Error al validar sesión de administrador:', error);
          return false;
        }
      },

      /**
       * Enhanced admin detection with session validation
       */
      isAdminUser: (user) => {
        if (!user) return false;
        
        // Check for admin role in user object
        const adminIdentifiers = [
          user.email === 'admin@odym.com',
          user.email === 'admin@admin.com',
          user.email === 'administrador@odym.com',
          user.username === 'admin',
          user.username === 'administrator',
          user.username === 'administrador',
          user.role === 'admin',
          user.role === 'administrator',
          user.userType === 'admin',
          user.type === 'admin',
          user.isAdmin === true,
          user.subscription === 'admin',
          user.subscription === 'ADMIN',
          user.plan === 'admin'
        ];
        
        return adminIdentifiers.some(condition => condition === true);
      },

      /**
       * Initialize session validation on page load
       */
      init: () => {
        // Validate session on page load
        methods.validateSession();
        
        // Set up periodic session validation
        setInterval(methods.validateSession, 5 * 60 * 1000); // Every 5 minutes
        
        console.log('🔐 Servicio de limpieza de autenticación inicializado');
      }
    };

    return {
      cleanupAll: methods.cleanupAll,
      clearAdminData: methods.clearAdminData,
      validateSession: methods.validateSession,
      validateAdminSession: methods.validateAdminSession,
      isAdminUser: methods.isAdminUser,
      init: methods.init
    };
  })();

  // Make AuthCleanup globally accessible
  window.AuthCleanup = AuthCleanup;
  
  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    AuthCleanup.init();
  });
})();
