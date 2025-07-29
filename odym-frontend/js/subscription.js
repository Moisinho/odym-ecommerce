// subscription.js - Manejo de suscripción premium
(() => {
  const SubscriptionApp = (() => {
    // Private variables
    const API_BASE_URL = 'http://localhost:3000/api';
    let currentUser = null;
    let isLoading = false;
    let isModalInitialized = false;
    let htmlElements = {};

    // API methods
    const api = {
      getSubscriptionStatus: async (userId) => {
        try {
          const response = await fetch(`${API_BASE_URL}/subscriptions/premium/status/${userId}`);
          if (!response.ok) throw new Error('Could not fetch subscription status');
          return await response.json();
        } catch (error) {
          console.error('Error fetching subscription status:', error);
          throw error;
        }
      },
      getBoxProducts: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/subscriptions/premium/box-products`);
          if (!response.ok) throw new Error('Could not fetch box products');
          return await response.json();
        } catch (error) {
          console.error('Error fetching box products:', error);
          throw error;
        }
      },
      createCheckoutSession: async (customerEmail, userId) => {
        try {
          const response = await fetch(`${API_BASE_URL}/subscriptions/premium/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerEmail, userId })
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not create checkout session');
          }
          return await response.json();
        } catch (error) {
          console.error('Error creating checkout session:', error);
          throw error;
        }
      },
      activateSubscription: async (userId, sessionId) => {
        try {
          const response = await fetch(`${API_BASE_URL}/subscriptions/premium/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, sessionId })
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not activate subscription');
          }
          return await response.json();
        } catch (error) {
          console.error('Error activating subscription:', error);
          throw error;
        }
      }
    };

    // Render methods
    const render = {
      renderBoxProducts: (products) => {
        if (!htmlElements.boxProducts) return;
        ui.showBoxProductsLoading(false);
        if (!products || products.length === 0) {
          htmlElements.boxProducts.innerHTML = '<p class="text-gray-600 text-center col-span-full">Productos sorpresa seleccionados especialmente para ti.</p>';
          return;
        }
        htmlElements.boxProducts.innerHTML = products.slice(0, 3).map(p => `
          <div class="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <img src="${p.image || p.images?.[0] || '/assets/images/default-product.jpg'}" 
                 alt="${p.name}" 
                 class="w-full h-24 object-cover rounded-md mb-2"
                 onerror="this.src='/assets/images/default-product.jpg'">
            <p class="text-sm text-gray-800 font-semibold">${p.name}</p>
          </div>
        `).join('');
      },
      updateSubscriptionUI: (data) => {
        const { isPremium, subscription } = data;
        if (isPremium) {
          htmlElements.userStatusSection.style.display = 'block';
          htmlElements.subscriptionContent.style.display = 'none';
          htmlElements.subscriptionStatus.innerHTML = `
            <p class="mb-2"><strong>Estado:</strong> Activa</p>
            <p class="mb-2"><strong>Miembro desde:</strong> ${new Date(subscription.startDate).toLocaleDateString()}</p>
            <p><strong>Próximo pago:</strong> ${new Date(subscription.nextPaymentDate).toLocaleDateString()}</p>
          `;
        } else {
          htmlElements.userStatusSection.style.display = 'none';
          htmlElements.subscriptionContent.style.display = 'block';
        }
      }
    };

    // UI utility methods
    const ui = {
      showMainLoading: (show) => {
        if (htmlElements.loading) htmlElements.loading.style.display = show ? 'block' : 'none';
        if (show) {
            htmlElements.subscriptionContent.style.display = 'none';
            htmlElements.userStatusSection.style.display = 'none';
        }
      },
      showBoxProductsLoading: (show) => {
        if (htmlElements.boxProductsLoading) htmlElements.boxProductsLoading.style.display = show ? 'flex' : 'none';
        if(show) htmlElements.boxProducts.innerHTML = '';
      },
      showError: (message) => {
        if (htmlElements.errorText) htmlElements.errorText.textContent = message;
        if (htmlElements.errorMessage) htmlElements.errorMessage.style.display = 'block';
      },
      hideMessages: () => {
        if (htmlElements.errorMessage) htmlElements.errorMessage.style.display = 'none';
        if (htmlElements.successMessage) htmlElements.successMessage.style.display = 'none';
      }
    };

    // General methods
    const methods = {
      initHtmlElements: () => {
        htmlElements.closeBtn = document.getElementById('closePremiumModalBtn');
        htmlElements = {
          loading: document.getElementById('premiumLoading'),
          errorMessage: document.getElementById('premiumError'),
          errorText: document.getElementById('premiumErrorMessage'),
          successMessage: document.getElementById('premiumSuccess'),
          successText: document.getElementById('premiumSuccessMessage'),
          subscriptionContent: document.getElementById('premiumContent'),
          subscribeBtn: document.getElementById('premiumSubscribeBtn'),
          boxProducts: document.getElementById('premiumBoxProducts'),
          boxProductsLoading: document.getElementById('boxProductsLoading'),
          userStatusSection: document.getElementById('userStatusSection'),
          subscriptionStatus: document.getElementById('subscriptionStatus'),
        };
      },
      getUser: () => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
      },
      loadSubscriptionInfo: async () => {
        try {
          const data = await api.getSubscriptionStatus(currentUser._id);
          if (data.success) {
            render.updateSubscriptionUI(data);
          } else {
            ui.showError(data.error || 'No se pudo verificar el estado de la suscripción.');
          }
        } catch (error) {
          console.error('Error loading subscription info:', error);
          ui.showError('Error al cargar información de suscripción.');
        }
      },
      loadBoxProducts: async () => {
        ui.showBoxProductsLoading(true);
        try {
          const data = await api.getBoxProducts();
          render.renderBoxProducts(data.success ? data.products : []);
        } catch (error) {
          console.error('Error loading box products:', error);
          render.renderBoxProducts([]);
        }
      },
      initModal: async () => {
        methods.initHtmlElements();
        if (!isModalInitialized) {
          handlers.setupEventListeners();
          isModalInitialized = true;
          console.log('🚀 Modal de suscripción inicializado (una vez)');
        }
      },
      open: async () => {
        console.log('Abriendo modal...');
        ui.hideMessages();
        currentUser = methods.getUser();
        if (!currentUser) {
          ui.showError('Debes iniciar sesión para ver los detalles de la suscripción.');
          ui.showMainLoading(false);
          htmlElements.subscriptionContent.style.display = 'block';
          htmlElements.subscribeBtn.disabled = true;
          return;
        }
        htmlElements.subscribeBtn.disabled = false;

        ui.showMainLoading(true);
        await methods.loadSubscriptionInfo();
        await methods.loadBoxProducts();
        ui.showMainLoading(false);
      },
      simulateSubscription: () => {
        const user = methods.getUser();
        if (user) {
          user.subscription = 'God'; // Set user as premium
          localStorage.setItem('user', JSON.stringify(user));
          alert('¡Felicidades! Ahora eres un usuario Premium.');
          window.location.reload(); // Reload page to reflect changes
        } else {
          alert('Error: No se pudo encontrar el usuario para simular la suscripción.');
        }
      }
    };

    // Event Handlers
    const handlers = {
      handleSubscribe: async () => {
        console.log('[DEBUG] Entered handleSubscribe, currentUser:', currentUser);
        if (!currentUser) {
          // Intenta obtener usuario por si open() no se completó
          currentUser = methods.getUser();
          console.log('[DEBUG] currentUser after getUser:', currentUser);
        }
        if (isLoading || !currentUser) {
          if (!currentUser) ui.showError('Por favor, inicia sesión para suscribirte.');
          return;
        };

        try {
          isLoading = true;
          htmlElements.subscribeBtn.disabled = true;
          htmlElements.subscribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';

          console.log('[DEBUG] Fetching checkout session…');
          const data = await api.createCheckoutSession(currentUser.email, currentUser._id);
          console.log('[DEBUG] Checkout session response:', data);
          
          if (data.success && data.url) {
            // Guardamos la sesión de checkout para poder verificarla en el backend o mostrar información al volver
            localStorage.setItem(
              'checkoutSession',
              JSON.stringify({
                sessionId: data.sessionId,
                timestamp: Date.now(),
                type: 'premium_subscription'
              })
            );
            window.location.href = data.url;
          } else {
            throw new Error(data.error || 'Error al crear sesión de pago');
          }
        } catch (error) {
          console.error('Error creating subscription checkout:', error);
          ui.showError(error.message || 'Error al procesar la suscripción. Inténtalo de nuevo.');
          htmlElements.subscribeBtn.disabled = false;
          htmlElements.subscribeBtn.innerHTML = '<i class="fas fa-crown mr-2"></i>Suscribirse Ahora';
        } finally {
          isLoading = false;
        }
      },
      setupEventListeners: () => {
        // Cerrar modal al hacer clic en la X o presionar ESC
        document.addEventListener('click', (e) => {
          if (e.target.closest('#closePremiumModalBtn')) {
            window.closePremiumModal();
          }
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') window.closePremiumModal();
        });
        // Delegated listener to ensure the handler works even if the button is added after initial load
        document.addEventListener('click', (e) => {
          const target = e.target.closest('#premiumSubscribeBtn');
          if (target) {
            console.log('[DEBUG] premiumSubscribeBtn click detected', target);
            // Lazy-load htmlElements.subscribeBtn reference if it was null at first
            if (!htmlElements.subscribeBtn) htmlElements.subscribeBtn = target;
            console.log('[DEBUG] Calling handleSubscribe');
            handlers.handleSubscribe();
          }
        }, true);
      }
    };

    // Success page handler
    const successHandler = {
      handleSubscriptionSuccess: async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const type = urlParams.get('type');

        if (sessionId && type === 'subscription') {
          try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;

            const data = await api.activateSubscription(user._id, sessionId);
            if (data.success) {
              const updatedUser = { ...user, subscription: 'God' };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              console.log('Suscripción premium activada.');
            } else {
              console.error('Error activating subscription:', data.error);
            }
          } catch (error) {
            console.error('Error handling subscription success:', error);
          }
        }
      }
    };

    return {
      initModal: methods.initModal,
      open: methods.open,
      handleSubscriptionSuccess: successHandler.handleSubscriptionSuccess,
      simulateSubscription: methods.simulateSubscription
    };
  })();

  // Utility functions (global scope)
  const SubscriptionUtils = (() => {
    return {
      isPremiumUser: () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user && user.subscription === 'God';
      },

      applyPremiumDiscount: (price) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return (user && user.subscription === 'God') ? price * 0.7 : price;
      },

      showSubscriptionButton: () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user && user.subscription !== 'God') {
          return `
            <button onclick="openPremiumModal()" class="premium-cta-btn" style="
              display: inline-block;
              background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
              color: white;
              padding: 0.75rem 1.5rem;
              border-radius: 25px;
              text-decoration: none;
              font-weight: bold;
              margin: 1rem 0;
              border: none;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'" 
               onmouseout="this.style.transform='translateY(0)'">
              ⭐ Hazte Premium - 30% OFF
            </button>
          `;
        }
        return '';
      }
    };
  })();

  // Make modules globally available
  window.SubscriptionApp = SubscriptionApp;
  window.SubscriptionUtils = SubscriptionUtils;

  // Modal control functions
  const modalControl = {
    openPremiumModal: () => {
      const modal = document.getElementById('premiumModal');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        SubscriptionApp.initModal(); // Ensure modal elements are initialized and listeners set up
        SubscriptionApp.open(); // Llama a la función open para cargar el contenido
      }
    },
    closePremiumModal: () => {
      const modal = document.getElementById('premiumModal');
      if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    }
  };

  // Expose modal functions globally
  window.openPremiumModal = modalControl.openPremiumModal;
  window.closePremiumModal = modalControl.closePremiumModal;

  // Auto-initialize based on page
  document.addEventListener('DOMContentLoaded', () => {
    SubscriptionApp.initModal(); // Inicializa los elementos y listeners una vez en el DOM
    if (window.location.search.includes('session_id') && window.location.search.includes('type=subscription')) {
      SubscriptionApp.handleSubscriptionSuccess();
    }
  });



  // Export utility functions to global scope for backward compatibility
  window.isPremiumUser = SubscriptionUtils.isPremiumUser;
  window.applyPremiumDiscount = SubscriptionUtils.applyPremiumDiscount;
  window.showSubscriptionButton = SubscriptionUtils.showSubscriptionButton;
})();