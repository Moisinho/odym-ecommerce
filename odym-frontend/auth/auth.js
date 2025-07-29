(() => {
  const Auth = (() => {
    const htmlElements = {
      // Registration elements
      step1Form: document.querySelector("#step-1"),
      step2Form: document.querySelector("#step-2"),
      nextBtn: document.querySelector("#next-btn"),
      prevBtn: document.querySelector("#prev-btn"),
      formTitle: document.querySelector("#form-title"),
      fullNameInput: document.querySelector("#nombre"),
      usernameInput: document.querySelector("#usuario"),
      emailInput: document.querySelector("#correo"),
      passwordInput: document.querySelector("#contrasena"),
      phoneInput: document.querySelector("#telefono"),
      addressInput: document.querySelector("#direccion"),
      // Error messages for registration
      fullNameError: document.querySelector("#nombre-error"),
      usernameError: document.querySelector("#usuario-error"),
      emailError: document.querySelector("#correo-error"),
      passwordError: document.querySelector("#contrasena-error"),
      phoneError: document.querySelector("#telefono-error"),
      addressError: document.querySelector("#direccion-error"),
      // Login elements
      loginForm: document.querySelector("#login-form"),
      loginIdentifierInput: document.querySelector("#login-identifier"),
      loginPasswordInput: document.querySelector("#login-password"),
      loginButton: document.querySelector("#login-button"),
      // Error messages for login
      identifierError: document.querySelector("#identifier-error"),
      loginPasswordError: document.querySelector("#password-error")
    }

    const handlers = {
      handleStep1: async (e) => {
        e.preventDefault();
        methods.clearErrors();
        const formData = methods.getStep1Data();
        if (methods.validateStep1(formData)) {
          methods.showStep2();
        }
      },

      handleStep2: async (e) => {
        e.preventDefault();
        methods.clearErrors();
        const formData = methods.getStep2Data();
        if (methods.validateStep2(formData)) {
          const allData = methods.getAllFormData();
          await methods.registerUser(allData);
        }
      },

      handlePrev: () => {
        methods.clearErrors();
        methods.showStep1();
      },

      handleLogin: async (e) => {
        e.preventDefault();
        methods.clearLoginErrors();
        const loginData = methods.getLoginData();
        if (methods.validateLogin(loginData)) {
          await methods.loginUser(loginData);
        }
      }
    }

    const methods = {
      showError: (element, message) => {
        element.textContent = message;
        element.classList.remove('hidden');
      },

      clearErrors: () => {
        [
          htmlElements.fullNameError,
          htmlElements.usernameError,
          htmlElements.emailError,
          htmlElements.passwordError,
          htmlElements.phoneError,
          htmlElements.addressError
        ].forEach(element => {
          if (element) {
            element.textContent = '';
            element.classList.add('hidden');
          }
        });
      },

      clearLoginErrors: () => {
        [
          htmlElements.identifierError,
          htmlElements.loginPasswordError
        ].forEach(element => {
          if (element) {
            element.textContent = '';
            element.classList.add('hidden');
          }
        });
      },

      getLoginData: () => {
        return {
          identifier: htmlElements.loginIdentifierInput.value,
          password: htmlElements.loginPasswordInput.value
        }
      },

      getStep1Data: () => {
        return {
          fullName: htmlElements.fullNameInput.value,
          username: htmlElements.usernameInput.value,
          email: htmlElements.emailInput.value
        }
      },

      getStep2Data: () => {
        return {
          password: htmlElements.passwordInput.value,
          phone: htmlElements.phoneInput.value,
          address: htmlElements.addressInput.value
        }
      },

      getAllFormData: () => {
        return {
          ...methods.getStep1Data(),
          ...methods.getStep2Data(),
          subscription: "ODYM User"
        }
      },

      validateStep1: (data) => {
        let isValid = true;

        if (!data.fullName) {
          methods.showError(htmlElements.fullNameError, 'Por favor ingrese su nombre completo');
          isValid = false;
        }

        if (!data.username) {
          methods.showError(htmlElements.usernameError, 'Por favor ingrese un nombre de usuario');
          isValid = false;
        }

        if (!data.email) {
          methods.showError(htmlElements.emailError, 'Por favor ingrese su correo electrónico');
          isValid = false;
        } else if (!methods.validateEmail(data.email)) {
          methods.showError(htmlElements.emailError, 'Por favor ingrese un correo electrónico válido');
          isValid = false;
        }

        return isValid;
      },

      validateStep2: (data) => {
        let isValid = true;

        if (!data.password) {
          methods.showError(htmlElements.passwordError, 'Por favor ingrese una contraseña');
          isValid = false;
        } else if (data.password.length < 6) {
          methods.showError(htmlElements.passwordError, 'La contraseña debe tener al menos 6 caracteres');
          isValid = false;
        }

        if (!data.phone) {
          methods.showError(htmlElements.phoneError, 'Por favor ingrese su número de teléfono');
          isValid = false;
        }

        if (!data.address) {
          methods.showError(htmlElements.addressError, 'Por favor ingrese su dirección');
          isValid = false;
        }

        return isValid;
      },

      validateLogin: (data) => {
        let isValid = true;

        if (!data.identifier) {
          methods.showError(htmlElements.identifierError, 'Por favor ingrese su email o nombre de usuario');
          isValid = false;
        }

        if (!data.password) {
          methods.showError(htmlElements.loginPasswordError, 'Por favor ingrese su contraseña');
          isValid = false;
        }

        return isValid;
      },

      validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
      },



      showStep1: () => {
        htmlElements.step2Form.classList.add('hidden');
        htmlElements.step1Form.classList.remove('hidden');
      },

      showStep2: () => {
        htmlElements.step1Form.classList.add('hidden');
        htmlElements.step2Form.classList.remove('hidden');
      },



      registerUser: async (formData) => {
        try {
          console.log('📝 Registrando usuario...');

          // Enviar la contraseña en texto plano, sin hashear
          const dataToSend = {
            ...formData,
            password: formData.password
          };

          const response = await fetch('http://localhost:3000/api/users/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
          });

          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            throw new Error('Error de conexión con el servidor');
          }

          if (!response.ok) {
            console.error('❌ Error del servidor:', errorData);
            throw new Error(errorData.error || errorData.message || 'Error en el registro');
          }

          console.log('✅ Usuario registrado exitosamente');
          // Guardar datos del usuario y redirigir según el tipo
          const user = errorData.customer || errorData.user;
          methods.redirectUserByRole(user);

        } catch (error) {
          console.error('❌ Error al registrar usuario:', error);

          const errorMessage = error.message.toLowerCase();

          // Manejo específico de errores de duplicados
          if (errorMessage.includes('duplicate') ||
            errorMessage.includes('ya existe') ||
            errorMessage.includes('already exists') ||
            errorMessage.includes('username') ||
            errorMessage.includes('email')) {

            // Determinar si es error de username o email
            if (errorMessage.includes('username') || errorMessage.includes('usuario')) {
              methods.showError(htmlElements.usernameError, 'Este nombre de usuario ya está en uso. Por favor, elige otro.');
            } else if (errorMessage.includes('email') || errorMessage.includes('correo')) {
              methods.showError(htmlElements.emailError, 'Este correo electrónico ya está registrado. Por favor, usa otro.');
            } else {
              // Error genérico de duplicado
              methods.showError(htmlElements.usernameError, 'El usuario o correo ya existe. Por favor, intenta con otros datos.');
              methods.showError(htmlElements.emailError, 'Verifica que el correo no esté ya registrado.');
            }

            // Volver al paso 1 para que puedan corregir
            methods.showStep1();

          } else if (errorMessage.includes('connection') || errorMessage.includes('fetch')) {
            // Error de conexión
            methods.showError(htmlElements.passwordError, 'Error de conexión. Verifica que el servidor esté funcionando.');

          } else {
            // Otros errores
            methods.showError(htmlElements.passwordError, error.message || 'Hubo un error al registrar el usuario. Por favor, intenta nuevamente.');
          }
        }
      },


      loginUser: async (loginData) => {
        try {
          console.log('🔐 Procesando login...');

          // Regular login flow
          const dataToSend = {
            ...loginData,
            password: loginData.password
          };

          const response = await fetch('http://localhost:3000/api/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
          });

          let data;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            const text = await response.text();
            throw new Error('Respuesta inesperada del servidor: ' + text);
          }

          if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión');
          }

          // Get user data and determine type based on role
          const user = data.customer || data.user;
          const userType = methods.getUserType(user);

          console.log('✅ Usuario autenticado exitosamente');
          console.log('👤 Tipo de usuario:', userType);
          console.log('🎯 Rol en BD:', user.role);

          // Redirect based on user type (determined by role in database)
          methods.redirectUserByRole(user);
        } catch (error) {
          console.error('❌ Error al iniciar sesión:', error);
          alert(error.message || 'Hubo un error al iniciar sesión. Por favor, intente nuevamente.');
        }
      },


      // Función para detectar el tipo de usuario basado únicamente en el rol
      getUserType: (user) => {
        if (!user || !user.role) return 'user';

        // Validación simple y limpia basada únicamente en el rol de la base de datos
        switch (user.role.toLowerCase()) {
          case 'admin':
          case 'administrator':
            return 'admin';

          case 'delivery':
          case 'repartidor':
            return 'delivery';

          default:
            return 'user';
        }
      },

      // Función para detectar si un usuario es admin (mantener compatibilidad)
      isAdminUser: (user) => {
        return methods.getUserType(user) === 'admin';
      },

      // Función para redirigir según el tipo de usuario
      redirectUserByRole: (user) => {
        const userType = methods.getUserType(user);

        console.log(`🔄 Redirigiendo usuario tipo: ${userType}`);

        switch (userType) {
          case 'admin':
            console.log('👑 Redirigiendo a dashboard de admin');
            user.isAdmin = true;
            user.type = 'admin';
            user.sessionType = 'admin';
            localStorage.setItem('user', JSON.stringify(user));
            window.location.replace('http://localhost:5500/odym-frontend/admin/index.html?redirected=true');
            break;

          case 'delivery':
            console.log('🚚 Redirigiendo a dashboard de delivery');
            user.type = 'delivery';
            user.sessionType = 'delivery';
            localStorage.setItem('user', JSON.stringify(user));
            window.location.replace('http://localhost:5500/odym-frontend/delivery/index.html?redirected=true');
            break;

          default:
            console.log('👤 Redirigiendo a dashboard de usuario');
            user.type = 'user';
            user.sessionType = 'user';
            AuthService.setUser(user);
            window.location.href = 'http://localhost:5500/odym-frontend/';
            break;
        }
      },

      /**
       * Enhanced logout with comprehensive cleanup
       */
      logout: () => {
        // Use comprehensive cleanup
        if (window.AuthCleanup) {
          AuthCleanup.cleanupAll();
        } else {
          // Fallback cleanup
          localStorage.removeItem('user');
          localStorage.removeItem('admin');
          localStorage.removeItem('cart');
          sessionStorage.clear();
        }

        // Emitir evento de cambio de autenticación
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = 'http://localhost:5500/odym-frontend/auth/login.html';
      }
    }

    return {
      init: () => {
        // Verificar si ya hay un usuario autenticado al cargar login.html
        if (window.location.pathname.includes('login.html')) {
          const user = AuthService.getUser();
          if (user) {
            // Si ya está autenticado, redirigir según el rol
            AuthService.redirectAfterLogin(user);
            return; // Salir para evitar inicializar el formulario
          }
        }

        // Initialize registration form if present
        if (htmlElements.step1Form && htmlElements.step2Form) {
          htmlElements.step1Form.addEventListener('submit', handlers.handleStep1);
          htmlElements.step2Form.addEventListener('submit', handlers.handleStep2);
          htmlElements.prevBtn.addEventListener('click', handlers.handlePrev);


        }

        // Initialize login form if present
        if (htmlElements.loginForm) {
          htmlElements.loginForm.addEventListener('submit', handlers.handleLogin);
        }
      }
    }

  })();

  Auth.init();
})();
