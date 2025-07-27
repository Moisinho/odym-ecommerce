(() => {
  const AuthService = (() => {
    // Corregir la URL base para que coincida con el backend
    const BASE_URL = "http://localhost:5500/odym-frontend";
    const API_URL = "http://localhost:3000/api";

    const methods = {
      isAuthenticated: () => {
        const user = localStorage.getItem("user");
        return !!user;
      },

      getUser: () => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
      },

      setUser: (userData) => {
        localStorage.setItem("user", JSON.stringify(userData));
        // Emitir evento de cambio de autenticación
        window.dispatchEvent(new Event("auth-change"));
      },

      logout: () => {
        // Use comprehensive cleanup
        if (window.AuthCleanup) {
          AuthCleanup.cleanupAll();
        } else {
          // Fallback cleanup
          localStorage.removeItem("user");
          localStorage.removeItem("admin");
          localStorage.removeItem("cart");
          sessionStorage.clear();
        }

        // Emitir evento de cambio de autenticación
        window.dispatchEvent(new Event("auth-change"));
        window.location.href = `${BASE_URL}/auth/login.html`;
      },

      checkAuth: () => {
        const publicPages = [
          "/auth/login.html",
          "/auth/register.html",
          "/logout.html",
        ];
        const currentPath = window.location.pathname;

        // Prevent redirect loops
        if (window.location.href.includes("redirected=true")) {
          return true;
        }

        // Enhanced admin login process protection
        if (sessionStorage.getItem("admin_login_in_progress")) {
          return true;
        }

        // Special handling for admin pages during login transition
        if (currentPath.includes("/admin/")) {
          const loginInProgress = sessionStorage.getItem("admin_login_in_progress");
          if (loginInProgress) {
            return true;
          }
          
          // Add small delay for admin pages to prevent race conditions
          if (!methods.isAuthenticated()) {
            setTimeout(() => {
              if (!sessionStorage.getItem("admin_login_in_progress")) {
                window.location.href = `${BASE_URL}/auth/login.html`;
              }
            }, 200);
            return false;
          }
        }

        // Permitir navegación libre para páginas públicas
        const alwaysPublicPages = [
          "/",
          "/index.html",
          "/products.html",
          "/success.html",
          "/cancel.html",
        ];
        const isAlwaysPublic = alwaysPublicPages.some(
          (page) => currentPath.includes(page) || currentPath.endsWith(page)
        );

        // Solo redirigir si está en páginas protegidas sin autenticación
        if (
          !methods.isAuthenticated() &&
          !publicPages.some((page) => currentPath.includes(page))
        ) {
          // No redirigir de páginas públicas
          if (isAlwaysPublic) {
            return true;
          }

          // Redirigir solo de páginas protegidas
          if (
            currentPath.includes("/account/") ||
            currentPath.includes("/admin/")
          ) {
            window.location.href = `${BASE_URL}/auth/login.html`;
            return false;
          }
        }

        // Redirigir usuarios autenticados de páginas de login/registro
        if (
          methods.isAuthenticated() &&
          publicPages.some((page) => currentPath.includes(page))
        ) {
          const user = methods.getUser();
          const isAdmin = methods.isAdminUser(user);

          if (isAdmin) {
            // Force admin redirect with flag to prevent loops
            const adminUrl = `${BASE_URL}/admin/index.html?redirected=true`;
            window.location.replace(adminUrl);
            return false;
          } else {
            // Regular user redirect
            const homeUrl = `${BASE_URL}?redirected=true`;
            window.location.replace(homeUrl);
            return false;
          }
        }

        // Verificar si un usuario normal está intentando acceder al panel de admin
        if (methods.isAuthenticated() && currentPath.includes("/admin/")) {
          const user = methods.getUser();
          const isAdmin = methods.isAdminUser(user);

          if (!isAdmin) {
            // Usuario normal intentando acceder al admin, redirigir a inicio
            window.location.href = `${BASE_URL}?redirected=true`;
            return false;
          }
        }

        return true;
      },

      // Nueva función mejorada para detectar usuarios admin
      isAdminUser: (user) => {
        if (!user) return false;

        // Convertir a string para comparación más robusta
        const userEmail = (user.email || "").toLowerCase();
        const userName = (user.username || "").toLowerCase();
        const userRole = (user.role || "").toLowerCase();
        const userType = (user.type || "").toLowerCase();

        // Criterios ampliados y más flexibles para detectar admin
        const adminIdentifiers = [
          // Por email - múltiples variaciones
          userEmail === "admin@odym.com",
          userEmail === "admin@admin.com",
          userEmail === "administrador@odym.com",
          userEmail === "admin@localhost.com",
          userEmail === "admin@example.com",
          userEmail.includes("admin"),
          userEmail.includes("administrador"),

          // Por username
          userName === "admin",
          userName === "administrator",
          userName === "administrador",
          userName === "root",
          userName === "superadmin",

          // Por rol
          userRole === "admin",
          userRole === "administrator",
          userRole === "superadmin",
          userRole === "root",

          // Por tipo
          userType === "admin",
          userType === "administrator",
          userType === "superadmin",

          // Por propiedades booleanas
          user.isAdmin === true,
          user.isAdministrator === true,
          user.isSuperAdmin === true,

          // Por subscription/plan
          user.subscription === "admin",
          user.subscription === "ADMIN",
          user.plan === "admin",
          user.plan === "ADMIN",

          // Por sessionType
          user.sessionType === "admin",
          user.sessionType === "ADMIN",
        ];

        return adminIdentifiers.some((condition) => condition === true);
      },

      /**
       * Enhanced admin login with proper session isolation
       */
      loginAdmin: async (credentials) => {
        try {
          const response = await fetch(`${API_URL}/customers/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Error al iniciar sesión");
          }

          // Check if user is admin
          if (!methods.isAdminUser(data.customer)) {
            throw new Error(
              "Acceso denegado. Se requieren permisos de administrador."
            );
          }

          // Clear any existing session data first
          if (window.AuthCleanup) {
            AuthCleanup.cleanupAll();
          }

          // Set admin session
          data.customer.isAdmin = true;
          data.customer.type = "admin";
          methods.setUser(data.customer);

          // Redirect to admin panel
          window.location.href = `${BASE_URL}/admin/index.html`;
        } catch (error) {
          console.error("Error al iniciar sesión como admin:", error);
          alert(error.message || "Error al iniciar sesión");
        }
      },

      // --- Lógica para el menú de usuario en el header ---
      initUserMenu: () => {
        // Buscar el botón de usuario con múltiples selectores
        const userBtn =
          document.querySelector(".user-auth-button") ||
          document.getElementById("userAuthButton") ||
          document.querySelector("#userAuthButton");
        const userMenu = document.getElementById("userMenu");
        const cartBtn =
          document.querySelector(".fa-shopping-cart")?.parentElement;

        function renderUserMenu() {
          const user = methods.getUser();
        
          if (user) {
            // Mostrar carrito y botón de usuario
            if (cartBtn) cartBtn.style.display = "";
            if (userBtn) userBtn.style.display = "";

            // Mostrar menú de usuario
            if (userMenu) {
              userMenu.innerHTML = `
                <div class="px-4 py-2 border-b">
                  <div class="font-bold text-gray-800">${
                    user.fullName || user.username || "Usuario"
                  }</div>
                  <div class="text-xs text-gray-500">${
                    user.email || "Sin email"
                  }</div>
                </div>
                <button id="logoutBtn" class="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Cerrar sesión</button>
              `;
              
            } else {
              console.error("❌ No se encontró el elemento userMenu");
            }

            // Remover botón de login si existe
            const loginBtn = document.querySelector(".login-button");
            if (loginBtn) loginBtn.remove();
          } else {
            // Para usuarios no autenticados
            if (cartBtn) cartBtn.style.display = ""; // Mostrar carrito para todos

            // Reemplazar botón de usuario con botón de login
            if (userBtn) {
              userBtn.style.display = "none"; // Ocultar botón de usuario

              // Crear botón de login si no existe
              let loginBtn = document.querySelector(".login-button");
              if (!loginBtn) {
                const userContainer = userBtn.parentElement;
                loginBtn = document.createElement("button");
                loginBtn.className =
                  "login-button bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300";
                loginBtn.textContent = "Iniciar Sesión";
                loginBtn.onclick = () =>
                  (window.location.href = "/odym-frontend/auth/login.html");

                if (userContainer) {
                  userContainer.appendChild(loginBtn);
                }
              }
            }

            // Limpiar menú
            if (userMenu) {
              userMenu.innerHTML = "";
            }
          }
        }

        if (userBtn && userMenu) {

          // Mostrar/ocultar menú al hacer click en el icono de usuario
          userBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            userMenu.classList.toggle("hidden");
            renderUserMenu();
          });

          // Cerrar menú al hacer click fuera
          document.addEventListener("click", (e) => {
            if (!userMenu.classList.contains("hidden")) {
              userMenu.classList.add("hidden");
            }
          });

          // Delegar clicks en el menú
          userMenu.addEventListener("click", (e) => {
            if (e.target.id === "logoutBtn") {
              console.log("🚪 Cerrando sesión...");
              methods.logout();
            }
          });

          // Render inicial y en cambios de auth
          renderUserMenu();
          window.addEventListener("auth-change", renderUserMenu);

          // Render inmediatamente al cargar
          setTimeout(renderUserMenu, 100);
        } else {
          

          // Reintentar después de un delay
          setTimeout(() => {
            methods.initUserMenu();
          }, 500);
        }
      },
    };

    return {
      init: () => {
        methods.checkAuth();
        // Emitir evento inicial de autenticación
        window.dispatchEvent(new Event("auth-change"));
        // Inicializar menú de usuario
        methods.initUserMenu();
      },
      isAuthenticated: methods.isAuthenticated,
      getUser: methods.getUser,
      setUser: methods.setUser,
      logout: methods.logout,
      checkAuth: methods.checkAuth,
      isAdminUser: methods.isAdminUser,
      initUserMenu: methods.initUserMenu,

      redirectAfterLogin: (user) => {
        const BASE_URL = "http://localhost:5500/odym-frontend";

        // Ensure clean session before redirect
        if (window.AuthCleanup) {
          AuthCleanup.validateSession();
        }

        if (methods.isAdminUser(user)) {
          // Force admin redirect without interference
          setTimeout(() => {
            window.location.href = `${BASE_URL}/admin/index.html`;
          }, 100);
        } else {
          // Regular user redirect
          setTimeout(() => {
            window.location.href = BASE_URL;
          }, 100);
        }
      },
    };
  })();

  // Hacer AuthService globalmente accesible
  window.AuthService = AuthService;

  // Inicializar cuando el DOM esté listo
  document.addEventListener("DOMContentLoaded", () => {
    AuthService.init();
  });
})();
