// Módulo para la gestión de administradores
const App = (function() {
    // Variables privadas
    let api;
    let htmlElements = {};
    let currentAdmin = null;

    // Métodos de API
    const apiMethods = {
        getAdmins: async function() {
            try {
                return await api.request('/admins');
            } catch (error) {
                console.error('Error al obtener administradores:', error);
                showNotification('Error al cargar los administradores', 'error');
                return [];
            }
        },
        createAdmin: async function(data) {
            try {
                return await api.request('/admins', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al crear administrador:', error);
                showNotification('Error al crear el administrador', 'error');
                throw error;
            }
        },
        updateAdmin: async function(id, data) {
            try {
                return await api.request(`/admins/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al actualizar administrador:', error);
                showNotification('Error al actualizar el administrador', 'error');
                throw error;
            }
        },
        deleteAdmin: async function(id) {
            try {
                return await api.request(`/admins/${id}`, {
                    method: 'DELETE',
                });
            } catch (error) {
                console.error('Error al eliminar administrador:', error);
                showNotification('Error al eliminar el administrador', 'error');
                throw error;
            }
        }
    };

    // Métodos de renderizado
    const renderMethods = {
        renderAdmins: function(admins) {
            const tableBody = htmlElements.adminsTableBody;
            tableBody.innerHTML = '';

            if (admins.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No hay administradores registrados
                    </td>
                `;
                tableBody.appendChild(row);
                return;
            }

            admins.forEach(admin => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.dataset.adminId = admin.id;

                // Obtener las iniciales para el avatar
                const initials = admin.name ? admin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">${initials}</div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900 admin-name">${admin.name}</div>
                                <div class="text-sm text-gray-500 admin-username">@${admin.username || 'admin'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 admin-email">${admin.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 admin-role">${admin.role || 'Admin'}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 admin-last-login">${admin.lastLogin || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button id="editAdminBtn" class="text-orange-600 hover:text-orange-900"><i class="fas fa-edit"></i></button>
                            <button id="deleteAdminBtn" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;

                tableBody.appendChild(row);
            });
        }
    };

    // Métodos de layout
    const layoutMethods = {
        loadAll: async function() {
            await Promise.all([
                window.loadPartial('header-container', './partials/header.html', () => {
                    const pageTitle = document.getElementById('page-title');
                    if (pageTitle) pageTitle.innerText = 'Administradores';
                }),
                window.loadPartial('sidebar-container', './partials/aside.html', () => {
                    window.setActiveLink('admins.html');
                })
            ]);
        }
    };

    // Métodos generales
    const methods = {
        initHtmlElements: function() {
            htmlElements = {
                adminsTableBody: document.getElementById('adminsTableBody'),
                newAdminBtn: document.getElementById('newAdminBtn'),
                adminModal: document.getElementById('adminModal'),
                adminForm: document.getElementById('adminForm'),
                adminModalTitle: document.getElementById('adminModalTitle'),
                closeModalBtn: document.getElementById('closeModalBtn'),
                cancelAdminBtn: document.getElementById('cancelAdminBtn')
            };
        },
        openModal: function() {
            htmlElements.adminModal.classList.remove('hidden');
        },
        closeModal: function() {
            htmlElements.adminModal.classList.add('hidden');
            htmlElements.adminForm.reset();
            currentAdmin = null;
        },
        loadInitialData: async function() {
            window.showLoading();
            try {
                const admins = await apiMethods.getAdmins();
                renderMethods.renderAdmins(admins);
            } catch (error) {
                console.error('Error cargando datos iniciales:', error);
            } finally {
                window.hideLoading();
            }
        },
        init: async function() {
            api = new window.ApiClient();
            this.initHtmlElements();
            await layoutMethods.loadAll();
            this.loadInitialData();
            handlers.handleEventListeners();
        }
    };

    // Manejadores de eventos
    const handlers = {
        handleCreateAdmin: async function(event) {
            event.preventDefault();
            window.showLoading();

            try {
                const formData = new FormData(htmlElements.adminForm);
                const adminData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    username: formData.get('username'),
                    password: formData.get('password'),
                    role: formData.get('role')
                };

                if (currentAdmin) {
                    // Actualizar administrador existente
                    await apiMethods.updateAdmin(currentAdmin.id, adminData);
                    window.showNotification('Administrador actualizado correctamente');
                } else {
                    // Crear nuevo administrador
                    await apiMethods.createAdmin(adminData);
                    window.showNotification('Administrador creado correctamente');
                }

                methods.closeModal();
                await methods.loadInitialData();
            } catch (error) {
                console.error('Error al guardar administrador:', error);
            } finally {
                window.hideLoading();
            }
        },
        handleShowEditAdminModal: function(adminId) {
            const row = document.querySelector(`tr[data-admin-id="${adminId}"]`);
            if (!row) return;

            currentAdmin = {
                id: adminId,
                name: row.querySelector('.admin-name').textContent,
                email: row.querySelector('.admin-email').textContent,
                username: row.querySelector('.admin-username').textContent.replace('@', ''),
                role: row.querySelector('.admin-role').textContent
            };

            // Llenar el formulario con los datos del administrador
            document.getElementById('adminName').value = currentAdmin.name;
            document.getElementById('adminEmail').value = currentAdmin.email;
            document.getElementById('adminUsername').value = currentAdmin.username;
            document.getElementById('adminRole').value = currentAdmin.role;

            // Cambiar el título del modal
            htmlElements.adminModalTitle.textContent = 'Editar Administrador';

            // Mostrar el modal
            methods.openModal();
        },
        handleDeleteAdmin: async function(adminId) {
            const confirmed = await window.showConfirmDialog('¿Estás seguro de que deseas eliminar este administrador? Esta acción no se puede deshacer.');
            if (!confirmed) return;
            
            window.showLoading();
            try {
                await apiMethods.deleteAdmin(adminId);
                window.showNotification('Administrador eliminado correctamente');
                await methods.loadInitialData();
            } catch (error) {
                console.error('Error al eliminar administrador:', error);
            } finally {
                window.hideLoading();
            }
        },
        handleShowNewAdminModal: function() {
            currentAdmin = null;
            htmlElements.adminForm.reset();
            htmlElements.adminModalTitle.textContent = 'Nuevo Administrador';
            methods.openModal();
        },
        handleEventListeners: function() {
            // Botón para mostrar el modal de nuevo administrador
            if (htmlElements.newAdminBtn) {
                htmlElements.newAdminBtn.addEventListener('click', this.handleShowNewAdminModal);
            }

            // Formulario de administrador
            if (htmlElements.adminForm) {
                htmlElements.adminForm.addEventListener('submit', this.handleCreateAdmin);
            }

            // Botones para cerrar el modal
            if (htmlElements.closeModalBtn) {
                htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
            }

            if (htmlElements.cancelAdminBtn) {
                htmlElements.cancelAdminBtn.addEventListener('click', methods.closeModal);
            }

            // Delegación de eventos para botones de editar y eliminar
            if (htmlElements.adminsTableBody) {
                htmlElements.adminsTableBody.addEventListener('click', (event) => {
                    const target = event.target.closest('button');
                    if (!target) return;

                    const row = target.closest('tr');
                    const adminId = row.dataset.adminId;

                    if (target.id === 'editAdminBtn' || target.closest('#editAdminBtn')) {
                        this.handleShowEditAdminModal(adminId);
                    } else if (target.id === 'deleteAdminBtn' || target.closest('#deleteAdminBtn')) {
                        this.handleDeleteAdmin(adminId);
                    }
                });
            }
        }
    };

    // API pública
    return {
        init: methods.init.bind(methods)
    };
})();

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', App.init);