
// profile.js - Para manejar la página de perfil de usuario (solo datos personales)
document.addEventListener('DOMContentLoaded', async () => {
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

    // Obtener datos actualizados del usuario desde el servidor
    const updatedUser = await fetchUpdatedUserData(user._id);
    
    // Mostrar información del usuario
    displayUserInfo(updatedUser || user);
    
    // Configurar eventos
    setupEventListeners(updatedUser || user);
});

// Función para obtener datos actualizados del usuario
async function fetchUpdatedUserData(userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/customers/profile/${userId}`);
        if (response.ok) {
            const data = await response.json();
            // Actualizar localStorage con los datos completos
            window.AuthService.setUser(data.customer);
            return data.customer;
        }
    } catch (error) {
        console.error('Error obteniendo datos actualizados del usuario:', error);
    }
    return null;
}

function displayUserInfo(user) {
    const userInfoDiv = document.getElementById('user-info');
    userInfoDiv.innerHTML = `
        <div class="space-y-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Información Personal</h2>
            
            <div class="grid md:grid-cols-2 gap-4">
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
            </div>
            
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input type="tel" id="userPhone" value="${user.phone || ''}" 
                           placeholder="Ej: +507 6123-4567"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input type="text" id="userAddress" value="${user.address || ''}" 
                           placeholder="Ej: Calle 50, Edificio Torre de las Américas"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                </div>
            </div>
            
            <div class="flex flex-wrap gap-3">
                <button id="updateProfileBtn" class="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                    Actualizar Perfil
                </button>
                <button id="changePasswordBtn" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-300">
                    Cambiar Contraseña
                </button>
                <a href="orders.html" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 inline-block">
                    Ver Mis Pedidos
                </a>
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
    const phone = document.getElementById('userPhone').value.trim();
    const address = document.getElementById('userAddress').value.trim();
    
    if (!name || !email) {
        alert('Por favor completa al menos el nombre y email');
        return;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Por favor ingresa un email válido');
        return;
    }
    
    // Validar teléfono si se proporciona
    if (phone && phone.length < 8) {
        alert('Por favor ingresa un número de teléfono válido');
        return;
    }
    
    try {
        const updateData = {
            name,
            email,
            phone,
            address
        };
        
        const response = await fetch(`http://localhost:3000/api/customers/profile/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
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
        <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
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
                <button id="cancelPasswordChange" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-300">
                    Cancelar
                </button>
                <button id="confirmPasswordChange" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition duration-300">
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
    
    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}
