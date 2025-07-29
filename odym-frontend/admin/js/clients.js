(() => {
  const ClientsApp = (() => {
    // Private variables
    let currentClient = null;
    let htmlElements = {}; // To be populated after DOM is ready
    let isInitialized = false; // Prevent multiple initializations

    // API methods for interacting with the backend
    const api = {
      getClients: async () => {
        try {
          console.log('🔄 Obteniendo clientes de tabla users...');
          const response = await fetch('http://localhost:3000/api/customers');
          
          if (!response.ok) {
            console.error('❌ Error al obtener clientes:', response.status, response.statusText);
            throw new Error('Could not fetch clients');
          }
          
          const data = await response.json();
          console.log('✅ Usuarios obtenidos de tabla users:', data);
          return data.customers || [];
        } catch (error) {
          console.error('❌ Error fetching clients:', error);
          return [];
        }
      },
      getSubscriptions: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/subscriptions');
          if (!response.ok) throw new Error('Could not fetch subscriptions');
          const data = await response.json();
          // Filtrar solo las suscripciones permitidas
          return Array.isArray(data) ? data.filter(sub => 
            sub.name === 'ODYM User' || sub.name === 'ODYM God'
          ) : [];
        } catch (error) {
          console.error('Error fetching subscriptions:', error);
          return [];
        }
      },
      createClient: async (clientData) => {
        try {
          console.log('🔄 Creando cliente en tabla users...');
          console.log('📝 Datos del cliente:', { ...clientData, password: '[HIDDEN]' });
          
          const response = await fetch('http://localhost:3000/api/users/admin-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData),
          });
          
          console.log('📡 Respuesta del servidor:', response.status, response.statusText);
          
          if (!response.ok) {
            let errorMessage = 'Could not create client';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              // Si no se puede parsear como JSON, obtener el texto
              const errorText = await response.text();
              console.error('❌ Respuesta no es JSON:', errorText);
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }
          
          const result = await response.json();
          console.log('✅ Cliente creado exitosamente en tabla users con role: user');
          return result;
        } catch (error) {
          console.error('❌ Error creating client:', error);
          throw error;
        }
      },
      updateClient: async (clientData) => {
        try {
          console.log('🔄 Actualizando cliente en tabla users...');
          console.log('📝 Datos del cliente:', { ...clientData, password: clientData.password ? '[UPDATED]' : '[UNCHANGED]' });
          
          const response = await fetch(`http://localhost:3000/api/users/admin-update/${clientData._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData),
          });
          
          console.log('📡 Respuesta del servidor:', response.status, response.statusText);
          
          if (!response.ok) {
            let errorMessage = 'Could not update client';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              const errorText = await response.text();
              console.error('❌ Respuesta no es JSON:', errorText);
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
          }
          
          const result = await response.json();
          console.log('✅ Cliente actualizado exitosamente en tabla users');
          return result;
        } catch (error) {
          console.error('❌ Error updating client:', error);
          throw error;
        }
      },
      deleteClient: async (clientId) => {
        try {
          console.log('🗑️ Eliminando cliente de tabla users...');
          
          const response = await fetch(`http://localhost:3000/api/customers/${clientId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error del servidor:', errorData);
            throw new Error(errorData.error || 'Could not delete client');
          }
          
          const result = await response.json();
          console.log('✅ Cliente eliminado exitosamente de tabla users');
          return result;
        } catch (error) {
          console.error('❌ Error deleting client:', error);
          throw error;
        }
      },
    };

    // Render methods for updating the UI
    const render = {
      renderSubscriptions: (subscriptions) => {
        const subscriptionSelect = document.getElementById('subscriptionSelect');
        if (!subscriptionSelect) return;

        subscriptionSelect.innerHTML = '<option value="">Seleccionar suscripción</option>';
        
        subscriptions.forEach(subscription => {
          const option = document.createElement('option');
          option.value = subscription.name;
          option.textContent = subscription.name;
          subscriptionSelect.appendChild(option);
        });

        // Si no hay suscripciones, agregar las por defecto
        if (subscriptions.length === 0) {
          const defaultSubs = ['ODYM User', 'ODYM God'];
          defaultSubs.forEach(subName => {
            const option = document.createElement('option');
            option.value = subName;
            option.textContent = subName;
            subscriptionSelect.appendChild(option);
          });
        }
      },
      renderClients: (clients) => {
        if (!htmlElements.clientsTableBody) return;

        if (clients.length === 0) {
          htmlElements.clientsTableBody.innerHTML = `
            <tr>
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-users text-4xl mb-4 text-gray-300"></i>
                <p>No hay clientes registrados</p>
              </td>
            </tr>
          `;
          return;
        }

        htmlElements.clientsTableBody.innerHTML = '';
        // Filter out admin and delivery users - they should appear in their respective sections
        const regularClients = clients.filter(client => 
          client.role !== 'admin' && client.role !== 'delivery'
        );
        
        console.log('👥 Clientes filtrados (solo role: user):', regularClients.length);
        console.log('📋 Clientes encontrados:', regularClients);
        
        regularClients.forEach(client => {
          const row = document.createElement('tr');
          row.dataset.clientId = client._id;
          row.className = 'hover:bg-gray-50';

          const subscriptionColor = client.subscription === 'ODYM User' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center justify-center">
                <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-user text-orange-600"></i>
                </div>
                <div class="text-left">
                  <div class="text-sm font-medium text-gray-900 client-name">${client.fullName || client.name || 'N/A'}</div>
                  <div class="text-sm text-gray-500">@${client.username || client.name || 'N/A'}</div>
                  <div class="text-xs text-orange-600 font-semibold">Role: ${client.role}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 client-email">${client.email || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 client-phone">${client.phone || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 text-xs font-semibold rounded-full ${subscriptionColor} client-subscription">
                ${client.subscription || 'N/A'}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 client-address">${client.address || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <button class="editClientBtn text-orange-600 hover:text-orange-900 mr-3" title="Editar cliente">
                <i class="fas fa-edit"></i>
              </button>
              <button class="deleteClientBtn text-red-600 hover:text-red-900" title="Eliminar cliente">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          htmlElements.clientsTableBody.appendChild(row);
        });
      }
    };

    // General methods
    const methods = {
      initHtmlElements: () => {
        htmlElements = {
          clientModal: document.getElementById('clientModal'),
          clientForm: document.getElementById('clientForm'),
          closeModalBtn: document.getElementById('closeModalBtn'),
          cancelClientBtn: document.getElementById('cancelClientBtn'),
          clientsTableBody: document.getElementById('clientsTableBody'),
          clientModalTitle: document.getElementById('clientModalTitle'),
          newClientBtn: document.getElementById('newClientBtn'),
          subscriptionSelect: document.getElementById('subscriptionSelect'),
        };
      },
      openModal: () => {
        if (htmlElements.clientModal) {
          htmlElements.clientModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      },
      closeModal: () => {
        if (htmlElements.clientModal) {
          htmlElements.clientModal.classList.add('hidden');
          document.body.style.overflow = 'auto';
        }
        if (htmlElements.clientForm) htmlElements.clientForm.reset();
        currentClient = null;
      },
      cancelModal: () => {
        methods.closeModal();
      },
      loadInitialData: async () => {
        try {
          console.log('🔄 Cargando datos iniciales...');

          if (htmlElements.clientsTableBody) {
            htmlElements.clientsTableBody.innerHTML = `
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Cargando clientes...
                </td>
              </tr>
            `;
          }

          const [clients, subscriptions] = await Promise.all([
            api.getClients(),
            api.getSubscriptions()
          ]);

          console.log('👥 Clientes cargados:', clients.length);
          console.log('📋 Suscripciones cargadas:', subscriptions.length);
          
          render.renderClients(clients);
          render.renderSubscriptions(subscriptions);

        } catch (error) {
          console.error("❌ Failed to load initial data.", error);

          if (htmlElements.clientsTableBody) {
            htmlElements.clientsTableBody.innerHTML = `
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-red-500">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Error al cargar clientes. Verifique la conexión con el servidor.
                </td>
              </tr>
            `;
          }
        }
      },
      init: async () => {
        if (isInitialized) {
          console.log('⚠️ ClientsApp ya está inicializado');
          return;
        }

        console.log('🚀 Inicializando ClientsApp...');
        isInitialized = true;

        methods.initHtmlElements();
        handlers.setupEventDelegation();
        handlers.handleEventListeners();
        await methods.loadInitialData();
        console.log('✅ ClientsApp inicializado correctamente');
      },
    };

    // Event Handlers
    const handlers = {
      handleCreateClient: async (e) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.clientForm);

          const fullName = formData.get('fullName')?.trim();
          const email = formData.get('email')?.trim();
          const username = formData.get('username')?.trim();
          const password = formData.get('password')?.trim();
          const phone = formData.get('phone')?.trim();
          const address = formData.get('address')?.trim();

          if (!fullName || !email || !username || !password || !phone || !address) {
            alert('Todos los campos obligatorios son requeridos');
            return;
          }

          const clientData = {
            fullName,
            email,
            username,
            password,
            phone,
            address,
            subscription: formData.get('subscription') || 'ODYM User',
            role: 'user', // Clients are always users
          };

          console.log('📝 Creando cliente:', clientData);

          const result = await api.createClient(clientData);
          console.log('✅ Cliente creado:', result);

          alert('Cliente creado exitosamente');
          methods.closeModal();

          const clients = await api.getClients();
          render.renderClients(clients);

        } catch (error) {
          console.error('❌ Error al crear cliente:', error);
          alert('Error al crear cliente: ' + error.message);
        }
      },

      handleUpdateClient: async (e, clientId) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.clientForm);

          const fullName = formData.get('fullName')?.trim();
          const email = formData.get('email')?.trim();
          const username = formData.get('username')?.trim();
          const phone = formData.get('phone')?.trim();
          const address = formData.get('address')?.trim();

          if (!fullName || !email || !username || !phone || !address) {
            alert('Todos los campos obligatorios son requeridos');
            return;
          }

          const updatedData = {
            _id: clientId,
            fullName,
            email,
            username,
            phone,
            address,
            subscription: formData.get('subscription') || 'ODYM User',
            role: 'user', // Clients are always users
          };

          const password = formData.get('password')?.trim();
          if (password) {
            updatedData.password = password;
          }

          console.log('✏️ Actualizando cliente:', updatedData);

          const result = await api.updateClient(updatedData);
          console.log('✅ Cliente actualizado:', result);

          alert('Cliente actualizado exitosamente');
          methods.closeModal();

          const clients = await api.getClients();
          render.renderClients(clients);

        } catch (error) {
          console.error('❌ Error al actualizar cliente:', error);
          alert('Error al actualizar cliente: ' + error.message);
        }
      },

      handleShowNewClientModal: async () => {
        currentClient = null;
        if (htmlElements.clientModalTitle) htmlElements.clientModalTitle.textContent = 'Nuevo Cliente';
        if (htmlElements.clientForm) htmlElements.clientForm.reset();
        
        // Cargar suscripciones si no están cargadas
        if (htmlElements.subscriptionSelect && htmlElements.subscriptionSelect.children.length <= 1) {
          const subscriptions = await api.getSubscriptions();
          render.renderSubscriptions(subscriptions);
        }
        
        methods.openModal();
      },

      handleShowEditClientModal: async (client) => {
        currentClient = client;
        if (htmlElements.clientModalTitle) htmlElements.clientModalTitle.textContent = 'Editar Cliente';
        
        // Cargar suscripciones si no están cargadas
        if (htmlElements.subscriptionSelect && htmlElements.subscriptionSelect.children.length <= 1) {
          const subscriptions = await api.getSubscriptions();
          render.renderSubscriptions(subscriptions);
        }
        
        if (htmlElements.clientForm) {
          htmlElements.clientForm.fullName.value = client.fullName || '';
          htmlElements.clientForm.email.value = client.email || '';
          htmlElements.clientForm.username.value = client.username || '';
          htmlElements.clientForm.phone.value = client.phone || '';
          htmlElements.clientForm.address.value = client.address || '';
          htmlElements.clientForm.subscription.value = client.subscription || 'ODYM User';
          htmlElements.clientForm.password.value = '';
        }
        methods.openModal();
      },

      handleDeleteClient: async (clientId) => {
        const confirmed = confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.');

        if (!confirmed) return;

        try {
          console.log('🗑️ Eliminando cliente:', clientId);
          await api.deleteClient(clientId);
          alert('Cliente eliminado exitosamente');

          const clients = await api.getClients();
          render.renderClients(clients);

        } catch (error) {
          console.error('Error al eliminar cliente:', error);
          alert('Error al eliminar cliente: ' + error.message);
        }
      },

      handleEventListeners: () => {
        if (htmlElements.newClientBtn) {
          htmlElements.newClientBtn.removeEventListener('click', handlers.handleShowNewClientModal);
          htmlElements.newClientBtn.addEventListener('click', async () => {
            await handlers.handleShowNewClientModal();
          });
        }

        if (htmlElements.clientForm) {
          htmlElements.clientForm.removeEventListener('submit', handlers.handleFormSubmit);
          htmlElements.clientForm.addEventListener('submit', handlers.handleFormSubmit);
        }

        if (htmlElements.closeModalBtn) {
          htmlElements.closeModalBtn.removeEventListener('click', methods.closeModal);
          htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        }
        if (htmlElements.cancelClientBtn) {
          htmlElements.cancelClientBtn.removeEventListener('click', methods.closeModal);
          htmlElements.cancelClientBtn.addEventListener('click', methods.cancelModal);
        }

        if (htmlElements.clientModal) {
          htmlElements.clientModal.removeEventListener('click', handlers.handleModalClick);
          htmlElements.clientModal.addEventListener('click', handlers.handleModalClick);
        }
      },

      handleFormSubmit: async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
          if (currentClient) {
            await handlers.handleUpdateClient(e, currentClient._id);
          } else {
            await handlers.handleCreateClient(e);
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar';
        }
      },

      handleModalClick: (e) => {
        if (e.target === htmlElements.clientModal) {
          methods.closeModal();
        }
      },

      setupEventDelegation: () => {
        if (handlers.delegationHandler) {
          document.removeEventListener('click', handlers.delegationHandler);
        }

        handlers.delegationHandler = async (e) => {
          if (e.target.closest('.editClientBtn')) {
            const row = e.target.closest('tr');
            const clientId = row.dataset.clientId;
            const client = {
              _id: clientId,
              fullName: row.querySelector('.client-name').textContent,
              email: row.querySelector('.client-email').textContent,
              phone: row.querySelector('.client-phone').textContent,
              subscription: row.querySelector('.client-subscription').textContent,
              username: row.querySelector('.client-name').nextElementSibling.textContent.replace('@', ''),
              address: row.querySelector('.client-address').textContent,
              role: 'user' // Clients are always users
            };
            await handlers.handleShowEditClientModal(client);
          }

          if (e.target.closest('.deleteClientBtn')) {
            const row = e.target.closest('tr');
            const clientId = row.dataset.clientId;
            handlers.handleDeleteClient(clientId);
          }
        };

        document.addEventListener('click', handlers.delegationHandler);
      },
    };

    return {
      init: methods.init,
    };
  })();

  // Make ClientsApp globally available
  window.ClientsApp = ClientsApp;
})();