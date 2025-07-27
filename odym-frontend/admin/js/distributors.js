(() => {
  const DistributorsApp = (() => {
    // Private variables
    let currentDistributor = null;
    let htmlElements = {}; // To be populated after DOM is ready
    let isInitialized = false; // Prevent multiple initializations

    // API methods for interacting with the backend
    const api = {
      getDistributors: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/distributors');
          if (!response.ok) throw new Error('Could not fetch distributors');
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('Error fetching distributors:', error);
          return [];
        }
      },
      createDistributor: async (distributorData) => {
        try {
          const response = await fetch('http://localhost:3000/api/distributors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(distributorData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not create distributor');
          }
          return await response.json();
        } catch (error) {
          console.error('Error creating distributor:', error);
          throw error;
        }
      },
      updateDistributor: async (distributorData) => {
        try {
          const response = await fetch(`http://localhost:3000/api/distributors/${distributorData._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(distributorData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not update distributor');
          }
          return await response.json();
        } catch (error) {
          console.error('Error updating distributor:', error);
          throw error;
        }
      },
      deleteDistributor: async (distributorId) => {
        try {
          const response = await fetch(`http://localhost:3000/api/distributors/${distributorId}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not delete distributor');
          }
          return await response.json();
        } catch (error) {
          console.error('Error deleting distributor:', error);
          throw error;
        }
      },
    };

    // Render methods for updating the UI
    const render = {
      renderDistributors: (distributors) => {
        if (!htmlElements.distributorsTableBody) return;

        if (distributors.length === 0) {
          htmlElements.distributorsTableBody.innerHTML = `
            <tr>
              <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-motorcycle text-4xl mb-4 text-gray-300"></i>
                <p>No hay repartidores registrados</p>
              </td>
            </tr>
          `;
          return;
        }

        htmlElements.distributorsTableBody.innerHTML = '';
        distributors.forEach(distributor => {
          const row = document.createElement('tr');
          row.dataset.distributorId = distributor._id;
          row.className = 'hover:bg-gray-50';

          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center justify-center">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-motorcycle text-blue-600"></i>
                </div>
                <div class="text-left">
                  <div class="text-sm font-medium text-gray-900 distributor-name">${distributor.fullName}</div>
                  <div class="text-sm text-gray-500">@${distributor.username}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 distributor-email">${distributor.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 distributor-phone">${distributor.phone}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <button class="editDistributorBtn text-orange-600 hover:text-orange-900 mr-3" title="Editar repartidor">
                <i class="fas fa-edit"></i>
              </button>
              <button class="deleteDistributorBtn text-red-600 hover:text-red-900" title="Eliminar repartidor">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          htmlElements.distributorsTableBody.appendChild(row);
        });
      }
    };

    // General methods
    const methods = {
      initHtmlElements: () => {
        htmlElements = {
          distributorModal: document.getElementById('distributorModal'),
          distributorForm: document.getElementById('distributorForm'),
          closeModalBtn: document.getElementById('closeModalBtn'),
          cancelDistributorBtn: document.getElementById('cancelDistributorBtn'),
          distributorsTableBody: document.getElementById('distributorsTableBody'),
          distributorModalTitle: document.getElementById('distributorModalTitle'),
          newDistributorBtn: document.getElementById('newDistributorBtn'),
        };
      },
      openModal: () => {
        if (htmlElements.distributorModal) {
          htmlElements.distributorModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      },
      closeModal: () => {
        if (htmlElements.distributorModal) {
          htmlElements.distributorModal.classList.add('hidden');
          document.body.style.overflow = 'auto';
        }
        if (htmlElements.distributorForm) {
          htmlElements.distributorForm.reset();
          
          // Reset password field to default state
          const passwordField = document.getElementById('passwordField');
          const passwordRequired = document.getElementById('passwordRequired');
          const passwordHelp = document.getElementById('passwordHelp');
          
          if (passwordField) passwordField.required = true;
          if (passwordRequired) passwordRequired.textContent = '*';
          if (passwordHelp) passwordHelp.textContent = 'Mínimo 6 caracteres';
        }
        currentDistributor = null;
      },
      cancelModal: () => {
        methods.closeModal();
      },
      loadInitialData: async () => {
        try {
          console.log('🔄 Cargando datos iniciales...');

          if (htmlElements.distributorsTableBody) {
            htmlElements.distributorsTableBody.innerHTML = `
              <tr>
                <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Cargando repartidores...
                </td>
              </tr>
            `;
          }

          const distributors = await api.getDistributors();
          console.log('🏍️ Repartidores cargados:', distributors.length);
          render.renderDistributors(distributors);

        } catch (error) {
          console.error("❌ Failed to load initial data.", error);

          if (htmlElements.distributorsTableBody) {
            htmlElements.distributorsTableBody.innerHTML = `
              <tr>
                <td colspan="4" class="px-4 py-8 text-center text-red-500">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Error al cargar repartidores. Verifique la conexión con el servidor.
                </td>
              </tr>
            `;
          }
        }
      },
      init: async () => {
        if (isInitialized) {
          console.log('⚠️ DistributorsApp ya está inicializado');
          return;
        }

        console.log('🚀 Inicializando DistributorsApp...');
        isInitialized = true;

        methods.initHtmlElements();
        handlers.setupEventDelegation();
        handlers.handleEventListeners();
        await methods.loadInitialData();
        console.log('✅ DistributorsApp inicializado correctamente');
      },
    };

    // Event Handlers
    const handlers = {
      handleCreateDistributor: async (e) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.distributorForm);

          const fullName = formData.get('fullName')?.trim();
          const username = formData.get('username')?.trim();
          const email = formData.get('email')?.trim();
          const phone = formData.get('phone')?.trim();
          const password = formData.get('password')?.trim();

          if (!fullName || !username || !email || !phone || !password) {
            alert('Todos los campos son requeridos');
            return;
          }

          if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
          }

          const distributorData = {
            fullName,
            username,
            email,
            phone,
            password
          };

          console.log('📝 Creando repartidor:', distributorData);

          const result = await api.createDistributor(distributorData);
          console.log('✅ Repartidor creado:', result);

          alert('Repartidor creado exitosamente');
          methods.closeModal();

          const distributors = await api.getDistributors();
          render.renderDistributors(distributors);

        } catch (error) {
          console.error('❌ Error al crear repartidor:', error);
          alert('Error al crear repartidor: ' + error.message);
        }
      },

      handleUpdateDistributor: async (e, distributorId) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.distributorForm);

          const fullName = formData.get('fullName')?.trim();
          const username = formData.get('username')?.trim();
          const email = formData.get('email')?.trim();
          const phone = formData.get('phone')?.trim();
          const password = formData.get('password')?.trim();

          if (!fullName || !username || !email || !phone) {
            alert('Nombre completo, usuario, email y teléfono son requeridos');
            return;
          }

          if (password && password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
          }

          const updatedData = {
            _id: distributorId,
            fullName,
            username,
            email,
            phone
          };

          // Only include password if it's provided
          if (password) {
            updatedData.password = password;
          }

          console.log('✏️ Actualizando repartidor:', updatedData);

          const result = await api.updateDistributor(updatedData);
          console.log('✅ Repartidor actualizado:', result);

          alert('Repartidor actualizado exitosamente');
          methods.closeModal();

          const distributors = await api.getDistributors();
          render.renderDistributors(distributors);

        } catch (error) {
          console.error('❌ Error al actualizar repartidor:', error);
          alert('Error al actualizar repartidor: ' + error.message);
        }
      },

      handleShowNewDistributorModal: () => {
        currentDistributor = null;
        if (htmlElements.distributorModalTitle) htmlElements.distributorModalTitle.textContent = 'Nuevo Repartidor';
        if (htmlElements.distributorForm) htmlElements.distributorForm.reset();
        
        // Reset password field for new distributor
        const passwordField = document.getElementById('passwordField');
        const passwordRequired = document.getElementById('passwordRequired');
        const passwordHelp = document.getElementById('passwordHelp');
        
        if (passwordField) passwordField.required = true;
        if (passwordRequired) passwordRequired.textContent = '*';
        if (passwordHelp) passwordHelp.textContent = 'Mínimo 6 caracteres';
        
        methods.openModal();
      },

      handleShowEditDistributorModal: (distributor) => {
        currentDistributor = distributor;
        if (htmlElements.distributorModalTitle) htmlElements.distributorModalTitle.textContent = 'Editar Repartidor';
        if (htmlElements.distributorForm) {
          htmlElements.distributorForm.fullName.value = distributor.fullName || '';
          htmlElements.distributorForm.username.value = distributor.username || '';
          htmlElements.distributorForm.email.value = distributor.email || '';
          htmlElements.distributorForm.phone.value = distributor.phone || '';
          htmlElements.distributorForm.password.value = ''; // Always empty for security
          
          // Update password field for editing
          const passwordField = document.getElementById('passwordField');
          const passwordRequired = document.getElementById('passwordRequired');
          const passwordHelp = document.getElementById('passwordHelp');
          
          if (passwordField) passwordField.required = false;
          if (passwordRequired) passwordRequired.textContent = '';
          if (passwordHelp) passwordHelp.textContent = 'Dejar en blanco para mantener la contraseña actual';
        }
        methods.openModal();
      },

      handleDeleteDistributor: async (distributorId) => {
        const confirmed = confirm('¿Estás seguro de que deseas eliminar este repartidor? Esta acción no se puede deshacer.');

        if (!confirmed) return;

        try {
          console.log('🗑️ Eliminando repartidor:', distributorId);
          await api.deleteDistributor(distributorId);
          alert('Repartidor eliminado exitosamente');

          const distributors = await api.getDistributors();
          render.renderDistributors(distributors);

        } catch (error) {
          console.error('Error al eliminar repartidor:', error);
          alert('Error al eliminar repartidor: ' + error.message);
        }
      },

      handleEventListeners: () => {
        if (htmlElements.newDistributorBtn) {
          htmlElements.newDistributorBtn.removeEventListener('click', handlers.handleShowNewDistributorModal);
          htmlElements.newDistributorBtn.addEventListener('click', handlers.handleShowNewDistributorModal);
        }

        if (htmlElements.distributorForm) {
          htmlElements.distributorForm.removeEventListener('submit', handlers.handleFormSubmit);
          htmlElements.distributorForm.addEventListener('submit', handlers.handleFormSubmit);
        }

        if (htmlElements.closeModalBtn) {
          htmlElements.closeModalBtn.removeEventListener('click', methods.closeModal);
          htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        }
        if (htmlElements.cancelDistributorBtn) {
          htmlElements.cancelDistributorBtn.removeEventListener('click', methods.closeModal);
          htmlElements.cancelDistributorBtn.addEventListener('click', methods.cancelModal);
        }

        if (htmlElements.distributorModal) {
          htmlElements.distributorModal.removeEventListener('click', handlers.handleModalClick);
          htmlElements.distributorModal.addEventListener('click', handlers.handleModalClick);
        }
      },

      handleFormSubmit: async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
          if (currentDistributor) {
            await handlers.handleUpdateDistributor(e, currentDistributor._id);
          } else {
            await handlers.handleCreateDistributor(e);
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar';
        }
      },

      handleModalClick: (e) => {
        if (e.target === htmlElements.distributorModal) {
          methods.closeModal();
        }
      },

      setupEventDelegation: () => {
        if (handlers.delegationHandler) {
          document.removeEventListener('click', handlers.delegationHandler);
        }

        handlers.delegationHandler = (e) => {
          if (e.target.closest('.editDistributorBtn')) {
            const row = e.target.closest('tr');
            const distributorId = row.dataset.distributorId;
            const distributor = {
              _id: distributorId,
              fullName: row.querySelector('.distributor-name').textContent,
              username: row.querySelector('.distributor-name').nextElementSibling.textContent.replace('@', ''),
              email: row.querySelector('.distributor-email').textContent,
              phone: row.querySelector('.distributor-phone').textContent
            };
            handlers.handleShowEditDistributorModal(distributor);
          }

          if (e.target.closest('.deleteDistributorBtn')) {
            const row = e.target.closest('tr');
            const distributorId = row.dataset.distributorId;
            handlers.handleDeleteDistributor(distributorId);
          }
        };

        document.addEventListener('click', handlers.delegationHandler);
      },
    };

    return {
      init: methods.init,
    };
  })();

  // Make DistributorsApp globally available
  window.DistributorsApp = DistributorsApp;
})();