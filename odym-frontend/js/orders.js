// orders.js - Para manejar la página de pedidos de usuario
let currentUser = null;
let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
const ordersPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación usando AuthService
    if (!window.AuthService || !window.AuthService.isAuthenticated()) {
        window.location.href = 'auth/login.html';
        return;
    }

    currentUser = window.AuthService.getUser();
    if (!currentUser) {
        window.location.href = 'auth/login.html';
        return;
    }

    // Cargar pedidos del usuario
    loadUserOrders();
    
    // Configurar eventos de filtros
    setupFilterEvents();
});

function setupFilterEvents() {
    const statusFilter = document.getElementById('statusFilter');
    const sortOrder = document.getElementById('sortOrder');
    
    statusFilter.addEventListener('change', applyFilters);
    sortOrder.addEventListener('change', applyFilters);
}

async function loadUserOrders() {
    try {
        const response = await fetch(`http://localhost:3000/api/orders/user/${currentUser._id}`);
        const data = await response.json();
        
        if (response.ok && data.orders) {
            allOrders = data.orders;
            filteredOrders = [...allOrders];
            applyFilters();
        } else {
            showNoOrders();
        }
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        showError('Error al cargar pedidos');
    }
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const sortOrder = document.getElementById('sortOrder').value;
    
    // Filtrar por estado
    filteredOrders = allOrders.filter(order => {
        if (!statusFilter) return true;
        return order.status === statusFilter;
    });
    
    // Ordenar
    filteredOrders.sort((a, b) => {
        switch (sortOrder) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'amount-high':
                return b.totalAmount - a.totalAmount;
            case 'amount-low':
                return a.totalAmount - b.totalAmount;
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
    
    currentPage = 1;
    displayOrders();
    displayPagination();
}

function displayOrders() {
    const container = document.getElementById('orders-container');
    
    if (filteredOrders.length === 0) {
        showNoOrders();
        return;
    }
    
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToShow = filteredOrders.slice(startIndex, endIndex);
    
    container.innerHTML = ordersToShow.map(order => createOrderCard(order)).join('');
}

function createOrderCard(order) {
    const canCancel = order.status === 'pending' || order.status === 'processing';
    
    return `
        <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                <div class="mb-4 md:mb-0">
                    <h3 class="text-lg font-semibold text-gray-800">
                        Pedido #${order._id.slice(-8)}
                    </h3>
                    <p class="text-sm text-gray-600">
                        ${new Date(order.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
                <div class="flex flex-col items-end">
                    <span class="px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(order.status)}">
                        ${getStatusText(order.status)}
                    </span>
                    <span class="text-xl font-bold text-orange-600 mt-2">
                        $${order.totalAmount.toFixed(2)}
                    </span>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-medium text-gray-800 mb-2">Productos (${order.items.length}):</h4>
                <div class="space-y-2 mb-4">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-700">
                                ${item.name} x${item.quantity}
                            </span>
                            <span class="font-medium">$${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    ${order.items.length > 3 ? `
                        <div class="text-sm text-gray-500">
                            ... y ${order.items.length - 3} producto(s) más
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex flex-wrap gap-2 justify-end">
                    <button onclick="viewOrderDetails('${order._id}')" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition duration-300">
                        Ver Detalles
                    </button>
                    ${canCancel ? `
                        <button onclick="cancelOrder('${order._id}')" 
                                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition duration-300">
                            Cancelar Pedido
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function displayPagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="flex space-x-2">';
    
    // Botón anterior
    if (currentPage > 1) {
        paginationHTML += `
            <button onclick="changePage(${currentPage - 1})" 
                    class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition duration-300">
                Anterior
            </button>
        `;
    }
    
    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `
                <button class="px-3 py-2 bg-orange-600 text-white rounded">
                    ${i}
                </button>
            `;
        } else {
            paginationHTML += `
                <button onclick="changePage(${i})" 
                        class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition duration-300">
                    ${i}
                </button>
            `;
        }
    }
    
    // Botón siguiente
    if (currentPage < totalPages) {
        paginationHTML += `
            <button onclick="changePage(${currentPage + 1})" 
                    class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded transition duration-300">
                Siguiente
            </button>
        `;
    }
    
    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    displayOrders();
    displayPagination();
    
    // Scroll hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getStatusColor(status) {
    const colors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'processing': 'bg-blue-100 text-blue-800',
        'shipped': 'bg-purple-100 text-purple-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

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

function showNoOrders() {
    const container = document.getElementById('orders-container');
    container.innerHTML = `
        <div class="text-center py-12">
            <div class="text-gray-400 mb-4">
                <svg class="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No tienes pedidos</h3>
            <p class="text-gray-500 mb-4">Cuando realices tu primera compra, aparecerá aquí.</p>
            <a href="products.html" 
               class="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                Explorar Productos
            </a>
        </div>
    `;
}

function showError(message) {
    const container = document.getElementById('orders-container');
    container.innerHTML = `
        <div class="text-center py-12">
            <div class="text-red-400 mb-4">
                <svg class="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p class="text-gray-500 mb-4">${message}</p>
            <button onclick="loadUserOrders()" 
                    class="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                Reintentar
            </button>
        </div>
    `;
}

function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o._id === orderId);
    if (!order) return;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-semibold">Detalles del Pedido #${order._id.slice(-8)}</h3>
                <button onclick="this.closest('.fixed').remove()" 
                        class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <div class="space-y-4">
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-medium text-gray-800 mb-2">Información del Pedido</h4>
                        <p class="text-sm text-gray-600">ID: ${order._id}</p>
                        <p class="text-sm text-gray-600">Fecha: ${new Date(order.createdAt).toLocaleString('es-ES')}</p>
                        <p class="text-sm text-gray-600">Estado: <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}">${getStatusText(order.status)}</span></p>
                        <p class="text-sm text-gray-600">Total: <span class="font-bold text-orange-600">$${order.totalAmount.toFixed(2)}</span></p>
                    </div>
                    
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-800 mb-2">Productos</h4>
                    <div class="space-y-2">
                        ${order.items.map(item => `
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <div class="flex items-center space-x-3">
                                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded">` : ''}
                                    <div>
                                        <p class="font-medium">${item.name}</p>
                                        <p class="text-sm text-gray-600">Cantidad: ${item.quantity}</p>
                                        <p class="text-sm text-gray-600">Precio unitario: $${item.price.toFixed(2)}</p>
                                    </div>
                                </div>
                                <span class="font-bold">$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

async function cancelOrder(orderId) {
    if (!confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}/cancel`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser._id
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Pedido cancelado exitosamente');
            // Recargar pedidos
            await loadUserOrders();
        } else {
            alert(data.error || 'Error al cancelar pedido');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cancelar pedido');
    }
}
