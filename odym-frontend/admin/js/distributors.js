// Módulo para la gestión de repartidores
const App = (function() {
    // Variables privadas
    let api;
    let htmlElements = {};
    let currentDistributor = null;

    // Métodos de API
    const apiMethods = {
        getDistributors: async function() {
            try {
                return await api.request('/distributors');
            } catch (error) {
                console.error('Error al obtener repartidores:', error);
                showNotification('Error al cargar los repartidores', 'error');
                return [];
            }
        },
        createDistributor: async function(data) {
            try {
                return await api.request('/distributors', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al crear repartidor:', error);
                showNotification('Error al crear el repartidor', 'error');
                throw error;
            }
        },
        updateDistributor: async function(id, data) {
            try {
                return await api.request(`/distributors/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al actualizar repartidor:', error);
                showNotification('Error al actualizar el repartidor', 'error');
                throw error;
            }
        },
        deleteDistributor: async function(id) {
            try {
                return await api.request(`/distributors/${id}`, {
                    method: 'DELETE',
                });
            } catch (error) {
                console.error('Error al eliminar repartidor:', error);
                showNotification('Error al eliminar el repartidor', 'error');
                throw error;
            }
        }
    };

    // Métodos de renderizado
    const renderMethods = {
        renderDistributors: function(distributors) {
            const tableBody = htmlElements.distributorsTableBody;
            tableBody.innerHTML = '';

            if (distributors.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                        No hay repartidores registrados
                    </td>
                `;
                tableBody.appendChild(row);
                return;
            }

            distributors.forEach(distributor => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.dataset.distributorId = distributor.id;

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 distributor-company">${distributor.company}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 distributor-contact">${distributor.contact}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 distributor-zone">${distributor.zone || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button id="viewDistributorBtn" class="text-blue-600 hover:text-blue-900"><i class="fas fa-eye"></i></button>
                            <button id="editDistributorBtn" class="text-orange-600 hover:text-orange-900"><i class="fas fa-edit"></i></button>
                            <button id="deleteDistributorBtn" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;

                tableBody.appendChild(row);
            });
        }
    };

    // Métodos de layout
    const layoutMethods = {
        /**
         * Carga todos los componentes parciales
         */
        loadAll: async function() {
            await Promise.all([
                window.loadPartial('header-container', './partials/header.html', () => {
                    const pageTitle = document.getElementById('page-title');
                    if (pageTitle) pageTitle.innerText = 'Repartidores';
                }),
                window.loadPartial('sidebar-container', './partials/aside.html', () => {
                    window.setActiveLink('distributors.html');
                })
            ]);
        }
    };

    // Métodos generales
    const methods = {
        initHtmlElements: function() {
            htmlElements = {
                distributorsTableBody: document.getElementById('distributorsTableBody'),
                newDistributorBtn: document.getElementById('newDistributorBtn'),
                distributorModal: document.getElementById('distributorModal'),
                distributorForm: document.getElementById('distributorForm'),
                distributorModalTitle: document.getElementById('distributorModalTitle'),
                closeModalBtn: document.getElementById('closeModalBtn'),
                cancelDistributorBtn: document.getElementById('cancelDistributorBtn')
            };
        },
        openModal: function() {
            htmlElements.distributorModal.classList.remove('hidden');
        },
        closeModal: function() {
            htmlElements.distributorModal.classList.add('hidden');
            htmlElements.distributorForm.reset();
            currentDistributor = null;
        },
        loadInitialData: async function() {
            showLoading();
            try {
                const distributors = await apiMethods.getDistributors();
                renderMethods.renderDistributors(distributors);
            } catch (error) {
                console.error('Error cargando datos iniciales:', error);
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
        handleCreateDistributor: async function(event) {
            event.preventDefault();
            showLoading();

            try {
                const formData = new FormData(htmlElements.distributorForm);
                const distributorData = {
                    company: formData.get('company'),
                    contact: formData.get('contact'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    zone: formData.get('zone'),
                    address: formData.get('address'),
                    city: formData.get('city'),
                    postalCode: formData.get('postalCode'),
                    country: formData.get('country'),
                    notes: formData.get('notes')
                };

                if (currentDistributor) {
                    // Actualizar repartidor existente
                    await apiMethods.updateDistributor(currentDistributor.id, distributorData);
                    showNotification('Repartidor actualizado correctamente');
                } else {
                    // Crear nuevo repartidor
                    await apiMethods.createDistributor(distributorData);
                    showNotification('Repartidor creado correctamente');
                }

                methods.closeModal();
                await methods.loadInitialData();
            } catch (error) {
                console.error('Error al guardar repartidor:', error);
            } finally {
                hideLoading();
            }
        },
        handleShowEditDistributorModal: function(distributorId) {
            const row = document.querySelector(`tr[data-distributor-id="${distributorId}"]`);
            if (!row) return;

            currentDistributor = {
                id: distributorId,
                company: row.querySelector('.distributor-company').textContent,
                contact: row.querySelector('.distributor-contact').textContent,
                zone: row.querySelector('.distributor-zone').textContent
            };

            // Llenar el formulario con los datos del repartidor
            document.getElementById('distributorCompany').value = currentDistributor.company;
            document.getElementById('distributorContact').value = currentDistributor.contact;
            document.getElementById('distributorZone').value = currentDistributor.zone !== 'N/A' ? currentDistributor.zone : '';
            
            // Si hay campos adicionales en el formulario, también los llenamos
            const phoneField = document.getElementById('distributorPhone');
            if (phoneField && currentDistributor.phone) phoneField.value = currentDistributor.phone;
            
            const emailField = document.getElementById('distributorEmail');
            if (emailField && currentDistributor.email) emailField.value = currentDistributor.email;
            
            const addressField = document.getElementById('distributorAddress');
            if (addressField && currentDistributor.address) addressField.value = currentDistributor.address;
            
            const cityField = document.getElementById('distributorCity');
            if (cityField && currentDistributor.city) cityField.value = currentDistributor.city;
            
            const postalCodeField = document.getElementById('distributorPostalCode');
            if (postalCodeField && currentDistributor.postalCode) postalCodeField.value = currentDistributor.postalCode;
            
            const countryField = document.getElementById('distributorCountry');
            if (countryField && currentDistributor.country) countryField.value = currentDistributor.country;
            
            const notesField = document.getElementById('distributorNotes');
            if (notesField && currentDistributor.notes) notesField.value = currentDistributor.notes;

            // Cambiar el título del modal
            htmlElements.distributorModalTitle.textContent = 'Editar Repartidor';

            // Mostrar el modal
            methods.openModal();
        },
        handleViewDistributorDetails: function(distributorId) {
            // Implementación para ver detalles del repartidor
            // Podría abrir un modal diferente o redirigir a una página de detalles
            console.log('Ver detalles del repartidor:', distributorId);
            showNotification('Funcionalidad de ver detalles en desarrollo');
        },
        handleDeleteDistributor: async function(distributorId) {
            const confirmed = await window.showConfirmDialog('¿Estás seguro de que deseas eliminar este repartidor?', 'Esta acción no se puede deshacer.');
            
            if (!confirmed) return;
            
            showLoading();
            try {
                await apiMethods.deleteDistributor(distributorId);
                showNotification('Repartidor eliminado correctamente');
                await methods.loadInitialData();
            } catch (error) {
                console.error('Error al eliminar repartidor:', error);
            } finally {
                hideLoading();
            }
        },
        handleShowNewDistributorModal: function() {
            currentDistributor = null;
            htmlElements.distributorForm.reset();
            htmlElements.distributorModalTitle.textContent = 'Nuevo Repartidor';
            methods.openModal();
        },
        handleEventListeners: function() {
            // Botón para mostrar el modal de nuevo repartidor
            if (htmlElements.newDistributorBtn) {
                htmlElements.newDistributorBtn.addEventListener('click', this.handleShowNewDistributorModal);
            }

            // Formulario de repartidor
            if (htmlElements.distributorForm) {
                htmlElements.distributorForm.addEventListener('submit', this.handleCreateDistributor);
            }

            // Botones para cerrar el modal
            if (htmlElements.closeModalBtn) {
                htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
            }

            if (htmlElements.cancelDistributorBtn) {
                htmlElements.cancelDistributorBtn.addEventListener('click', methods.closeModal);
            }

            // Delegación de eventos para botones de ver, editar y eliminar
            if (htmlElements.distributorsTableBody) {
                htmlElements.distributorsTableBody.addEventListener('click', (event) => {
                    const target = event.target.closest('button');
                    if (!target) return;

                    const row = target.closest('tr');
                    const distributorId = row.dataset.distributorId;

                    if (target.id === 'viewDistributorBtn' || target.closest('#viewDistributorBtn')) {
                        this.handleViewDistributorDetails(distributorId);
                    } else if (target.id === 'editDistributorBtn' || target.closest('#editDistributorBtn')) {
                        this.handleShowEditDistributorModal(distributorId);
                    } else if (target.id === 'deleteDistributorBtn' || target.closest('#deleteDistributorBtn')) {
                        this.handleDeleteDistributor(distributorId);
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