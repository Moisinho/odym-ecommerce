(() => {
  const Header = (() => {
    let htmlElements = null;

    const initializeElements = () => {
      htmlElements = {
        // Elementos de usuario
        userActions: document.querySelector('#userActions'),
        guestActions: document.querySelector('#guestActions'),
        userAvatar: document.querySelector('#userAvatar'),
        userName: document.querySelector('#userName'),
        userFullName: document.querySelector('#userFullName'),
        userEmail: document.querySelector('#userEmail'),
        userSubscription: document.querySelector('#userSubscription'),
        // Elementos del menú de usuario
        userMenuBtn: document.querySelector('#userMenuBtn'),
        userDropdown: document.querySelector('#userDropdown'),
        // Elementos del carrito
        cartBtn: document.querySelector('#cartBtn'),
        cartDropdown: document.querySelector('#cartDropdown'),
        cartCount: document.querySelector('#cartCount'),
        cartItems: document.querySelector('#cartItems'),
        cartTotal: document.querySelector('#cartTotal'),
        // Elementos del menú móvil
        mobileMenuBtn: document.querySelector('#mobileMenuBtn'),
        mobileMenu: document.querySelector('#mobileMenu'),
        mobileCategoriesMenu: document.querySelector('#mobileCategoriesMenu')
      };

      return Object.values(htmlElements).every(element => element !== null);
    };

    const handlers = {
      toggleMobileMenu: () => {
        if (!htmlElements) return;
        htmlElements.mobileMenu.classList.toggle('hidden');
      },

      toggleMobileCategories: () => {
        if (!htmlElements) return;
        htmlElements.mobileCategoriesMenu.classList.toggle('hidden');
      },

      toggleUserMenu: (event) => {
        if (!htmlElements) return;
        event.stopPropagation();
        htmlElements.userDropdown.classList.toggle('hidden');
        // Ocultar el carrito si está abierto
        htmlElements.cartDropdown.classList.add('hidden');
      },

      toggleCart: (event) => {
        if (!htmlElements) return;
        event.stopPropagation();
        htmlElements.cartDropdown.classList.toggle('hidden');
        // Ocultar el menú de usuario si está abierto
        htmlElements.userDropdown.classList.add('hidden');
      },

      handleClickOutside: (event) => {
        if (!htmlElements) return;
        
        // Cerrar menú de usuario si se hace clic fuera
        if (!event.target.closest('#userMenuBtn') && !event.target.closest('#userDropdown')) {
          htmlElements.userDropdown.classList.add('hidden');
        }
        
        // Cerrar carrito si se hace clic fuera
        if (!event.target.closest('#cartBtn') && !event.target.closest('#cartDropdown')) {
          htmlElements.cartDropdown.classList.add('hidden');
        }
      }
    };

    const methods = {
      updateUserInterface: () => {
        if (!htmlElements) return;
        
        const user = AuthService.getUser();

        if (user) {
          // Mostrar elementos de usuario autenticado
          htmlElements.userActions.classList.remove('hidden');
          htmlElements.userActions.classList.add('flex');
          htmlElements.guestActions.classList.add('hidden');
          
          // Actualizar información del usuario
          htmlElements.userAvatar.textContent = user.fullName.charAt(0).toUpperCase();
          htmlElements.userName.textContent = user.fullName.split(' ')[0];
          htmlElements.userFullName.textContent = user.fullName;
          htmlElements.userEmail.textContent = user.email;
          htmlElements.userSubscription.textContent = user.subscription;

          // Mostrar carrito
          htmlElements.cartCount.classList.remove('hidden');
        } else {
          // Mostrar elementos de invitado
          htmlElements.userActions.classList.add('hidden');
          htmlElements.userActions.classList.remove('flex');
          htmlElements.guestActions.classList.remove('hidden');
          
          // Ocultar carrito
          htmlElements.cartCount.classList.add('hidden');
        }
      },

      setupEventListeners: () => {
        if (!htmlElements) return;
        
        // Eventos del menú móvil
        htmlElements.mobileMenuBtn.addEventListener('click', handlers.toggleMobileMenu);
        
        // Eventos del menú de usuario
        htmlElements.userMenuBtn.addEventListener('click', handlers.toggleUserMenu);
        
        // Eventos del carrito
        htmlElements.cartBtn.addEventListener('click', handlers.toggleCart);
        
        // Evento para cerrar menús al hacer clic fuera
        document.addEventListener('click', handlers.handleClickOutside);
        
        // Hacer el método toggleMobileCategories accesible globalmente
        window.toggleMobileCategories = handlers.toggleMobileCategories;

        // Actualizar la interfaz cuando cambie el estado de autenticación
        window.addEventListener('auth-change', methods.updateUserInterface);
      },

      initialize: () => {
        // Intentar inicializar los elementos
        if (!initializeElements()) {
          // Si no se encuentran los elementos, intentar nuevamente en 100ms
          setTimeout(methods.initialize, 100);
          return;
        }

        methods.updateUserInterface();
        methods.setupEventListeners();
      }
    };

    return {
      init: () => {
        methods.initialize();
      }
    };
  })();

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      Header.init();
    });
  } else {
    Header.init();
  }
})(); 