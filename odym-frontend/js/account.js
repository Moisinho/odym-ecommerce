// account.js - Para manejar la página de cuenta de usuario
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación usando AuthService
    if (!window.AuthService || !window.AuthService.isAuthenticated()) {
        window.location.href = 'auth/login.html';
        return;
    }

    const user = window.AuthService.getUser();
    if (!user) {
        window.location.href = 'auth/login.html';
        return;
    }

    // Mostrar información del usuario
    displayUserInfo(user);
    
    // Cargar pedidos del usuario
    loadUserOrders(user._id);
    
    // Configurar eventos
    setupEventListeners(user);
});

function displayUserInfo(user) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML = `
        <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-4">
                <h2 class="text-xl font-semibold text-gray-800 mb-4">Información Personal</h2>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input type="text" id="userName" value="${user.name || ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="userEmail" value="${user.email || ''}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <input type="text" value="${user.role || 'user'}" disabled
                           class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600">
                </div>
                <div class="flex space-x-3">
                    <button id="updateProfileBtn" class="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded">
                        Actualizar Perfil
                    </button>
                    <button id="changePasswordBtn" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Cambiar Contraseña
                    </button>
                </div>
            </div>
            <div>
                <h2 class="text-xl font-semibold text-gray-800 mb-4">Mis Pedidos</h2>
                <div id="user-orders" class="space-y-3">
                    <div class="text-gray-500">Cargando pedidos...</div>
                </div>
            </div>
        </div>
    `;
}

function setupEventListeners(user) {
    // Botón de logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (window.AuthService) {
            window.AuthService.logout();
        }
    });
    
    // Botón de actualizar perfil
    document.getElementById('updateProfileBtn').addEventListener('click', () => {
        updateUserProfile(user._id);
    });
    
    // Botón de cambiar contraseña
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        showChangePasswordModal(user._id);
    });
}

async function updateUserProfile(userId) {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    
    if (!name || !email) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/customers/profile/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Actualizar usuario en localStorage
            window.AuthService.setUser(data.customer);
            alert('Perfil actualizado exitosamente');
            
            // Actualizar evento de autenticación para refrescar header
            window.dispatchEvent(new Event('auth-change'));
        } else {
            alert(data.error || 'Error al actualizar perfil');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar perfil');
    }
}

function showChangePasswordModal(userId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                    <input type="password" id="currentPassword" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                    <input type="password" id="newPassword" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                    <input type="password" id="confirmPassword" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
                <button id="cancelPasswordChange" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
                <button id="confirmPasswordChange" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
                    Cambiar Contraseña
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners para el modal
    modal.querySelector('#cancelPasswordChange').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#confirmPasswordChange').addEventListener('click', async () => {
        const currentPassword = modal.querySelector('#currentPassword').value;
        const newPassword = modal.querySelector('#newPassword').value;
        const confirmPassword = modal.querySelector('#confirmPassword').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Por favor completa todos los campos');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/customers/change-password/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Contraseña cambiada exitosamente');
                document.body.removeChild(modal);
            } else {
                alert(data.error || 'Error al cambiar contraseña');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cambiar contraseña');
        }
    });
}

async function loadUserOrders(userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/orders/user/${userId}`);
        const data = await response.json();
        
        const ordersDiv = document.getElementById('user-orders');
        
        if (response.ok && data.orders && data.orders.length > 0) {
            ordersDiv.innerHTML = data.orders.map(order => `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="font-semibold">Pedido #${order._id.slice(-8)}</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}">
                                ${getStatusText(order.status)}
                            </span>
                        </div>
                        <span class="font-bold text-orange-600">$${order.totalAmount}</span>
                    </div>
                    <div class="text-sm text-gray-600">
                        <p>Fecha: ${new Date(order.createdAt).toLocaleDateString()}</p>
                        <p>Items: ${order.items.length} producto(s)</p>
                    </div>
                    ${order.status === 'pending' || order.status === 'processing' ? `
                        <button onclick="cancelOrder('${order._id}')" 
                                class="mt-2 text-red-600 hover:text-red-800 text-sm">
                            Cancelar Pedido
                        </button>
                    ` : ''}
                </div>
            `).join('');
        } else {
            ordersDiv.innerHTML = '<div class="text-gray-500">No tienes pedidos aún</div>';
        }
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        document.getElementById('user-orders').innerHTML = 
            '<div class="text-red-500">Error al cargar pedidos</div>';
    }
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

async function cancelOrder(orderId) {
    if (!confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Pedido cancelado exitosamente');
            // Recargar pedidos
            const user = window.AuthService.getUser();
            loadUserOrders(user._id);
        } else {
            alert(data.error || 'Error al cancelar pedido');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cancelar pedido');
    }
}
