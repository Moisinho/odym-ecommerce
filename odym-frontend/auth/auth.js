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
      // Error messages
      fullNameError: document.querySelector("#nombre-error"),
      usernameError: document.querySelector("#usuario-error"),
      emailError: document.querySelector("#correo-error"),
      passwordError: document.querySelector("#contrasena-error"),
      phoneError: document.querySelector("#telefono-error"),
      addressError: document.querySelector("#direccion-error"),
      // Login elements
      loginForm: document.querySelector("#login-form"),
      loginEmailInput: document.querySelector("#login-email"),
      loginPasswordInput: document.querySelector("#login-password"),
      loginButton: document.querySelector("#login-button")
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

      getLoginData: () => {
        return {
          email: htmlElements.loginEmailInput.value,
          password: htmlElements.loginPasswordInput.value
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
        if (!data.email || !data.password) {
          alert('Por favor complete todos los campos');
          return false;
        }
        if (!methods.validateEmail(data.email)) {
          alert('Por favor ingrese un correo electrónico válido');
          return false;
        }
        return true;
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

      hashPassword: async (password) => {
        try {
          const bcrypt = dcodeIO.bcrypt;
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          return hashedPassword;
        } catch (error) {
          console.error('Error al hashear la contraseña:', error);
          throw error;
        }
      },

      registerUser: async (formData) => {
        try {
          // Verificar si el username ya existe
          const checkUsername = await fetch(`http://localhost:3000/api/customers/check-username/${formData.username}`);
          const usernameData = await checkUsername.json();
          
          if (usernameData.exists) {
            methods.showError(htmlElements.usernameError, 'El nombre de usuario ya está en uso. Por favor, elija otro.');
            methods.showStep1();
            return;
          }

          // Verificar si el email ya existe
          const checkEmail = await fetch(`http://localhost:3000/api/customers/check-email/${formData.email}`);
          const emailData = await checkEmail.json();
          
          if (emailData.exists) {
            methods.showError(htmlElements.emailError, 'El correo electrónico ya está registrado. Por favor, use otro o inicie sesión.');
            methods.showStep1();
            return;
          }

          // Si las validaciones pasan, proceder con el registro
          const hashedPassword = await methods.hashPassword(formData.password);
          const dataToSend = {
            ...formData,
            password: hashedPassword
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
          window.location.href = 'http://localhost:5500/odym-frontend/';
        } catch (error) {
          console.error('Error al registrar usuario:', error);
          if (error.message.includes('duplicate')) {
            methods.showError(htmlElements.usernameError, 'El usuario o correo ya existe. Por favor, intente con otros datos.');
            methods.showStep1();
          } else {
            methods.showError(htmlElements.passwordError, 'Hubo un error al registrar el usuario. Por favor, intente nuevamente.');
          }
        }
      },

      loginUser: async (loginData) => {
        try {
          const response = await fetch('http://localhost:3000/api/customers/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al iniciar sesión');
          }

          const data = await response.json();
          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(data.customer));
          // Redirect to home page
          window.location.href = 'http://localhost:5500/odym-frontend/';
        } catch (error) {
          console.error('Error al iniciar sesión:', error);
          alert(error.message || 'Hubo un error al iniciar sesión. Por favor, intente nuevamente.');
        }
      }
    }

    return {
      init: () => {
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