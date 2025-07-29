// Variables globales
let orders = [];
let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 10;

// La inicialización ahora se maneja desde el HTML inline script
// Esta función se llama desde el script inline después de verificar la autenticación

// Cargar pedidos desde el backend
async function loadOrders(page = 1, filters = {}) {
    try {
        console.log('📦 Cargando pedidos...', { page, filters });
        showLoading(true);
        
        let url = `http://localhost:3000/api/orders?page=${page}&limit=${itemsPerPage}`;
        
        // Agregar filtros
        if (filters.status) url += `&status=${filters.status}`;
        if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
        if (filters.date) url += `&date=${filters.date}`;
        
        console.log('🌐 Haciendo petición a:', url);
        
        const response = await fetch(url);
        console.log('📡 Respuesta recibida:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Datos recibidos:', data);
        
        if (data.success) {
            orders = data.orders || [];
            currentPage = data.pagination?.currentPage || 1;
            totalPages = data.pagination?.totalPages || 1;
            
            console.log('✅ Pedidos cargados:', orders.length);
            
            renderOrdersTable();
            updatePagination();
            updateShowingInfo(data.pagination || { showingFrom: 0, showingTo: 0, totalItems: 0 });
        } else {
            throw new Error(data.error || 'Error al cargar pedidos');
        }
    } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        showNotification('Error al cargar pedidos: ' + error.message, 'error');
        
        // Mostrar tabla vacía en caso de error
        orders = [];
        renderOrdersTable();
    } finally {
        showLoading(false);
    }
}

// Renderizar tabla de pedidos
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-shopping-cart text-4xl mb-4 text-gray-300"></i>
                    <p class="text-lg">No hay pedidos registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = createOrderRow(order);
        tbody.appendChild(row);
    });
}

// Crear fila de pedido
function createOrderRow(order) {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50';
    
    const customerName = order.userId?.name || 'Cliente Invitado';
    const customerEmail = order.userId?.email || 'N/A';
    const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
    
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">#${order._id.slice(-8)}</div>
            <div class="text-sm text-gray-500">${order._id}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${customerName}</div>
            <div class="text-sm text-gray-500">${customerEmail}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${itemCount} producto${itemCount !== 1 ? 's' : ''}</div>
            <button onclick="showOrderDetails('${order._id}')" class="text-orange-600 hover:text-orange-800 text-xs">
                Ver detalles
            </button>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            $${order.totalAmount.toFixed(2)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}">
                ${getStatusText(order.status)}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${new Date(order.createdAt).toLocaleDateString('es-ES')}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <div class="flex space-x-2">
                <button onclick="showOrderDetails('${order._id}')" 
                        class="text-blue-600 hover:text-blue-900">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="updateOrderStatus('${order._id}', '${order.status}')" 
                        class="text-green-600 hover:text-green-900">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </td>
    `;
    
    return tr;
}

// Obtener clase CSS según estado
function getStatusClass(status) {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'processing': 'bg-blue-100 text-blue-800',
        'shipped': 'bg-purple-100 text-purple-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

// Obtener texto del estado
function getStatusText(status) {
    const texts = {
        'pending': 'Pendiente',
        'processing': 'Procesando',
        'shipped': 'Enviado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };
    return texts[status] || status;
}

// Mostrar detalles del pedido
async function showOrderDetails(orderId) {
    try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}`);
        const data = await response.json();
        
        if (data.success) {
            const order = data.order;
            renderOrderDetails(order);
            const modal = document.getElementById('orderDetailsModal');
            modal.classList.remove('hidden');
            
            // Agregar event listener para cerrar al hacer clic fuera
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeOrderDetailsModal();
                }
            });
        } else {
            throw new Error(data.error || 'Error al cargar detalles');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar detalles del pedido', 'error');
    }
}

// Renderizar detalles del pedido en el modal
function renderOrderDetails(order) {
    const content = document.getElementById('orderDetailsContent');
    
    const customerName = order.userId?.name || 'Cliente Invitado';
    const customerEmail = order.userId?.email || 'N/A';
    const customerPhone = order.userId?.phone || 'N/A';
    const customerAddress = order.userId?.address || order.shippingAddress || 'No especificada';
    
    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <h4 class="font-semibold text-gray-900 mb-2">Información del Cliente</h4>
                <div class="space-y-2 text-sm">
                    <p><strong>Nombre:</strong> ${customerName}</p>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Teléfono:</strong> ${customerPhone}</p>
                    <p><strong>Dirección:</strong> ${order.shippingAddress || 'No especificada'}</p>
                </div>
            </div>
            <div>
                <h4 class="font-semibold text-gray-900 mb-2">Información del Pedido</h4>
                <div class="space-y-2 text-sm">
                    <p><strong>Número:</strong> #${order._id.slice(-8)}</p>
                    <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleDateString('es-ES')}</p>
                    <p><strong>Estado:</strong> <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></p>
                    <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
                </div>
            </div>
        </div>
        
        <div>
            <h4 class="font-semibold text-gray-900 mb-3">Productos</h4>
            <div class="space-y-3">
                ${order.items.map(item => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div class="flex items-center">
                            <img src="${item.productId.images?.[0] || '/assets/img/placeholder-product.png'}" 
                                 alt="${item.productId.name}" 
                                 class="w-12 h-12 object-cover rounded mr-3">
                            <div>
                                <p class="font-medium">${item.productId.name}</p>
                                <p class="text-sm text-gray-600">Cantidad: ${item.quantity}</p>
                                <p class="text-sm text-gray-600">Precio: $${item.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold">$${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="mt-6 pt-4 border-t">
            <div class="flex justify-between items-center">
                <h4 class="font-semibold text-gray-900">Total del Pedido</h4>
                <p class="text-xl font-bold text-orange-600">$${order.totalAmount.toFixed(2)}</p>
            </div>
        </div>
        
        <div class="mt-6 flex justify-end space-x-3">
            <button onclick="closeOrderDetailsModal()" 
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cerrar
            </button>
            <button onclick="updateOrderStatus('${order._id}', '${order.status}')" 
                    class="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
                Actualizar Estado
            </button>
        </div>
    `;
}

// Actualizar estado del pedido
function updateOrderStatus(orderId, currentStatus) {
    const statuses = [
        { value: 'pending', text: 'Pendiente' },
        { value: 'processing', text: 'Procesando' },
        { value: 'shipped', text: 'Enviado' },
        { value: 'delivered', text: 'Entregado' },
        { value: 'cancelled', text: 'Cancelado' }
    ];
    
    const modal = document.createElement('div');
    modal.id = 'statusUpdateModal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    modal.innerHTML = `
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Actualizar Estado del Pedido</h3>
                    <div class="space-y-3">
                        ${statuses.map(status => `
                            <label class="flex items-center">
                                <input type="radio" name="orderStatus" value="${status.value}" 
                                       ${status.value === currentStatus ? 'checked' : ''}
                                       class="mr-2">
                                <span>${status.text}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="mt-6 flex justify-end space-x-3">
                        <button onclick="closeStatusModal()" 
                                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button onclick="confirmStatusUpdate('${orderId}')" 
                                class="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700">
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeStatusModal();
        }
    });
    
    document.body.appendChild(modal);
}

// Confirmar actualización de estado
async function confirmStatusUpdate(orderId) {
    const selectedStatus = document.querySelector('input[name="orderStatus"]:checked')?.value;
    
    if (!selectedStatus) {
        showNotification('Por favor selecciona un estado', 'error');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: selectedStatus })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Estado actualizado correctamente', 'success');
            loadOrders(currentPage);
            closeStatusModal();
            closeOrderDetailsModal();
        } else {
            throw new Error(data.error || 'Error al actualizar estado');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al actualizar estado: ' + error.message, 'error');
    }
}

// Cerrar modal de actualización de estado
function closeStatusModal() {
    const modal = document.getElementById('statusUpdateModal');
    if (modal) {
        modal.remove();
    }
}

// Cerrar modal de detalles
function closeOrderDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Filtros
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') applyFilters();
    });
    
    // Paginación
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
    document.getElementById('prevPageMobile').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPageMobile').addEventListener('click', () => changePage(1));
    
    // Cerrar modales con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeOrderDetailsModal();
            closeStatusModal();
        }
    });
}

// Aplicar filtros
function applyFilters() {
    const filters = {
        status: document.getElementById('statusFilter').value,
        date: document.getElementById('dateFilter').value,
        search: document.getElementById('searchInput').value.trim()
    };
    
    loadOrders(1, filters);
}

// Buscar pedidos
function searchOrders() {
    applyFilters();
}

// Cambiar página
function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        loadOrders(newPage);
    }
}

// Actualizar información de paginación
function updatePagination() {
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
    document.getElementById('prevPageMobile').disabled = currentPage <= 1;
    document.getElementById('nextPageMobile').disabled = currentPage >= totalPages;
    
    document.getElementById('paginationNumbers').textContent = `${currentPage} / ${totalPages}`;
}

// Actualizar información de mostrando
function updateShowingInfo(pagination) {
    document.getElementById('showingFrom').textContent = pagination.showingFrom;
    document.getElementById('showingTo').textContent = pagination.showingTo;
    document.getElementById('totalOrders').textContent = pagination.totalItems;
}

// Mostrar/ocultar loading
function showLoading(show) {
    const loading = document.getElementById('admin-loading');
    const dashboard = document.getElementById('admin-dashboard');
    
    if (show) {
        loading.style.display = 'flex';
        dashboard.style.display = 'none';
    } else {
        loading.style.display = 'none';
        dashboard.style.display = 'flex';
    }
}

// Notificación
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Las funciones de autenticación se manejan en admin-common.js
