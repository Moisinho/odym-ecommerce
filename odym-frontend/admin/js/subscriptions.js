(() => {
  const SubscriptionsApp = (() => {
    // Private variables
    let currentSubscription = null;
    let htmlElements = {}; // To be populated after DOM is ready
    let isInitialized = false; // Prevent multiple initializations

    // API methods for interacting with the backend
    const api = {
      getSubscriptions: async () => {
        try {
          console.log('🔄 Fetching subscriptions from API...');
          const response = await fetch('http://localhost:3000/api/subscriptions');
          console.log('📡 Response status:', response.status);

          if (!response.ok) {
            console.error('❌ Response not OK:', response.status, response.statusText);
            throw new Error(`Could not fetch subscriptions: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log('📋 Raw API response:', data);
          console.log('📊 Data type:', typeof data, 'Is array:', Array.isArray(data));

          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('❌ Error fetching subscriptions:', error);
          return [];
        }
      },
      createSubscription: async (subscriptionData) => {
        try {
          const response = await fetch('http://localhost:3000/api/subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not create subscription');
          }
          return await response.json();
        } catch (error) {
          console.error('Error creating subscription:', error);
          throw error;
        }
      },
      updateSubscription: async (subscriptionData) => {
        try {
          const response = await fetch(`http://localhost:3000/api/subscriptions/${subscriptionData._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not update subscription');
          }
          return await response.json();
        } catch (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
      },
      deleteSubscription: async (subscriptionId) => {
        try {
          const response = await fetch(`http://localhost:3000/api/subscriptions/${subscriptionId}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not delete subscription');
          }
          return await response.json();
        } catch (error) {
          console.error('Error deleting subscription:', error);
          throw error;
        }
      },
    };

    // Render methods for updating the UI
    const render = {
      renderSubscriptions: (subscriptions) => {
        if (!htmlElements.subscriptionsTableBody) return;

        if (subscriptions.length === 0) {
          htmlElements.subscriptionsTableBody.innerHTML = `
            <tr>
              <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-crown text-4xl mb-4 text-gray-300"></i>
                <p>No hay suscripciones registradas</p>
              </td>
            </tr>
          `;
          return;
        }

        htmlElements.subscriptionsTableBody.innerHTML = '';
        subscriptions.forEach(subscription => {
          const row = document.createElement('tr');
          row.dataset.subscriptionId = subscription._id;
          row.className = 'hover:bg-gray-50';

          const typeColors = {
            'God': 'bg-yellow-100 text-yellow-800',
            'User': 'bg-blue-100 text-blue-800'
          };

          const typeIcons = {
            'God': 'fas fa-crown text-yellow-600',
            'User': 'fas fa-user text-blue-600'
          };

          const priceDisplay = subscription.price === 0 ? 'Gratis' : `$${parseFloat(subscription.price).toFixed(2)}`;

          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center justify-center">
                <div class="w-8 h-8 ${subscription.subscriptionType === 'God' ? 'bg-yellow-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mr-3">
                  <i class="${typeIcons[subscription.subscriptionType] || 'fas fa-user text-gray-600'}"></i>
                </div>
                <div class="text-left">
                  <div class="text-sm font-medium text-gray-900 subscription-type">${subscription.subscriptionType}</div>
                  <span class="px-2 py-1 text-xs font-semibold rounded-full ${typeColors[subscription.subscriptionType] || 'bg-gray-100 text-gray-800'}">
                    ${subscription.subscriptionType}
                  </span>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 subscription-description">
              <div class="max-w-xs truncate" title="${subscription.description}">
                ${subscription.description}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 subscription-price">${priceDisplay}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 subscription-duration">${subscription.duration}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <button class="editSubscriptionBtn text-orange-600 hover:text-orange-900 mr-3" title="Editar suscripción">
                <i class="fas fa-edit"></i>
              </button>
              <button class="deleteSubscriptionBtn text-red-600 hover:text-red-900" title="Eliminar suscripción">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          htmlElements.subscriptionsTableBody.appendChild(row);
        });
      }
    };

    // General methods
    const methods = {
      initHtmlElements: () => {
        htmlElements = {
          subscriptionModal: document.getElementById('subscriptionModal'),
          subscriptionForm: document.getElementById('subscriptionForm'),
          closeModalBtn: document.getElementById('closeModalBtn'),
          cancelSubscriptionBtn: document.getElementById('cancelSubscriptionBtn'),
          subscriptionsTableBody: document.getElementById('subscriptionsTableBody'),
          subscriptionModalTitle: document.getElementById('subscriptionModalTitle'),
          newSubscriptionBtn: document.getElementById('newSubscriptionBtn'),
        };
      },
      openModal: () => {
        if (htmlElements.subscriptionModal) {
          htmlElements.subscriptionModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      },
      closeModal: () => {
        if (htmlElements.subscriptionModal) {
          htmlElements.subscriptionModal.classList.add('hidden');
          document.body.style.overflow = 'auto';
        }
        if (htmlElements.subscriptionForm) htmlElements.subscriptionForm.reset();
        currentSubscription = null;
      },
      cancelModal: () => {
        methods.closeModal();
      },
      loadInitialData: async () => {
        try {
          console.log('🔄 Cargando datos iniciales...');

          if (htmlElements.subscriptionsTableBody) {
            htmlElements.subscriptionsTableBody.innerHTML = `
              <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Cargando suscripciones...
                </td>
              </tr>
            `;
          }

          const subscriptions = await api.getSubscriptions();
          console.log('👑 Suscripciones cargadas:', subscriptions.length);
          console.log('📋 Suscripciones data:', subscriptions);
          render.renderSubscriptions(subscriptions);

        } catch (error) {
          console.error("❌ Failed to load initial data.", error);

          if (htmlElements.subscriptionsTableBody) {
            htmlElements.subscriptionsTableBody.innerHTML = `
              <tr>
                <td colspan="5" class="px-4 py-8 text-center text-red-500">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Error al cargar suscripciones. Verifique la conexión con el servidor.
                </td>
              </tr>
            `;
          }
        }
      },
      init: async () => {
        if (isInitialized) {
          console.log('⚠️ SubscriptionsApp ya está inicializado');
          return;
        }

        console.log('🚀 Inicializando SubscriptionsApp...');
        isInitialized = true;

        methods.initHtmlElements();
        handlers.setupEventDelegation();
        handlers.handleEventListeners();
        await methods.loadInitialData();
        console.log('✅ SubscriptionsApp inicializado correctamente');
      },
    };

    // Event Handlers
    const handlers = {
      handleCreateSubscription: async (e) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.subscriptionForm);

          const subscriptionType = formData.get('subscriptionType')?.trim();
          const description = formData.get('description')?.trim();
          const price = formData.get('price');
          const duration = formData.get('duration');

          if (!subscriptionType || !description || price === null || !duration) {
            alert('Todos los campos son requeridos');
            return;
          }

          if (parseFloat(price) < 0) {
            alert('El precio no puede ser negativo');
            return;
          }

          const subscriptionData = {
            subscriptionType,
            description,
            price: parseFloat(price),
            duration
          };

          console.log('📝 Creando suscripción:', subscriptionData);

          const result = await api.createSubscription(subscriptionData);
          console.log('✅ Suscripción creada:', result);

          alert('Suscripción creada exitosamente');
          methods.closeModal();

          const subscriptions = await api.getSubscriptions();
          render.renderSubscriptions(subscriptions);

        } catch (error) {
          console.error('❌ Error al crear suscripción:', error);
          alert('Error al crear suscripción: ' + error.message);
        }
      },

      handleUpdateSubscription: async (e, subscriptionId) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.subscriptionForm);

          const subscriptionType = formData.get('subscriptionType')?.trim();
          const description = formData.get('description')?.trim();
          const price = formData.get('price');
          const duration = formData.get('duration');

          if (!subscriptionType || !description || price === null || !duration) {
            alert('Todos los campos son requeridos');
            return;
          }

          if (parseFloat(price) < 0) {
            alert('El precio no puede ser negativo');
            return;
          }

          const updatedData = {
            _id: subscriptionId,
            subscriptionType,
            description,
            price: parseFloat(price),
            duration
          };

          console.log('✏️ Actualizando suscripción:', updatedData);

          const result = await api.updateSubscription(updatedData);
          console.log('✅ Suscripción actualizada:', result);

          alert('Suscripción actualizada exitosamente');
          methods.closeModal();

          const subscriptions = await api.getSubscriptions();
          render.renderSubscriptions(subscriptions);

        } catch (error) {
          console.error('❌ Error al actualizar suscripción:', error);
          alert('Error al actualizar suscripción: ' + error.message);
        }
      },

      handleShowNewSubscriptionModal: () => {
        currentSubscription = null;
        if (htmlElements.subscriptionModalTitle) htmlElements.subscriptionModalTitle.textContent = 'Nueva Suscripción';
        if (htmlElements.subscriptionForm) htmlElements.subscriptionForm.reset();
        methods.openModal();
      },

      handleShowEditSubscriptionModal: (subscription) => {
        currentSubscription = subscription;
        if (htmlElements.subscriptionModalTitle) htmlElements.subscriptionModalTitle.textContent = 'Editar Suscripción';
        if (htmlElements.subscriptionForm) {
          htmlElements.subscriptionForm.subscriptionType.value = subscription.subscriptionType;
          htmlElements.subscriptionForm.description.value = subscription.description;
          htmlElements.subscriptionForm.price.value = subscription.price;
          htmlElements.subscriptionForm.duration.value = subscription.duration;
        }
        methods.openModal();
      },

      handleDeleteSubscription: async (subscriptionId) => {
        const confirmed = confirm('¿Estás seguro de que deseas eliminar esta suscripción? Esta acción no se puede deshacer.');

        if (!confirmed) return;

        try {
          console.log('🗑️ Eliminando suscripción:', subscriptionId);
          await api.deleteSubscription(subscriptionId);
          alert('Suscripción eliminada exitosamente');

          const subscriptions = await api.getSubscriptions();
          render.renderSubscriptions(subscriptions);

        } catch (error) {
          console.error('Error al eliminar suscripción:', error);
          alert('Error al eliminar suscripción: ' + error.message);
        }
      },

      handleEventListeners: () => {
        if (htmlElements.newSubscriptionBtn) {
          htmlElements.newSubscriptionBtn.removeEventListener('click', handlers.handleShowNewSubscriptionModal);
          htmlElements.newSubscriptionBtn.addEventListener('click', handlers.handleShowNewSubscriptionModal);
        }

        if (htmlElements.subscriptionForm) {
          htmlElements.subscriptionForm.removeEventListener('submit', handlers.handleFormSubmit);
          htmlElements.subscriptionForm.addEventListener('submit', handlers.handleFormSubmit);

          // Add event listener for subscription type change
          const tipoSelect = htmlElements.subscriptionForm.querySelector('select[name="subscriptionType"]');
          if (tipoSelect) {
            tipoSelect.addEventListener('change', handlers.handleSubscriptionTypeChange);
          }
        }

        if (htmlElements.closeModalBtn) {
          htmlElements.closeModalBtn.removeEventListener('click', methods.closeModal);
          htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        }
        if (htmlElements.cancelSubscriptionBtn) {
          htmlElements.cancelSubscriptionBtn.removeEventListener('click', methods.closeModal);
          htmlElements.cancelSubscriptionBtn.addEventListener('click', methods.cancelModal);
        }

        if (htmlElements.subscriptionModal) {
          htmlElements.subscriptionModal.removeEventListener('click', handlers.handleModalClick);
          htmlElements.subscriptionModal.addEventListener('click', handlers.handleModalClick);
        }
      },

      handleSubscriptionTypeChange: (e) => {
        const selectedType = e.target.value;
        const form = htmlElements.subscriptionForm;

        if (selectedType === 'God') {
          form.price.value = 30;
          form.duration.value = '1 month';
          form.description.value = 'Suscripción premium con 30% de descuento en todos los productos y caja de productos incluida en cada compra y renovación';
        } else if (selectedType === 'User') {
          form.price.value = 0;
          form.duration.value = 'infinite';
          form.description.value = 'Suscripción gratuita para usuarios regulares con acceso básico a la plataforma';
        }
      },

      handleFormSubmit: async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
          if (currentSubscription) {
            await handlers.handleUpdateSubscription(e, currentSubscription._id);
          } else {
            await handlers.handleCreateSubscription(e);
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar';
        }
      },

      handleModalClick: (e) => {
        if (e.target === htmlElements.subscriptionModal) {
          methods.closeModal();
        }
      },

      setupEventDelegation: () => {
        if (handlers.delegationHandler) {
          document.removeEventListener('click', handlers.delegationHandler);
        }

        handlers.delegationHandler = (e) => {
          if (e.target.closest('.editSubscriptionBtn')) {
            const row = e.target.closest('tr');
            const subscriptionId = row.dataset.subscriptionId;
            const subscription = {
              _id: subscriptionId,
              subscriptionType: row.querySelector('.subscription-type').textContent,
              description: row.querySelector('.subscription-description div').textContent,
              price: row.querySelector('.subscription-price').textContent === 'Gratis' ? 0 : parseFloat(row.querySelector('.subscription-price').textContent.replace('$', '')),
              duration: row.querySelector('.subscription-duration').textContent
            };
            handlers.handleShowEditSubscriptionModal(subscription);
          }

          if (e.target.closest('.deleteSubscriptionBtn')) {
            const row = e.target.closest('tr');
            const subscriptionId = row.dataset.subscriptionId;
            handlers.handleDeleteSubscription(subscriptionId);
          }
        };

        document.addEventListener('click', handlers.delegationHandler);
      },
    };

    return {
      init: methods.init,
    };
  })();

  // Utility function for date formatting
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Make SubscriptionsApp globally available
  window.SubscriptionsApp = SubscriptionsApp;
})();