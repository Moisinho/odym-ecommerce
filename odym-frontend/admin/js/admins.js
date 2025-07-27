(() => {
  const AdminsApp = (() => {
    // Private variables
    let currentAdmin = null;
    let htmlElements = {}; // To be populated after DOM is ready
    let isInitialized = false; // Prevent multiple initializations

    // API methods for interacting with the backend
    const api = {
      getAdmins: async () => {
        try {
          // Get customers with admin role
          const response = await fetch('http://localhost:3000/api/customers');
          if (!response.ok) throw new Error('Could not fetch admins');
          const data = await response.json();
          const customers = data.customers || [];
          // Filter only admin users
          return customers.filter(customer => customer.role === 'admin');
        } catch (error) {
          console.error('Error fetching admins:', error);
          return [];
        }
      },
      createAdmin: async (adminData) => {
        try {
          // Create admin as customer with admin role
          const adminCustomerData = {
            ...adminData,
            role: 'admin',
            subscription: 'ODYM God', // Admins get God subscription
            phone: adminData.phone || '000-000-0000', // Default phone if not provided
            address: adminData.address || 'Admin Address' // Default address if not provided
          };

          const response = await fetch('http://localhost:3000/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminCustomerData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not create admin');
          }
          return await response.json();
        } catch (error) {
          console.error('Error creating admin:', error);
          throw error;
        }
      },
      updateAdmin: async (adminData) => {
        try {
          // Update admin as customer with admin role
          const adminCustomerData = {
            ...adminData,
            role: 'admin',
            subscription: 'ODYM God' // Admins get God subscription
          };

          const response = await fetch(`http://localhost:3000/api/customers/${adminData._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adminCustomerData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not update admin');
          }
          return await response.json();
        } catch (error) {
          console.error('Error updating admin:', error);
          throw error;
        }
      },
      deleteAdmin: async (adminId) => {
        try {
          // Delete admin from customers
          const response = await fetch(`http://localhost:3000/api/customers/${adminId}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not delete admin');
          }
          return await response.json();
        } catch (error) {
          console.error('Error deleting admin:', error);
          throw error;
        }
      },
    };

    // Render methods for updating the UI
    const render = {
      renderAdmins: (admins) => {
        if (!htmlElements.adminsTableBody) return;

        if (admins.length === 0) {
          htmlElements.adminsTableBody.innerHTML = `
            <tr>
              <td colspan="3" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-user-shield text-4xl mb-4 text-gray-300"></i>
                <p>No hay administradores registrados</p>
              </td>
            </tr>
          `;
          return;
        }

        htmlElements.adminsTableBody.innerHTML = '';
        admins.forEach(admin => {
          const row = document.createElement('tr');
          row.dataset.adminId = admin._id;
          row.className = 'hover:bg-gray-50';

          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center justify-center">
                <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <i class="fas fa-user-shield text-red-600"></i>
                </div>
                <div class="text-left">
                  <div class="text-sm font-medium text-gray-900 admin-name">${admin.fullName}</div>
                  <div class="text-sm text-gray-500">@${admin.username}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 admin-email">${admin.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <button class="editAdminBtn text-orange-600 hover:text-orange-900 mr-3" title="Editar administrador">
                <i class="fas fa-edit"></i>
              </button>
              <button class="deleteAdminBtn text-red-600 hover:text-red-900" title="Eliminar administrador">
                <i class="fas fa-user-times"></i>
              </button>
            </td>
          `;
          htmlElements.adminsTableBody.appendChild(row);
        });
      }
    };

    // General methods
    const methods = {
      initHtmlElements: () => {
        htmlElements = {
          adminModal: document.getElementById('adminModal'),
          adminForm: document.getElementById('adminForm'),
          closeModalBtn: document.getElementById('closeModalBtn'),
          cancelAdminBtn: document.getElementById('cancelAdminBtn'),
          adminsTableBody: document.getElementById('adminsTableBody'),
          adminModalTitle: document.getElementById('adminModalTitle'),
          newAdminBtn: document.getElementById('newAdminBtn'),
        };
      },
      openModal: () => {
        if (htmlElements.adminModal) {
          htmlElements.adminModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      },
      closeModal: () => {
        if (htmlElements.adminModal) {
          htmlElements.adminModal.classList.add('hidden');
          document.body.style.overflow = 'auto';
        }
        if (htmlElements.adminForm) htmlElements.adminForm.reset();
        currentAdmin = null;
      },
      cancelModal: () => {
        methods.closeModal();
      },
      loadInitialData: async () => {
        try {
          console.log('🔄 Cargando datos iniciales...');

          if (htmlElements.adminsTableBody) {
            htmlElements.adminsTableBody.innerHTML = `
              <tr>
                <td colspan="3" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Cargando administradores...
                </td>
              </tr>
            `;
          }

          const admins = await api.getAdmins();
          console.log('👥 Administradores cargados:', admins.length);
          render.renderAdmins(admins);

        } catch (error) {
          console.error("❌ Failed to load initial data.", error);

          if (htmlElements.adminsTableBody) {
            htmlElements.adminsTableBody.innerHTML = `
              <tr>
                <td colspan="3" class="px-4 py-8 text-center text-red-500">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Error al cargar administradores. Verifique la conexión con el servidor.
                </td>
              </tr>
            `;
          }
        }
      },
      init: async () => {
        if (isInitialized) {
          console.log('⚠️ AdminsApp ya está inicializado');
          return;
        }

        console.log('🚀 Inicializando AdminsApp...');
        isInitialized = true;

        methods.initHtmlElements();
        handlers.setupEventDelegation();
        handlers.handleEventListeners();
        await methods.loadInitialData();
        console.log('✅ AdminsApp inicializado correctamente');
      },
    };

    // Event Handlers
    const handlers = {
      handleCreateAdmin: async (e) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.adminForm);

          const fullName = formData.get('fullName')?.trim();
          const username = formData.get('username')?.trim();
          const email = formData.get('email')?.trim();
          const password = formData.get('password')?.trim();

          if (!fullName || !username || !email || !password) {
            alert('Todos los campos son requeridos');
            return;
          }

          const adminData = {
            fullName,
            username,
            email,
            password,
          };

          console.log('📝 Creando administrador:', adminData);

          const result = await api.createAdmin(adminData);
          console.log('✅ Administrador creado:', result);

          alert('Administrador creado exitosamente');
          methods.closeModal();

          const admins = await api.getAdmins();
          render.renderAdmins(admins);

        } catch (error) {
          console.error('❌ Error al crear administrador:', error);
          alert('Error al crear administrador: ' + error.message);
        }
      },

      handleUpdateAdmin: async (e, adminId) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.adminForm);

          const fullName = formData.get('fullName')?.trim();
          const username = formData.get('username')?.trim();
          const email = formData.get('email')?.trim();
          const password = formData.get('password')?.trim();

          if (!fullName || !username || !email) {
            alert('Nombre, usuario y email son requeridos');
            return;
          }

          const updatedData = {
            _id: adminId,
            fullName,
            username,
            email,
          };

          if (password) {
            updatedData.password = password;
          }

          console.log('✏️ Actualizando administrador:', updatedData);

          const result = await api.updateAdmin(updatedData);
          console.log('✅ Administrador actualizado:', result);

          alert('Administrador actualizado exitosamente');
          methods.closeModal();

          const admins = await api.getAdmins();
          render.renderAdmins(admins);

        } catch (error) {
          console.error('❌ Error al actualizar administrador:', error);
          alert('Error al actualizar administrador: ' + error.message);
        }
      },

      handleShowNewAdminModal: () => {
        currentAdmin = null;
        if (htmlElements.adminModalTitle) htmlElements.adminModalTitle.textContent = 'Nuevo Administrador';
        if (htmlElements.adminForm) htmlElements.adminForm.reset();
        methods.openModal();
      },

      handleShowEditAdminModal: (admin) => {
        currentAdmin = admin;
        if (htmlElements.adminModalTitle) htmlElements.adminModalTitle.textContent = 'Editar Administrador';
        if (htmlElements.adminForm) {
          htmlElements.adminForm.fullName.value = admin.fullName;
          htmlElements.adminForm.username.value = admin.username;
          htmlElements.adminForm.email.value = admin.email;
          htmlElements.adminForm.password.value = '';
        }
        methods.openModal();
      },

      handleDeleteAdmin: async (adminId) => {
        const confirmed = confirm('¿Estás seguro de que deseas eliminar este administrador? Esta acción no se puede deshacer.');

        if (!confirmed) return;

        try {
          console.log('🗑️ Eliminando administrador:', adminId);
          await api.deleteAdmin(adminId);
          alert('Administrador eliminado exitosamente');

          const admins = await api.getAdmins();
          render.renderAdmins(admins);

        } catch (error) {
          console.error('Error al eliminar administrador:', error);
          alert('Error al eliminar administrador: ' + error.message);
        }
      },

      handleEventListeners: () => {
        if (htmlElements.newAdminBtn) {
          htmlElements.newAdminBtn.removeEventListener('click', handlers.handleShowNewAdminModal);
          htmlElements.newAdminBtn.addEventListener('click', handlers.handleShowNewAdminModal);
        }

        if (htmlElements.adminForm) {
          htmlElements.adminForm.removeEventListener('submit', handlers.handleFormSubmit);
          htmlElements.adminForm.addEventListener('submit', handlers.handleFormSubmit);
        }

        if (htmlElements.closeModalBtn) {
          htmlElements.closeModalBtn.removeEventListener('click', methods.closeModal);
          htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        }
        if (htmlElements.cancelAdminBtn) {
          htmlElements.cancelAdminBtn.removeEventListener('click', methods.closeModal);
          htmlElements.cancelAdminBtn.addEventListener('click', methods.cancelModal);
        }

        if (htmlElements.adminModal) {
          htmlElements.adminModal.removeEventListener('click', handlers.handleModalClick);
          htmlElements.adminModal.addEventListener('click', handlers.handleModalClick);
        }
      },

      handleFormSubmit: async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
          if (currentAdmin) {
            await handlers.handleUpdateAdmin(e, currentAdmin._id);
          } else {
            await handlers.handleCreateAdmin(e);
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar';
        }
      },

      handleModalClick: (e) => {
        if (e.target === htmlElements.adminModal) {
          methods.closeModal();
        }
      },

      setupEventDelegation: () => {
        if (handlers.delegationHandler) {
          document.removeEventListener('click', handlers.delegationHandler);
        }

        handlers.delegationHandler = (e) => {
          if (e.target.closest('.editAdminBtn')) {
            const row = e.target.closest('tr');
            const adminId = row.dataset.adminId;
            const admin = {
              _id: adminId,
              fullName: row.querySelector('.admin-name').textContent,
              username: row.querySelector('.admin-name').nextElementSibling.textContent.replace('@', ''),
              email: row.querySelector('.admin-email').textContent
            };
            handlers.handleShowEditAdminModal(admin);
          }

          if (e.target.closest('.deleteAdminBtn')) {
            const row = e.target.closest('tr');
            const adminId = row.dataset.adminId;
            handlers.handleDeleteAdmin(adminId);
          }
        };

        document.addEventListener('click', handlers.delegationHandler);
      },
    };

    return {
      init: methods.init,
    };
  })();

  // Make AdminsApp globally available
  window.AdminsApp = AdminsApp;
})();