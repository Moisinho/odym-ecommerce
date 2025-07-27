// Módulo para la gestión de facturas
const App = (function() {
    // Variables privadas
    let api;
    let htmlElements = {};
    let currentBill = null;
    let filters = {
        status: 'all',
        period: 'month',
        search: ''
    };

    // Métodos de API
    const apiMethods = {
        getBills: async function(filterParams = {}) {
            try {
                // Construir query string con los filtros
                const queryParams = new URLSearchParams();
                if (filterParams.status && filterParams.status !== 'all') {
                    queryParams.append('status', filterParams.status);
                }
                if (filterParams.period) {
                    queryParams.append('period', filterParams.period);
                }
                if (filterParams.search) {
                    queryParams.append('search', filterParams.search);
                }

                const queryString = queryParams.toString();
                const url = queryString ? `/bills?${queryString}` : '/bills';
                
                return await api.request(url);
            } catch (error) {
                console.error('Error al obtener facturas:', error);
                showNotification('Error al cargar las facturas', 'error');
                return [];
            }
        },
        createBill: async function(data) {
            try {
                return await api.request('/bills', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al crear factura:', error);
                showNotification('Error al crear la factura', 'error');
                throw error;
            }
        },
        updateBill: async function(id, data) {
            try {
                return await api.request(`/bills/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
            } catch (error) {
                console.error('Error al actualizar factura:', error);
                showNotification('Error al actualizar la factura', 'error');
                throw error;
            }
        },
        deleteBill: async function(id) {
            try {
                return await api.request(`/bills/${id}`, {
                    method: 'DELETE',
                });
            } catch (error) {
                console.error('Error al eliminar factura:', error);
                showNotification('Error al eliminar la factura', 'error');
                throw error;
            }
        },
        getClients: async function() {
            try {
                return await api.request('/clients');
            } catch (error) {
                console.error('Error al obtener clientes:', error);
                showNotification('Error al cargar los clientes', 'error');
                return [];
            }
        },
        getProducts: async function() {
            try {
                return await api.request('/products');
            } catch (error) {
                console.error('Error al obtener productos:', error);
                showNotification('Error al cargar los productos', 'error');
                return [];
            }
        }
    };

    // Métodos de renderizado
    const renderMethods = {
        renderBills: function(bills) {
            const tableBody = htmlElements.billsTableBody;
            tableBody.innerHTML = '';

            if (bills.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        No hay facturas que coincidan con los criterios de búsqueda
                    </td>
                `;
                tableBody.appendChild(row);
                return;
            }

            bills.forEach(bill => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.dataset.billId = bill.id;

                // Determinar la clase de estado según el valor
                let statusClass = '';
                switch (bill.status.toLowerCase()) {
                    case 'pagada':
                        statusClass = 'bg-green-100 text-green-800';
                        break;
                    case 'pendiente':
                        statusClass = 'bg-yellow-100 text-yellow-800';
                        break;
                    case 'vencida':
                        statusClass = 'bg-red-100 text-red-800';
                        break;
                    case 'cancelada':
                        statusClass = 'bg-gray-100 text-gray-800';
                        break;
                    default:
                        statusClass = 'bg-blue-100 text-blue-800';
                }

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" class="rounded border-gray-300 bill-checkbox" data-bill-id="${bill.id}">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900 bill-number">${bill.number}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 bill-client-name">${bill.client.name}</div>
                        <div class="text-sm text-gray-500 bill-client-email">${bill.client.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 bill-date">
                        ${new Date(bill.date).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bill-amount">
                        ${formatCurrency(bill.amount)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap bill-status">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                            ${bill.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button id="viewBillBtn" class="text-blue-600 hover:text-blue-900">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button id="editBillBtn" class="text-orange-600 hover:text-orange-900">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button id="downloadBillBtn" class="text-green-600 hover:text-green-900">
                                <i class="fas fa-download"></i>
                            </button>
                            <button id="deleteBillBtn" class="text-red-600 hover:text-red-900">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;

                tableBody.appendChild(row);
            });
        },
        renderClientOptions: function(clients) {
            const clientSelect = document.getElementById('billClient');
            if (!clientSelect) return;

            clientSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
            
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
        },
        renderProductOptions: function(products) {
            const productSelect = document.getElementById('productSelect');
            if (!productSelect) return;

            productSelect.innerHTML = '<option value="">Seleccionar producto</option>';
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} - ${formatCurrency(product.price)}`;
                option.dataset.price = product.price;
                productSelect.appendChild(option);
            });
        },
        renderBillItems: function(items = []) {
            const itemsContainer = document.getElementById('billItemsContainer');
            if (!itemsContainer) return;

            itemsContainer.innerHTML = '';
            
            if (items.length === 0) {
                itemsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No hay items en esta factura</p>';
                return;
            }

            items.forEach((item, index) => {
                const itemRow = document.createElement('div');
                itemRow.className = 'flex items-center space-x-2 p-2 border-b';
                itemRow.dataset.itemIndex = index;

                itemRow.innerHTML = `
                    <div class="flex-1">
                        <p class="font-medium">${item.product.name}</p>
                        <p class="text-sm text-gray-500">${item.quantity} x ${formatCurrency(item.price)}</p>
                    </div>
                    <div class="text-right font-medium">
                        ${formatCurrency(item.quantity * item.price)}
                    </div>
                    <button type="button" class="remove-item-btn text-red-500 hover:text-red-700">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                itemsContainer.appendChild(itemRow);
            });

            // Actualizar el total
            this.updateBillTotal(items);
        },
        updateBillTotal: function(items = []) {
            const totalElement = document.getElementById('billTotal');
            if (!totalElement) return;

            const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            totalElement.textContent = formatCurrency(total);
        },
        updatePagination: function(currentPage, totalPages, totalItems) {
            const paginationContainer = document.getElementById('paginationContainer');
            if (!paginationContainer) return;

            const itemsPerPage = 10; // Asumiendo 10 items por página
            const startItem = (currentPage - 1) * itemsPerPage + 1;
            const endItem = Math.min(currentPage * itemsPerPage, totalItems);

            // Actualizar texto de información de paginación
            const paginationInfo = paginationContainer.querySelector('.pagination-info');
            if (paginationInfo) {
                paginationInfo.innerHTML = `
                    Mostrando <span class="font-medium">${startItem}</span> a 
                    <span class="font-medium">${endItem}</span> de 
                    <span class="font-medium">${totalItems}</span> resultados
                `;
            }

            // Actualizar botones de paginación
            const paginationButtons = paginationContainer.querySelector('.pagination-buttons');
            if (paginationButtons) {
                paginationButtons.innerHTML = '';

                // Botón Anterior
                const prevButton = document.createElement('button');
                prevButton.className = `px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
                prevButton.textContent = 'Anterior';
                prevButton.disabled = currentPage === 1;
                prevButton.addEventListener('click', () => {
                    if (currentPage > 1) {
                        this.handlePageChange(currentPage - 1);
                    }
                });
                paginationButtons.appendChild(prevButton);

                // Botones de número de página
                const maxPageButtons = 3; // Mostrar máximo 3 botones de página
                const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
                const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

                for (let i = startPage; i <= endPage; i++) {
                    const pageButton = document.createElement('button');
                    pageButton.className = `px-3 py-1 rounded-md text-sm ${i === currentPage ? 'bg-orange-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`;
                    pageButton.textContent = i.toString();
                    pageButton.addEventListener('click', () => {
                        this.handlePageChange(i);
                    });
                    paginationButtons.appendChild(pageButton);
                }

                // Botón Siguiente
                const nextButton = document.createElement('button');
                nextButton.className = `px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`;
                nextButton.textContent = 'Siguiente';
                nextButton.disabled = currentPage === totalPages;
                nextButton.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        this.handlePageChange(currentPage + 1);
                    }
                });
                paginationButtons.appendChild(nextButton);
            }
        },
        handlePageChange: function(page) {
            // Implementar la lógica para cambiar de página
            console.log('Cambiar a página:', page);
            // Aquí se podría actualizar una variable de estado y volver a cargar los datos
        }
    };

    // Métodos de layout
    const layoutMethods = {
        loadAll: function() {
            window.loadPartial('header-container', './partials/header.html', () => {
                document.getElementById('page-title').innerText = 'Facturas';
            });
            window.loadPartial('sidebar-container', './partials/aside.html', () => {
                window.setActiveLink('bills.html');
            });
        }
    };

    // Métodos generales
    const methods = {
        initHtmlElements: function() {
            htmlElements = {
                billsTableBody: document.getElementById('billsTableBody'),
                newBillBtn: document.getElementById('newBillBtn'),
                exportBillsBtn: document.getElementById('exportBillsBtn'),
                searchInput: document.getElementById('searchInput'),
                statusFilter: document.getElementById('statusFilter'),
                periodFilter: document.getElementById('periodFilter'),
                billModal: document.getElementById('billModal'),
                billForm: document.getElementById('billForm'),
                billModalTitle: document.getElementById('billModalTitle'),
                closeModalBtn: document.getElementById('closeModalBtn'),
                cancelBillBtn: document.getElementById('cancelBillBtn'),
                addItemBtn: document.getElementById('addItemBtn'),
                selectAllCheckbox: document.getElementById('selectAllCheckbox'),
                paginationContainer: document.getElementById('paginationContainer')
            };
        },
        openModal: function() {
            htmlElements.billModal.classList.remove('hidden');
        },
        closeModal: function() {
            htmlElements.billModal.classList.add('hidden');
            htmlElements.billForm.reset();
            currentBill = null;
            // Limpiar los items de la factura
            const itemsContainer = document.getElementById('billItemsContainer');
            if (itemsContainer) itemsContainer.innerHTML = '';
        },
        loadInitialData: async function() {
            showLoading();
            try {
                const bills = await apiMethods.getBills(filters);
                renderMethods.renderBills(bills);
                
                // Cargar clientes y productos para el formulario
                const clients = await apiMethods.getClients();
                renderMethods.renderClientOptions(clients);
                
                const products = await apiMethods.getProducts();
                renderMethods.renderProductOptions(products);
                
                // Configurar paginación (ejemplo con valores fijos)
                renderMethods.updatePagination(1, 10, 97);
            } catch (error) {
                console.error('Error cargando datos iniciales:', error);
            } finally {
                hideLoading();
            }
        },
        exportToCSV: function() {
            showLoading();
            try {
                // Obtener los datos de la tabla
                const rows = Array.from(htmlElements.billsTableBody.querySelectorAll('tr'));
                const data = rows.map(row => {
                    const billId = row.dataset.billId;
                    if (!billId) return null; // Saltar filas sin ID (como mensajes de "no hay datos")
                    
                    return {
                        id: billId,
                        number: row.querySelector('.bill-number')?.textContent || '',
                        clientName: row.querySelector('.bill-client-name')?.textContent || '',
                        clientEmail: row.querySelector('.bill-client-email')?.textContent || '',
                        date: row.querySelector('.bill-date')?.textContent || '',
                        amount: row.querySelector('.bill-amount')?.textContent || '',
                        status: row.querySelector('.bill-status span')?.textContent.trim() || ''
                    };
                }).filter(Boolean); // Eliminar filas nulas
                
                if (data.length === 0) {
                    showNotification('No hay datos para exportar', 'info');
                    return;
                }
                
                // Crear CSV
                const headers = ['ID', 'Número', 'Cliente', 'Email', 'Fecha', 'Monto', 'Estado'];
                const csvContent = [
                    headers.join(','),
                    ...data.map(item => [
                        item.id,
                        item.number,
                        `"${item.clientName}"`, // Usar comillas para manejar comas en nombres
                        `"${item.clientEmail}"`,
                        item.date,
                        item.amount,
                        item.status
                    ].join(','))
                ].join('\n');
                
                // Crear blob y descargar
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `facturas_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showNotification('Exportación completada con éxito');
            } catch (error) {
                console.error('Error exportando datos:', error);
                showNotification('Error al exportar datos', 'error');
            } finally {
                hideLoading();
            }
        },
        calculateBillTotal: function(items) {
            return items.reduce((total, item) => total + (item.quantity * item.price), 0);
        },
        init: function() {
            api = new window.ApiClient();
            this.initHtmlElements();
            layoutMethods.loadAll();
            this.loadInitialData();
            handlers.handleEventListeners();
        }
    };

    // Manejadores de eventos
    const handlers = {
        handleCreateBill: async function(event) {
            event.preventDefault();
            showLoading();

            try {
                const formData = new FormData(htmlElements.billForm);
                const billItems = this.getBillItemsFromForm();
                
                if (billItems.length === 0) {
                    showNotification('Debe agregar al menos un item a la factura', 'error');
                    hideLoading();
                    return;
                }
                
                const billData = {
                    clientId: formData.get('client'),
                    date: formData.get('date'),
                    dueDate: formData.get('dueDate'),
                    status: formData.get('status'),
                    notes: formData.get('notes'),
                    items: billItems,
                    amount: methods.calculateBillTotal(billItems)
                };

                if (currentBill) {
                    // Actualizar factura existente
                    await apiMethods.updateBill(currentBill.id, billData);
                    showNotification('Factura actualizada correctamente');
                } else {
                    // Crear nueva factura
                    await apiMethods.createBill(billData);
                    showNotification('Factura creada correctamente');
                }

                methods.closeModal();
                await methods.loadInitialData();
            } catch (error) {
                console.error('Error al guardar factura:', error);
            } finally {
                hideLoading();
            }
        },
        getBillItemsFromForm: function() {
            // Esta función debería recopilar los items de la factura desde el formulario
            // En una implementación real, estos items se almacenarían en el estado del componente
            // o se obtendrían de los elementos del DOM
            
            // Ejemplo simplificado:
            const itemsContainer = document.getElementById('billItemsContainer');
            const itemRows = itemsContainer.querySelectorAll('[data-item-index]');
            
            const items = [];
            itemRows.forEach(row => {
                const index = parseInt(row.dataset.itemIndex);
                // En una implementación real, estos datos vendrían del estado o del DOM
                items.push({
                    productId: currentBill?.items[index]?.productId || 'temp-id-' + index,
                    product: {
                        id: currentBill?.items[index]?.product?.id || 'temp-id-' + index,
                        name: row.querySelector('.font-medium').textContent
                    },
                    quantity: parseInt(row.querySelector('.text-sm').textContent.split('x')[0].trim()),
                    price: parseFloat(row.querySelector('.text-sm').textContent.split('x')[1].trim().replace(/[^0-9.-]+/g, ''))
                });
            });
            
            return items;
        },
        handleAddItem: function() {
            const productSelect = document.getElementById('productSelect');
            const quantityInput = document.getElementById('itemQuantity');
            
            const productId = productSelect.value;
            const quantity = parseInt(quantityInput.value);
            
            if (!productId || isNaN(quantity) || quantity <= 0) {
                showNotification('Seleccione un producto y una cantidad válida', 'error');
                return;
            }
            
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            const productName = selectedOption.textContent.split('-')[0].trim();
            const price = parseFloat(selectedOption.dataset.price);
            
            // Agregar el item a la lista (en una implementación real, esto actualizaría el estado)
            const items = this.getBillItemsFromForm();
            items.push({
                productId,
                product: {
                    id: productId,
                    name: productName
                },
                quantity,
                price
            });
            
            // Renderizar los items actualizados
            renderMethods.renderBillItems(items);
            
            // Limpiar los campos
            productSelect.value = '';
            quantityInput.value = '1';
        },
        handleRemoveItem: function(index) {
            // Eliminar el item de la lista (en una implementación real, esto actualizaría el estado)
            const items = this.getBillItemsFromForm();
            items.splice(index, 1);
            
            // Renderizar los items actualizados
            renderMethods.renderBillItems(items);
        },
        handleShowEditBillModal: function(billId) {
            const row = document.querySelector(`tr[data-bill-id="${billId}"]`);
            if (!row) return;

            // En una implementación real, se haría una petición al servidor para obtener los detalles completos
            currentBill = {
                id: billId,
                number: row.querySelector('.bill-number').textContent,
                client: {
                    name: row.querySelector('.bill-client-name').textContent,
                    email: row.querySelector('.bill-client-email').textContent
                },
                date: row.querySelector('.bill-date').textContent,
                amount: row.querySelector('.bill-amount').textContent,
                status: row.querySelector('.bill-status span').textContent.trim(),
                // Estos datos serían obtenidos del servidor en una implementación real
                items: [],
                notes: ''
            };

            // Llenar el formulario con los datos de la factura
            htmlElements.billModalTitle.textContent = 'Editar Factura';
            
            // En una implementación real, se llenarían todos los campos del formulario
            // y se cargarían los items de la factura
            
            // Mostrar el modal
            methods.openModal();
            
            // Notificar que esta funcionalidad está en desarrollo
            showNotification('Funcionalidad de edición en desarrollo', 'info');
        },
        handleViewBillDetails: function(billId) {
            // Implementación para ver detalles de la factura
            console.log('Ver detalles de la factura:', billId);
            showNotification('Funcionalidad de ver detalles en desarrollo', 'info');
        },
        handleDownloadBill: function(billId) {
            // Implementación para descargar la factura
            console.log('Descargar factura:', billId);
            showNotification('Funcionalidad de descarga en desarrollo', 'info');
        },
        handleDeleteBill: function(billId) {
            window.showConfirmDialog('¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.', async () => {
                showLoading();
                try {
                    await apiMethods.deleteBill(billId);
                    showNotification('Factura eliminada correctamente');
                    await methods.loadInitialData();
                } catch (error) {
                    console.error('Error al eliminar factura:', error);
                } finally {
                    hideLoading();
                }
            });
        },
        handleShowNewBillModal: function() {
            currentBill = null;
            htmlElements.billForm.reset();
            htmlElements.billModalTitle.textContent = 'Nueva Factura';
            
            // Limpiar los items
            renderMethods.renderBillItems([]);
            
            // Establecer la fecha actual como predeterminada
            const dateInput = document.getElementById('billDate');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }
            
            methods.openModal();
        },
        handleSearch: function() {
            const searchValue = htmlElements.searchInput.value.trim();
            filters.search = searchValue;
            methods.loadInitialData();
        },
        handleFilterChange: function() {
            filters.status = htmlElements.statusFilter.value;
            filters.period = htmlElements.periodFilter.value;
            methods.loadInitialData();
        },
        handleSelectAll: function(event) {
            const isChecked = event.target.checked;
            const checkboxes = htmlElements.billsTableBody.querySelectorAll('.bill-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        },
        handleEventListeners: function() {
            // Botón para mostrar el modal de nueva factura
            if (htmlElements.newBillBtn) {
                htmlElements.newBillBtn.addEventListener('click', this.handleShowNewBillModal);
            }

            // Botón para exportar facturas
            if (htmlElements.exportBillsBtn) {
                htmlElements.exportBillsBtn.addEventListener('click', methods.exportToCSV);
            }

            // Formulario de factura
            if (htmlElements.billForm) {
                htmlElements.billForm.addEventListener('submit', this.handleCreateBill.bind(this));
            }

            // Botones para cerrar el modal
            if (htmlElements.closeModalBtn) {
                htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
            }

            if (htmlElements.cancelBillBtn) {
                htmlElements.cancelBillBtn.addEventListener('click', methods.closeModal);
            }

            // Botón para agregar item
            if (htmlElements.addItemBtn) {
                htmlElements.addItemBtn.addEventListener('click', this.handleAddItem.bind(this));
            }

            // Delegación de eventos para botones de eliminar item
            const itemsContainer = document.getElementById('billItemsContainer');
            if (itemsContainer) {
                itemsContainer.addEventListener('click', (event) => {
                    const removeBtn = event.target.closest('.remove-item-btn');
                    if (!removeBtn) return;

                    const itemRow = removeBtn.closest('[data-item-index]');
                    const itemIndex = parseInt(itemRow.dataset.itemIndex);
                    this.handleRemoveItem(itemIndex);
                });
            }

            // Filtros y búsqueda
            if (htmlElements.searchInput) {
                htmlElements.searchInput.addEventListener('keyup', (event) => {
                    if (event.key === 'Enter') {
                        this.handleSearch();
                    }
                });
            }

            if (htmlElements.statusFilter) {
                htmlElements.statusFilter.addEventListener('change', this.handleFilterChange);
            }

            if (htmlElements.periodFilter) {
                htmlElements.periodFilter.addEventListener('change', this.handleFilterChange);
            }

            // Checkbox para seleccionar todos
            if (htmlElements.selectAllCheckbox) {
                htmlElements.selectAllCheckbox.addEventListener('change', this.handleSelectAll);
            }

            // Delegación de eventos para botones de ver, editar, descargar y eliminar
            if (htmlElements.billsTableBody) {
                htmlElements.billsTableBody.addEventListener('click', (event) => {
                    const target = event.target.closest('button');
                    if (!target) return;

                    const row = target.closest('tr');
                    const billId = row.dataset.billId;

                    if (target.id === 'viewBillBtn' || target.closest('#viewBillBtn')) {
                        this.handleViewBillDetails(billId);
                    } else if (target.id === 'editBillBtn' || target.closest('#editBillBtn')) {
                        this.handleShowEditBillModal(billId);
                    } else if (target.id === 'downloadBillBtn' || target.closest('#downloadBillBtn')) {
                        this.handleDownloadBill(billId);
                    } else if (target.id === 'deleteBillBtn' || target.closest('#deleteBillBtn')) {
                        this.handleDeleteBill(billId);
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