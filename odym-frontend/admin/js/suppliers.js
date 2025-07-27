// Módulo para la gestión de proveedores
const App = (function() {
    // Variables privadas
    let api;
    let htmlElements = {};
    let currentSupplier = null;

    // Métodos de API
    const apiMethods = {
        getSuppliers: async function() {
            try {
                return await api.request('/suppliers');
            } catch (error) {
                console.error('Error al obtener proveedores:', error);
                showNotification('Error al cargar los proveedores', 'error');
                return [];
            }
        },
        createSupplier: async function(data) {
            try {
                return await api.request('/suppliers', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al crear proveedor:', error);
                showNotification('Error al crear el proveedor', 'error');
                throw error;
            }
        },
        updateSupplier: async function(id, data) {
            try {
                return await api.request(`/suppliers/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al actualizar proveedor:', error);
                showNotification('Error al actualizar el proveedor', 'error');
                throw error;
            }
        },
        deleteSupplier: async function(id) {
            try {
                return await api.request(`/suppliers/${id}`, {
                    method: 'DELETE',
                });
            } catch (error) {
                console.error('Error al eliminar proveedor:', error);
                showNotification('Error al eliminar el proveedor', 'error');
                throw error;
            }
        }
    };

    // Métodos de renderizado
    const renderMethods = {
        renderSuppliers: function(suppliers) {
            const tableBody = htmlElements.suppliersTableBody;
            tableBody.innerHTML = '';

            if (suppliers.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No hay proveedores registrados
                    </td>
                `;
                tableBody.appendChild(row);
                return;
            }

            suppliers.forEach(supplier => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.dataset.supplierId = supplier.id;

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 supplier-company">${supplier.company}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 supplier-contact">${supplier.contact}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 supplier-phone">${supplier.phone || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 supplier-products">${supplier.products || 0}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button id="viewSupplierBtn" class="text-blue-600 hover:text-blue-900"><i class="fas fa-eye"></i></button>
                            <button id="editSupplierBtn" class="text-orange-600 hover:text-orange-900"><i class="fas fa-edit"></i></button>
                            <button id="deleteSupplierBtn" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
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
                    document.getElementById('page-title').innerText = 'Proveedores';
                }),
                window.loadPartial('sidebar-container', './partials/aside.html', () => {
                    window.setActiveLink('suppliers.html');
                })
            ]);
        }
    };

    // Métodos generales
    const methods = {
        initHtmlElements: function() {
            htmlElements = {
                suppliersTableBody: document.getElementById('suppliersTableBody'),
                newSupplierBtn: document.getElementById('newSupplierBtn'),
                supplierModal: document.getElementById('supplierModal'),
                supplierForm: document.getElementById('supplierForm'),
                supplierModalTitle: document.getElementById('supplierModalTitle'),
                closeModalBtn: document.getElementById('closeModalBtn'),
                cancelSupplierBtn: document.getElementById('cancelSupplierBtn')
            };
        },
        openModal: function() {
            htmlElements.supplierModal.classList.remove('hidden');
        },
        closeModal: function() {
            htmlElements.supplierModal.classList.add('hidden');
            htmlElements.supplierForm.reset();
            currentSupplier = null;
        },
        loadInitialData: async function() {
            window.showLoading();
            try {
                const suppliers = await apiMethods.getSuppliers();
                renderMethods.renderSuppliers(suppliers);
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
        handleCreateSupplier: async function(event) {
            event.preventDefault();
            window.showLoading();

            try {
                const formData = new FormData(htmlElements.supplierForm);
                const supplierData = {
                    company: formData.get('company'),
                    contact: formData.get('contact'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    address: formData.get('address'),
                    city: formData.get('city'),
                    postalCode: formData.get('postalCode'),
                    country: formData.get('country'),
                    notes: formData.get('notes')
                };

                if (currentSupplier) {
                    // Actualizar proveedor existente
                    await apiMethods.updateSupplier(currentSupplier.id, supplierData);
                    window.showNotification('Proveedor actualizado correctamente');
                } else {
                    // Crear nuevo proveedor
                    await apiMethods.createSupplier(supplierData);
                    window.showNotification('Proveedor creado correctamente');
                }

                methods.closeModal();
                await methods.loadInitialData();
            } catch (error) {
                console.error('Error al guardar proveedor:', error);
            } finally {
                window.hideLoading();
            }
        },
        handleShowEditSupplierModal: function(supplierId) {
            const row = document.querySelector(`tr[data-supplier-id="${supplierId}"]`);
            if (!row) return;

            currentSupplier = {
                id: supplierId,
                company: row.querySelector('.supplier-company').textContent,
                contact: row.querySelector('.supplier-contact').textContent,
                phone: row.querySelector('.supplier-phone').textContent,
                products: row.querySelector('.supplier-products').textContent
            };

            // Llenar el formulario con los datos del proveedor
            document.getElementById('supplierCompany').value = currentSupplier.company;
            document.getElementById('supplierContact').value = currentSupplier.contact;
            document.getElementById('supplierPhone').value = currentSupplier.phone !== 'N/A' ? currentSupplier.phone : '';
            
            // Si hay campos adicionales en el formulario, también los llenamos
            const emailField = document.getElementById('supplierEmail');
            if (emailField && currentSupplier.email) emailField.value = currentSupplier.email;
            
            const addressField = document.getElementById('supplierAddress');
            if (addressField && currentSupplier.address) addressField.value = currentSupplier.address;
            
            const cityField = document.getElementById('supplierCity');
            if (cityField && currentSupplier.city) cityField.value = currentSupplier.city;
            
            const postalCodeField = document.getElementById('supplierPostalCode');
            if (postalCodeField && currentSupplier.postalCode) postalCodeField.value = currentSupplier.postalCode;
            
            const countryField = document.getElementById('supplierCountry');
            if (countryField && currentSupplier.country) countryField.value = currentSupplier.country;
            
            const notesField = document.getElementById('supplierNotes');
            if (notesField && currentSupplier.notes) notesField.value = currentSupplier.notes;

            // Cambiar el título del modal
            htmlElements.supplierModalTitle.textContent = 'Editar Proveedor';

            // Mostrar el modal
            methods.openModal();
        },
        handleViewSupplierDetails: function(supplierId) {
            // Implementación para ver detalles del proveedor
            // Podría abrir un modal diferente o redirigir a una página de detalles
            console.log('Ver detalles del proveedor:', supplierId);
            window.showNotification('Funcionalidad de ver detalles en desarrollo');
        },
        handleDeleteSupplier: async function(supplierId) {
            const confirmed = await window.showConfirmDialog('¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer.');
            if (!confirmed) return;
            
            window.showLoading();
            try {
                await apiMethods.deleteSupplier(supplierId);
                window.showNotification('Proveedor eliminado correctamente');
                await methods.loadInitialData();
            } catch (error) {
                console.error('Error al eliminar proveedor:', error);
            } finally {
                window.hideLoading();
            }
        },
        handleShowNewSupplierModal: function() {
            currentSupplier = null;
            htmlElements.supplierForm.reset();
            htmlElements.supplierModalTitle.textContent = 'Nuevo Proveedor';
            methods.openModal();
        },
        handleEventListeners: function() {
            // Botón para mostrar el modal de nuevo proveedor
            if (htmlElements.newSupplierBtn) {
                htmlElements.newSupplierBtn.addEventListener('click', this.handleShowNewSupplierModal);
            }

            // Formulario de proveedor
            if (htmlElements.supplierForm) {
                htmlElements.supplierForm.addEventListener('submit', this.handleCreateSupplier);
            }

            // Botones para cerrar el modal
            if (htmlElements.closeModalBtn) {
                htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
            }

            if (htmlElements.cancelSupplierBtn) {
                htmlElements.cancelSupplierBtn.addEventListener('click', methods.closeModal);
            }

            // Delegación de eventos para botones de ver, editar y eliminar
            if (htmlElements.suppliersTableBody) {
                htmlElements.suppliersTableBody.addEventListener('click', (event) => {
                    const target = event.target.closest('button');
                    if (!target) return;

                    const row = target.closest('tr');
                    const supplierId = row.dataset.supplierId;

                    if (target.id === 'viewSupplierBtn' || target.closest('#viewSupplierBtn')) {
                        this.handleViewSupplierDetails(supplierId);
                    } else if (target.id === 'editSupplierBtn' || target.closest('#editSupplierBtn')) {
                        this.handleShowEditSupplierModal(supplierId);
                    } else if (target.id === 'deleteSupplierBtn' || target.closest('#deleteSupplierBtn')) {
                        this.handleDeleteSupplier(supplierId);
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