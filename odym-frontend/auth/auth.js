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

      // Nueva función para hashear contraseñas
      hashPassword: async (password) => {
        try {
          // Convertir la contraseña a un array de bytes
          const msgBuffer = new TextEncoder().encode(password + "ODYM_SALT_2024");
          
          // Hashear usando SHA-256
          const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
          
          // Convertir el hash a string hexadecimal
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          
          return hashHex;
        } catch (error) {
          console.error('Error al hashear la contraseña:', error);
          throw error;
        }
      },

registerUser: async (formData) => {
  try {
    // Enviar la contraseña en texto plano, sin hashear
    const dataToSend = {
      ...formData,
      password: formData.password
    };

    const response = await fetch('http://localhost:3000/api/customers/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en el registro');
    }

    const data = await response.json();
    // Guardar datos del usuario y redirigir
    AuthService.setUser(data.customer);
    window.location.href = 'http://localhost:5500/odym-frontend/';
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    if (error.message.includes('duplicate') || error.message.includes('ya existe')) {
      methods.showError(htmlElements.usernameError, 'El usuario o correo ya existe. Por favor, intente con otros datos.');
      methods.showStep1();
    } else {
      methods.showError(htmlElements.passwordError, 'Hubo un error al registrar el usuario. Por favor, intente nuevamente.');
    }
  }
},


loginUser: async (loginData) => {
  try {
    console.log('🔐 Procesando login...');
    
    // Check if this might be an admin login
    const adminEmails = ['admin@odym.com', 'admin@admin.com', 'administrador@odym.com'];
    const adminUsernames = ['admin', 'administrator', 'administrador'];
    
    const isLikelyAdmin = adminEmails.includes(loginData.identifier?.toLowerCase()) || 
                         adminUsernames.includes(loginData.identifier?.toLowerCase());

    if (isLikelyAdmin && window.AdminLoginFix) {
      // Use critical admin login fix
      await AdminLoginFix.performAdminLogin(loginData.identifier, loginData.password);
      return;
    }

    console.log('👤 Procesando login de usuario regular...');

    // Regular login flow
    const dataToSend = {
      ...loginData,
      password: loginData.password
    };

    const response = await fetch('http://localhost:3000/api/customers/login', {
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

    // Check admin status as fallback
    const isAdmin = methods.isAdminUser(data.customer);
    
    if (isAdmin) {
      // Use AdminLoginFix if available, otherwise fallback
      if (window.AdminLoginFix) {
        await AdminLoginFix.performAdminLogin(loginData.identifier, loginData.password);
        return;
      } else {
        // Fallback admin redirect
        data.customer.isAdmin = true;
        data.customer.type = 'admin';
        data.customer.sessionType = 'admin';
        localStorage.setItem('user', JSON.stringify(data.customer));
        window.location.replace('http://localhost:5500/odym-frontend/admin/index.html?redirected=true');
      }
    } else {
      console.log('👤 Usuario regular autenticado');
      // Regular user
      AuthService.setUser(data.customer);
      AuthService.redirectAfterLogin(data.customer);
    }
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    alert(error.message || 'Hubo un error al iniciar sesión. Por favor, intente nuevamente.');
  }
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
