/**
 * Critical Admin Login Bug Fix
 * Prevents dual display of login and dashboard during admin login
 */
(() => {
  const AdminLoginFix = (() => {
    const BASE_URL = 'http://localhost:5500/odym-frontend';
    
    const methods = {
      /**
       * Enhanced admin login without interference - versión mejorada
       */
      performAdminLogin: async (identifier, password) => {
        try {
          console.log('🔐 Iniciando login de admin...');
          
          // Set login in progress flag with timestamp for timeout protection
          const loginStartTime = new Date().getTime();
          sessionStorage.setItem('admin_login_in_progress', 'true');
          sessionStorage.setItem('admin_login_start_time', loginStartTime.toString());
          
          // Clear everything first to prevent conflicts
          localStorage.clear();
          sessionStorage.setItem('admin_login_in_progress', 'true'); // Restore flag after clear
          sessionStorage.setItem('admin_login_start_time', loginStartTime.toString()); // Restore timestamp
          
          // Add loading state with better UX
          document.body.style.opacity = '0.7';
          document.body.style.pointerEvents = 'none';
          
          // Show loading indicator if on login page
          if (window.location.pathname.includes('/auth/')) {
            const existingLoading = document.getElementById('admin-login-loading');
            if (existingLoading) {
              existingLoading.remove();
            }
            
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'admin-login-loading';
            loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            loadingDiv.innerHTML = `
              <div class="bg-white rounded-lg p-6 text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p class="text-gray-700">Iniciando sesión como administrador...</p>
                <p class="text-gray-500 text-sm mt-2">Por favor espere...</p>
              </div>
            `;
            document.body.appendChild(loadingDiv);
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

          // Verify admin access with comprehensive checks
          const isAdmin = methods.verifyAdminAccess(data.customer);

          if (!isAdmin) {
            throw new Error('Acceso denegado. Se requieren permisos de administrador.');
          }

          console.log('✅ Admin verificado, configurando sesión...');

          // Set admin session with explicit flags and enhanced data
          const adminSession = {
            ...data.customer,
            isAdmin: true,
            type: 'admin',
            role: 'admin',
            loginTime: new Date().getTime(),
            sessionType: 'admin',
            lastActivity: new Date().getTime(),
            adminLoginMethod: 'AdminLoginFix'
          };

          localStorage.setItem('user', JSON.stringify(adminSession));
          
          console.log('🔄 Redirigiendo al panel de admin...');
          
          // Add a safety timeout to clear the flag if redirect fails
          setTimeout(() => {
            sessionStorage.removeItem('admin_login_in_progress');
            sessionStorage.removeItem('admin_login_start_time');
          }, 10000); // 10 seconds timeout
          
          // Force redirect to admin panel with proper flag and longer delay
          setTimeout(() => {
            window.location.replace(`${BASE_URL}/admin/index.html?redirected=true`);
          }, 800); // Increased delay to ensure session is set

        } catch (error) {
          console.error('❌ Error en login de admin:', error);
          
          // Clean up loading states
          methods.cleanupLoginState();
          
          alert(error.message);
        }
      },

      /**
       * Comprehensive admin access verification
       */
      verifyAdminAccess: (user) => {
        if (!user) return false;
        
        const adminEmails = ['admin@odym.com', 'admin@admin.com', 'administrador@odym.com'];
        const adminUsernames = ['admin', 'administrator', 'administrador'];
        
        return adminEmails.includes(user.email?.toLowerCase()) || 
               adminUsernames.includes(user.username?.toLowerCase()) ||
               user.role === 'admin' ||
               user.type === 'admin' ||
               user.isAdmin === true ||
               user.sessionType === 'admin';
      },

      /**
       * Prevent dual display on login pages
       */
      preventDualDisplay: () => {
        // Hide any existing content if user is already logged in
        const user = localStorage.getItem('user');
        if (user) {
          try {
            const userData = JSON.parse(user);
            if (userData.isAdmin && window.location.pathname.includes('/auth/')) {
              // Force redirect to admin if already logged in
              window.location.replace(`${BASE_URL}/admin/index.html`);
            } else if (window.location.pathname.includes('/auth/')) {
              // Force redirect to home if regular user
              window.location.replace(BASE_URL);
            }
          } catch (error) {
            localStorage.removeItem('user');
          }
        }
      },

      /**
       * Clean up login state - nueva función
       */
      cleanupLoginState: () => {
        sessionStorage.removeItem('admin_login_in_progress');
        sessionStorage.removeItem('admin_login_start_time');
        document.body.style.opacity = '1';
        document.body.style.pointerEvents = 'auto';
        
        const loadingDiv = document.getElementById('admin-login-loading');
        if (loadingDiv) {
          loadingDiv.remove();
        }
      },

      /**
       * Check for stuck login process - nueva función
       */
      checkStuckLogin: () => {
        const loginInProgress = sessionStorage.getItem('admin_login_in_progress');
        const loginStartTime = sessionStorage.getItem('admin_login_start_time');
        
        if (loginInProgress && loginStartTime) {
          const currentTime = new Date().getTime();
          const elapsedTime = currentTime - parseInt(loginStartTime);
          
          // If login has been in progress for more than 15 seconds, clean up
          if (elapsedTime > 15000) {
            console.warn('⚠️ Login process stuck, cleaning up...');
            methods.cleanupLoginState();
          }
        }
      },

      /**
       * Clean logout for admin
       */
      adminLogout: () => {
        methods.cleanupLoginState();
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace(`${BASE_URL}/auth/login.html`);
      }
    };

    return {
      performAdminLogin: methods.performAdminLogin,
      preventDualDisplay: methods.preventDualDisplay,
      adminLogout: methods.adminLogout,
      cleanupLoginState: methods.cleanupLoginState,
      checkStuckLogin: methods.checkStuckLogin
    };
  })();

  // Make AdminLoginFix globally accessible
  window.AdminLoginFix = AdminLoginFix;
  
  // Initialize on login pages with stuck login check
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/auth/')) {
      AdminLoginFix.preventDualDisplay();
      AdminLoginFix.checkStuckLogin();
    }
    
    // Check for stuck login process every 5 seconds
    setInterval(() => {
      AdminLoginFix.checkStuckLogin();
    }, 5000);
  });
})();
