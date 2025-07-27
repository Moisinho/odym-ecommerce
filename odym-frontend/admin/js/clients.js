// Módulo para la gestión de clientes
const App = (function() {
    // Variables privadas
    let api;
    let htmlElements = {};
    let currentClient = null;

    // Métodos de API
    const apiMethods = {
        getClients: async function() {
            try {
                return await api.request('/clients');
            } catch (error) {
                console.error('Error al obtener clientes:', error);
                showNotification('Error al cargar los clientes', 'error');
                return [];
            }
        },
        createClient: async function(data) {
            try {
                return await api.request('/clients', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al crear cliente:', error);
                showNotification('Error al crear el cliente', 'error');
                throw error;
            }
        },
        updateClient: async function(id, data) {
            try {
                return await api.request(`/clients/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al actualizar cliente:', error);
                showNotification('Error al actualizar el cliente', 'error');
                throw error;
            }
        },
        deleteClient: async function(id) {
            try {
                return await api.request(`/clients/${id}`, {
                    method: 'DELETE',
                });
            } catch (error) {
                console.error('Error al eliminar cliente:', error);
                showNotification('Error al eliminar el cliente', 'error');
                throw error;
            }
        }
    };

    // Métodos de renderizado
    const renderMethods = {
        renderClients: function(clients) {
            const tableBody = htmlElements.clientsTableBody;
            tableBody.innerHTML = '';

            if (clients.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No hay clientes registrados
                    </td>
                `;
                tableBody.appendChild(row);
                return;
            }

            clients.forEach(client => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.dataset.clientId = client.id;

                // Obtener las iniciales para el avatar
                const initials = client.name ? client.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'C';
                const registrationDate = client.registrationDate ? new Date(client.registrationDate).toLocaleDateString() : 'N/A';

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">${initials}</div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900 client-name">${client.name}</div>
                                <div class="text-sm text-gray-500 client-username">@${client.username || 'cliente'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 client-email">${client.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 client-phone">${client.phone || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 client-registration-date">${registrationDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button id="viewClientBtn" class="text-blue-600 hover:text-blue-900"><i class="fas fa-eye"></i></button>
                            <button id="editClientBtn" class="text-orange-600 hover:text-orange-900"><i class="fas fa-edit"></i></button>
                            <button id="deleteClientBtn" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
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
                    if (pageTitle) pageTitle.innerText = 'Clientes';
                }),
                window.loadPartial('sidebar-container', './partials/aside.html', () => {
                    window.setActiveLink('clients.html');
                })
            ]);
        }
    };

    // Métodos generales
    const methods = {
        initHtmlElements: function() {
            htmlElements = {
                clientsTableBody: document.getElementById('clientsTableBody'),
                newClientBtn: document.getElementById('newClientBtn'),
                clientModal: document.getElementById('clientModal'),
                clientForm: document.getElementById('clientForm'),
                clientModalTitle: document.getElementById('clientModalTitle'),
                closeModalBtn: document.getElementById('closeModalBtn'),
                cancelClientBtn: document.getElementById('cancelClientBtn'),
                exportBtn: document.getElementById('exportClientsBtn')
            };
        },
        openModal: function() {
            htmlElements.clientModal.classList.remove('hidden');
        },
        closeModal: function() {
            htmlElements.clientModal.classList.add('hidden');
            htmlElements.clientForm.reset();
            currentClient = null;
        },
        loadInitialData: async function() {
            showLoading();
            try {
                const clients = await apiMethods.getClients();
                renderMethods.renderClients(clients);
            } catch (error) {
                console.error('Error cargando datos iniciales:', error);
            } finally {
                hideLoading();
            }
        },
        exportClientsToCSV: function() {
            // Implementación básica de exportación a CSV
            showLoading();
            try {
                const tableBody = htmlElements.clientsTableBody;
                const rows = tableBody.querySelectorAll('tr');
                
                if (rows.length === 0) {
                    showNotification('No hay datos para exportar', 'error');
                    return;
                }
                
                let csvContent = 'Nombre,Email,Teléfono,Fecha de Registro\n';
                
                rows.forEach(row => {
                    const name = row.querySelector('.client-name')?.textContent || '';
                    const email = row.querySelector('.client-email')?.textContent || '';
                    const phone = row.querySelector('.client-phone')?.textContent || '';
                    const registrationDate = row.querySelector('.client-registration-date')?.textContent || '';
                    
                    csvContent += `"${name}","${email}","${phone}","${registrationDate}"\n`;
                });
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', 'clientes.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showNotification('Datos exportados correctamente');
            } catch (error) {
                console.error('Error exportando datos:', error);
                showNotification('Error al exportar datos', 'error');
            } finally {
                hideLoading();
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
        handleCreateClient: async function(event) {
            event.preventDefault();
            showLoading();

            try {
                const formData = new FormData(htmlElements.clientForm);
                const clientData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    address: formData.get('address'),
                    city: formData.get('city'),
                    postalCode: formData.get('postalCode'),
                    country: formData.get('country')
                };

                if (currentClient) {
                    // Actualizar cliente existente
                    await apiMethods.updateClient(currentClient.id, clientData);
                    showNotification('Cliente actualizado correctamente');
                } else {
                    // Crear nuevo cliente
                    await apiMethods.createClient(clientData);
                    showNotification('Cliente creado correctamente');
                }

                methods.closeModal();
                await methods.loadInitialData();
            } catch (error) {
                console.error('Error al guardar cliente:', error);
            } finally {
                hideLoading();
            }
        },
        handleShowEditClientModal: function(clientId) {
            const row = document.querySelector(`tr[data-client-id="${clientId}"]`);
            if (!row) return;

            currentClient = {
                id: clientId,
                name: row.querySelector('.client-name').textContent,
                email: row.querySelector('.client-email').textContent,
                phone: row.querySelector('.client-phone').textContent,
                username: row.querySelector('.client-username')?.textContent.replace('@', '') || ''
            };

            // Llenar el formulario con los datos del cliente
            document.getElementById('clientName').value = currentClient.name;
            document.getElementById('clientEmail').value = currentClient.email;
            document.getElementById('clientPhone').value = currentClient.phone !== 'N/A' ? currentClient.phone : '';
            
            // Si hay campos adicionales en el formulario, también los llenamos
            const addressField = document.getElementById('clientAddress');
            if (addressField && currentClient.address) addressField.value = currentClient.address;
            
            const cityField = document.getElementById('clientCity');
            if (cityField && currentClient.city) cityField.value = currentClient.city;
            
            const postalCodeField = document.getElementById('clientPostalCode');
            if (postalCodeField && currentClient.postalCode) postalCodeField.value = currentClient.postalCode;
            
            const countryField = document.getElementById('clientCountry');
            if (countryField && currentClient.country) countryField.value = currentClient.country;

            // Cambiar el título del modal
            htmlElements.clientModalTitle.textContent = 'Editar Cliente';

            // Mostrar el modal
            methods.openModal();
        },
        handleViewClientDetails: function(clientId) {
            // Implementación para ver detalles del cliente
            // Podría abrir un modal diferente o redirigir a una página de detalles
            console.log('Ver detalles del cliente:', clientId);
            showNotification('Funcionalidad de ver detalles en desarrollo');
        },
        handleDeleteClient: async function(clientId) {
            const confirmed = await window.showConfirmDialog('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.');
            if (!confirmed) return;
            
            showLoading();
            try {
                await apiMethods.deleteClient(clientId);
                showNotification('Cliente eliminado correctamente');
                await methods.loadInitialData();
            } catch (error) {
                console.error('Error al eliminar cliente:', error);
            } finally {
                hideLoading();
            }
        },
        handleShowNewClientModal: function() {
            currentClient = null;
            htmlElements.clientForm.reset();
            htmlElements.clientModalTitle.textContent = 'Nuevo Cliente';
            methods.openModal();
        },
        handleEventListeners: function() {
            // Botón para mostrar el modal de nuevo cliente
            if (htmlElements.newClientBtn) {
                htmlElements.newClientBtn.addEventListener('click', this.handleShowNewClientModal);
            }

            // Botón para exportar clientes
            if (htmlElements.exportBtn) {
                htmlElements.exportBtn.addEventListener('click', methods.exportClientsToCSV);
            }

            // Formulario de cliente
            if (htmlElements.clientForm) {
                htmlElements.clientForm.addEventListener('submit', this.handleCreateClient);
            }

            // Botones para cerrar el modal
            if (htmlElements.closeModalBtn) {
                htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
            }

            if (htmlElements.cancelClientBtn) {
                htmlElements.cancelClientBtn.addEventListener('click', methods.closeModal);
            }

            // Delegación de eventos para botones de ver, editar y eliminar
            if (htmlElements.clientsTableBody) {
                htmlElements.clientsTableBody.addEventListener('click', (event) => {
                    const target = event.target.closest('button');
                    if (!target) return;

                    const row = target.closest('tr');
                    const clientId = row.dataset.clientId;

                    if (target.id === 'viewClientBtn' || target.closest('#viewClientBtn')) {
                        this.handleViewClientDetails(clientId);
                    } else if (target.id === 'editClientBtn' || target.closest('#editClientBtn')) {
                        this.handleShowEditClientModal(clientId);
                    } else if (target.id === 'deleteClientBtn' || target.closest('#deleteClientBtn')) {
                        this.handleDeleteClient(clientId);
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