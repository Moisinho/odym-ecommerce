
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Función para limpiar carrito
function cleanCart() {
    try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            if (!Array.isArray(parsedCart)) {
                localStorage.removeItem('cart');
                cart = [];
                return;
            }
            
            const validCart = parsedCart.filter(item => {
                return item && 
                       typeof item === 'object' && 
                       item.productId && 
                       item.quantity && 
                       item.product &&
                       typeof item.product === 'object' &&
                       item.product.name &&
                       typeof item.product.price === 'number';
            });
            
            if (validCart.length !== parsedCart.length) {
                localStorage.setItem('cart', JSON.stringify(validCart));
                cart = validCart;
            } else {
                cart = parsedCart;
            }
        }
    } catch (error) {
        console.error('Error al limpiar carrito:', error);
        localStorage.removeItem('cart');
        cart = [];
    }
}

// Función para actualizar contador del carrito
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = count;
        if (count > 0) {
            cartCount.classList.remove('hidden');
            cartCount.style.display = 'flex';
        } else {
            cartCount.classList.add('hidden');
            cartCount.style.display = 'none';
        }
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Función global para proceder al pago
async function proceedToCheckout() {
    try {
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (!checkoutBtn) {
            return;
        }

        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            showNotification('El carrito está vacío', 'error');
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = '<i class="fas fa-credit-card mr-2"></i> Proceder al pago';
            return;
        }

        let customerEmail = null;
        let userId = null;
        
        if (window.AuthService && window.AuthService.isAuthenticated()) {
            const user = window.AuthService.getUser();
            customerEmail = user.email;
            userId = user.id || user._id;
        } else {
            alert('Por favor inicia sesión para continuar con el pago');
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = '<i class="fas fa-credit-card mr-2"></i> Proceder al pago';
            window.location.href = '/odym-frontend/auth/login.html';
            return;
        }

        const items = cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));

        const payload = {
            items: items,
            customerEmail: customerEmail,
            userId: userId
        };

        const response = await fetch(`${API_BASE_URL}/checkout/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (data.success && data.url) {
            localStorage.setItem('checkoutSession', JSON.stringify({
                sessionId: data.sessionId,
                orderId: data.orderId || null,
                timestamp: Date.now(),
                type: 'cart_checkout'
            }));

            const cartModal = document.getElementById('cartModal');
            if (cartModal) {
                cartModal.classList.remove('active');
                document.body.style.overflow = '';
            }

            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Error desconocido');
        }

    } catch (error) {
        console.error('ERROR:', error);
        showNotification('Error al procesar el pago: ' + error.message, 'error');
        
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = '<i class="fas fa-credit-card mr-2"></i> Proceder al pago';
        }
    }
}

// Función global para compra directa
async function buyNowFromModal(productId, quantity = 1) {
    
    try {
        const productResponse = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!productResponse.ok) throw new Error('Producto no encontrado');
        
        const product = await productResponse.json();
        
        if (product.stock && quantity > product.stock) {
            showNotification(`No hay suficiente stock. Máximo: ${product.stock}`, 'error');
            return false;
        }

        let customerEmail = null;
        let userId = null;
        
        if (window.AuthService && window.AuthService.isAuthenticated()) {
            const user = window.AuthService.getUser();
            customerEmail = user.email;
            userId = user.id || user._id;
        } else {
            alert('Por favor inicia sesión para continuar con la compra');
            window.location.href = '/odym-frontend/auth/login.html';
            return false;
        }

        const items = [{
            productId: productId,
            quantity: quantity
        }];

        const payload = {
            items: items,
            customerEmail: customerEmail,
            userId: userId
        };

        const response = await fetch(`${API_BASE_URL}/checkout/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (data.success && data.url) {
            localStorage.setItem('checkoutSession', JSON.stringify({
                sessionId: data.sessionId,
                orderId: data.orderId || null,
                timestamp: Date.now(),
                type: 'buy_now'
            }));

            const productModal = document.getElementById('productModal');
            if (productModal) {
                productModal.classList.remove('active');
                document.body.style.overflow = '';
            }

            window.location.href = data.url;
            return true;
        } else {
            throw new Error(data.error || 'Error desconocido');
        }

    } catch (error) {
        console.error('ERROR en buyNow:', error);
        showNotification('Error al procesar la compra: ' + error.message, 'error');
        return false;
    }
}

// Función para abrir/cerrar carrito
async function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    if (!cartModal) {
        console.error('Cart modal not found');
        return;
    }
    
    cleanCart();
    
    // Actualizar modal si existe
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            const emptyCartMessage = document.getElementById('emptyCartMessage');
            const cartSummary = document.getElementById('cartSummary');
            if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
            if (cartSummary) cartSummary.classList.add('hidden');
        } else {
            // Aquí iría la lógica para actualizar el modal con productos reales
            // Por simplicidad, solo mostramos el modal
        }
    }
    
    cartModal.classList.toggle('active');
    
    if (cartModal.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Funciones de control del carrito
function incrementCartItem(index) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
        const product = cart[index].product;
        if (product.stock && cart[index].quantity + 1 > product.stock) {
            showNotification('No hay suficiente stock', 'error');
            return;
        }
        cart[index].quantity += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }
}

function decrementCartItem(index) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index] && cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }
}

function removeCartItem(index) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
        const productName = cart[index].product.name;
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification(`${productName} eliminado del carrito`, 'info');
    }
}

// Función para cerrar modal
function closeCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Función para conectar todos los botones
function connectAllButtons() {
    // Conectar botón "Proceder al pago"
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            proceedToCheckout();
        };
    }
    
    // Conectar botón "Comprar ahora"
    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        buyNowBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Obtener productId y quantity del modal
            const productId = document.getElementById('modalProductTitle')?.dataset.productId || 
                             document.querySelector('[data-product-id]')?.dataset.productId;
            const quantity = parseInt(document.getElementById('productQuantity')?.value || 1);
            
            if (productId) {
                buyNowFromModal(productId, quantity);
            }
        };
    }
}

// Inicialización global
function initGlobal() {
    cleanCart();
    updateCartCount();
    
    // Conectar botones cuando el DOM esté listo
    const connectButtons = () => {
        connectAllButtons();
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', connectButtons);
    } else {
        connectButtons();
    }
    
    // Re-conectar cada segundo para asegurar que funcione en todas las páginas
    setInterval(connectButtons, 1000);
}

// Inicializar
initGlobal();

// Exportar funciones globales
window.proceedToCheckout = proceedToCheckout;
window.buyNowFromModal = buyNowFromModal;
window.toggleCart = toggleCart;
window.closeCartModal = closeCartModal;
window.updateCartCount = updateCartCount;
window.incrementCartItem = incrementCartItem;
window.decrementCartItem = decrementCartItem;
window.removeCartItem = removeCartItem;

