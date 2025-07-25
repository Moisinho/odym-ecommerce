// API base URL - ajustado para el entorno actual
const API_BASE_URL = 'http://localhost:3000/api';

// Usuario quemado para testing (reemplazar con autenticación real)
const HARDCODED_USER = {
    id: '507f1f77bcf86cd799439011',
    email: 'temp@example.com',
    name: 'Usuario Temporal'
};

// Inicializar carrito desde localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Función para limpiar datos corruptos del carrito
function cleanCart() {
    try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            if (!Array.isArray(parsedCart)) {
                console.log('Carrito corrupto detectado, limpiando...');
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
                console.log('Items corruptos removidos del carrito');
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

// Función definitiva para agregar productos reales al carrito
async function addToCart(productId, quantity = 1) {
    console.log('=== AGREGANDO PRODUCTO REAL ===');
    console.log('Product ID:', productId, 'Quantity:', quantity);
    
    try {
        // Obtener producto real desde la base de datos
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        
        if (!response.ok) {
            throw new Error(`Producto ${productId} no encontrado`);
        }
        
        const product = await response.json();
        console.log('Producto obtenido:', product);
        
        // Recargar carrito desde localStorage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        console.log('Carrito actual:', cart);
        
        // Buscar si el producto ya existe
        const existingItem = cart.find(item => item.productId === productId);
        
        if (existingItem) {
            // Verificar stock antes de incrementar
            if (product.stock && existingItem.quantity + quantity > product.stock) {
                showNotification(`No hay suficiente stock. Máximo: ${product.stock}`, 'error');
                return false;
            }
            existingItem.quantity += quantity;
            console.log('Incrementando cantidad existente:', existingItem.quantity);
        } else {
            // Verificar stock para nuevo producto
            if (product.stock && quantity > product.stock) {
                showNotification(`No hay suficiente stock. Máximo: ${product.stock}`, 'error');
                return false;
            }
            
            // Agregar producto real con todos sus datos
            const newItem = {
                productId: productId,
                quantity: quantity,
                product: {
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    images: product.images || [],
                    category: product.category,
                    stock: product.stock,
                    description: product.description
                }
            };
            cart.push(newItem);
            console.log('Nuevo producto agregado:', newItem);
        }
        
        // Guardar en localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Carrito guardado:', cart);
        
        // Actualizar UI
        updateCartCount();
        showNotification(`${product.name} añadido al carrito`, 'success');
        
        return true;
        
    } catch (error) {
        console.error('Error al agregar producto:', error);
        showNotification('Error al agregar producto', 'error');
        return false;
    }
}

// Función para obtener productos reales desde la base de datos
async function fetchProductDetails(productIds) {
    try {
        const response = await fetch(`${API_BASE_URL}/products-by-ids/by-ids`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: productIds })
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener productos');
        }
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (data && data.success && Array.isArray(data.products)) {
            return data.products;
        } else {
            console.warn('Respuesta inesperada del servidor:', data);
            return [];
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        return [];
    }
}

// Actualizar modal de carrito con productos reales de la BD
async function updateCartModal() {
    const cartItems = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cartItems || !emptyCartMessage || !cartSummary) {
        console.error('Cart modal elements not found');
        return;
    }
    
    // Recargar carrito desde localStorage
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Limpiar contenido
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        // Mostrar mensaje de carrito vacío
        emptyCartMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        return;
    }
    
    // Ocultar mensaje de carrito vacío
    emptyCartMessage.classList.add('hidden');
    cartSummary.classList.remove('hidden');
    
    // Obtener IDs de productos del carrito
    const productIds = cart.map(item => item.productId);
    
    if (productIds.length === 0) {
        emptyCartMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        return;
    }
    
    // Mostrar loading
    cartItems.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-orange-600"></i> Cargando productos...</div>';
    
    try {
        // Obtener detalles reales de los productos desde la BD
        const products = await fetchProductDetails(productIds);
        
        // Limpiar loading
        cartItems.innerHTML = '';
        
        // Actualizar carrito con información real de productos
        cart = cart.map(item => {
            const product = products.find(p => p._id === item.productId || p.id === item.productId);
            if (product) {
                return {
                    ...item,
                    product: product
                };
            }
            return item;
        });
        
        // Guardar carrito actualizado
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Mostrar productos con scroll si hay muchos
        const scrollContainer = document.createElement('div');
        scrollContainer.className = 'max-h-96 overflow-y-auto pr-2';
        
        cart.forEach((item, index) => {
            const product = item.product;
            if (!product) return;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'flex items-start py-4 border-b border-gray-200 last:border-b-0';
            
            const productImage = product.images?.[0] || product.image || '/assets/img/placeholder-product.png';
            const productName = product.name || 'Producto sin nombre';
            const productCategory = product.category?.name || product.category || 'Sin categoría';
            const productPrice = product.price || 0;
            
            cartItem.innerHTML = `
                <img src="${productImage}" alt="${productName}" 
                     class="w-20 h-20 object-cover rounded bg-gray-100 flex-shrink-0">
                <div class="flex-1 ml-4">
                    <h4 class="font-semibold text-gray-900">${productName}</h4>
                    <p class="text-gray-600 text-sm">${productCategory}</p>
                    <p class="text-orange-600 font-bold text-lg mt-1">$${productPrice.toFixed(2)}</p>
                </div>
                <div class="flex flex-col items-end space-y-2">
                    <div class="flex items-center bg-gray-100 rounded">
                        <button class="px-3 py-1 text-gray-600 hover:text-gray-800" onclick="decrementCartItem(${index})">
                            <i class="fas fa-minus text-xs"></i>
                        </button>
                        <span class="px-3 py-1 font-medium text-sm">${item.quantity}</span>
                        <button class="px-3 py-1 text-gray-600 hover:text-gray-800" onclick="incrementCartItem(${index})">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                    <p class="font-bold text-lg">$${(productPrice * item.quantity).toFixed(2)}</p>
                    <button class="text-red-500 hover:text-red-700 text-sm" onclick="removeCartItem(${index})">
                        <i class="fas fa-trash mr-1"></i> Eliminar
                    </button>
                </div>
            `;
            scrollContainer.appendChild(cartItem);
        });
        
        cartItems.appendChild(scrollContainer);
        
        // Actualizar resumen
        updateCartSummary();
        
    } catch (error) {
        console.error('Error actualizando modal:', error);
        cartItems.innerHTML = '<div class="text-center py-4 text-red-500">Error al cargar productos</div>';
    }
}

// Abrir/cerrar carrito (versión asíncrona con productos reales)
async function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    if (!cartModal) {
        console.error('Cart modal not found');
        return;
    }
    
    // Limpiar carrito antes de mostrar
    cleanCart();
    
    // Debug: mostrar estado del carrito
    console.log('Toggle cart - Estado actual del carrito:', cart);
    console.log('Toggle cart - localStorage cart:', localStorage.getItem('cart'));
    
    // Actualizar el modal con productos reales antes de mostrarlo
    await updateCartModal();
    
    // Toggle del modal
    cartModal.classList.toggle('active');
    
    if (cartModal.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
        console.log('Modal de carrito abierto');
    } else {
        document.body.style.overflow = '';
        console.log('Modal de carrito cerrado');
    }
}

// Actualizar contador del carrito
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
    console.log('Cart count updated:', count);
}

// Incrementar cantidad en carrito
async function incrementCartItem(index) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
        const product = cart[index].product;
        if (product.stock && cart[index].quantity + 1 > product.stock) {
            showNotification('No hay suficiente stock', 'error');
            return;
        }
        cart[index].quantity += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        await updateCartModal();
        updateCartCount();
    }
}

// Decrementar cantidad en carrito
async function decrementCartItem(index) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index] && cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        await updateCartModal();
        updateCartCount();
    }
}

// Eliminar item del carrito
async function removeCartItem(index) {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
        const productName = cart[index].product.name;
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        await updateCartModal();
        updateCartCount();
        showNotification(`${productName} eliminado del carrito`, 'info');
    }
}

// Actualizar resumen del carrito
function updateCartSummary() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((total, item) => {
        if (!item.product) return total;
        return total + (item.product.price * item.quantity);
    }, 0);
    
    const shipping = subtotal > 0 ? 99.99 : 0;
    const total = subtotal + shipping;

    const cartSubtotalElement = document.getElementById('cartSubtotal');
    const cartShippingElement = document.getElementById('cartShipping');
    const cartTotalElement = document.getElementById('cartTotal');

    if (cartSubtotalElement) cartSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (cartShippingElement) cartShippingElement.textContent = `$${shipping.toFixed(2)}`;
    if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

// Cerrar modal de carrito
function closeCartModal() {
    document.getElementById('cartModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    // Crear notificación temporal
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

// INICIALIZACIÓN CON DEPURACIÓN EXTREMA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cart.js cargado completamente');
    cleanCart();
    updateCartCount();
    
    // Función de depuración mejorada
    function connectCheckoutButton() {
        console.log('🔍 Buscando botón checkoutBtn...');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (checkoutBtn) {
            console.log('✅ Botón encontrado:', checkoutBtn);
            console.log('✅ ID:', checkoutBtn.id);
            console.log('✅ Texto:', checkoutBtn.textContent);
            console.log('✅ Clases:', checkoutBtn.className);
            console.log('✅ Padre:', checkoutBtn.parentElement);
            
            // Limpiar listeners anteriores
            const newBtn = checkoutBtn.cloneNode(true);
            checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
            
            // Agregar listener con depuración
            newBtn.addEventListener('click', function(e) {
                console.log('🎯 CLICK DETECTADO en botón de checkout');
                console.log('🎯 Evento:', e);
                console.log('🎯 Target:', e.target);
                console.log('🎯 CurrentTarget:', e.currentTarget);
                e.preventDefault();
                e.stopPropagation();
                proceedToCheckout();
            });
            
            console.log('✅ Listener agregado exitosamente');
        } else {
            console.error('❌ Botón checkoutBtn NO ENCONTRADO');
            console.log('❌ Todos los botones:', document.querySelectorAll('button'));
            console.log('❌ Buscando por texto:', document.querySelectorAll('button'));
            console.log('❌ Buscando por clase:', document.querySelectorAll('[class*="checkout"]'));
            console.log('❌ Buscando por ID:', document.querySelectorAll('[id*="checkout"]'));
            
            // Intentar encontrar cualquier botón de checkout
            const possibleButtons = document.querySelectorAll('button');
            possibleButtons.forEach((btn, index) => {
                console.log(`Botón ${index}:`, btn.textContent, btn.id, btn.className);
            });
            
            setTimeout(connectCheckoutButton, 1000);
        }
    }

    // Intentar conectar inmediatamente y con retry
    setTimeout(connectCheckoutButton, 100);
    setTimeout(connectCheckoutButton, 500);
    setTimeout(connectCheckoutButton, 1000);
    
    console.log('Carrito inicializado con depuración');
});

// Función de depuración para el modal
const originalToggleCart = toggleCart;
window.toggleCart = async function() {
    console.log('🔄 Abriendo modal de carrito...');
    await originalToggleCart();
    
    setTimeout(() => {
        console.log('🔍 Verificando botón después de abrir modal...');
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            console.log('✅ Botón encontrado en modal:', checkoutBtn);
            
            // Limpiar y re-agregar listener
            const newBtn = checkoutBtn.cloneNode(true);
            checkoutBtn.parentNode.replaceChild(newBtn, checkoutBtn);
            
            newBtn.addEventListener('click', function(e) {
                console.log('🎯 CLICK EN MODAL DETECTADO');
                e.preventDefault();
                e.stopPropagation();
                proceedToCheckout();
            });
        } else {
            console.error('❌ Botón no encontrado en modal');
        }
    }, 500);
};

// Función auxiliar para testing manual
window.testCheckout = function() {
    console.log('🧪 Test manual de checkout iniciado');
    console.log('localStorage:', localStorage);
    console.log('Cart:', JSON.parse(localStorage.getItem('cart') || '[]'));
    proceedToCheckout();
};

// Funciones globales para debugging
window.clearCart = function() {
    cart = [];
    localStorage.removeItem('cart');
    updateCartCount();
    showNotification('Carrito limpiado', 'info');
};

window.debugCart = function() {
    const storedCart = localStorage.getItem('cart');
    console.log('localStorage cart:', storedCart);
    console.log('parsed cart:', JSON.parse(storedCart || '[]'));
    console.log('current cart variable:', cart);
};

// FUNCIÓN CON DEPURACIÓN COMPLETA
async function proceedToCheckout() {
    console.log('=== INICIANDO DEBUG DE CHECKOUT ===');
    
    try {
        // 1. VERIFICAR QUE EL BOTÓN EXISTE
        const checkoutBtn = document.getElementById('checkoutBtn');
        console.log('1. Botón encontrado:', checkoutBtn);
        console.log('1.1 ID del botón:', checkoutBtn?.id);
        console.log('1.2 Texto del botón:', checkoutBtn?.textContent);
        console.log('1.3 Clases del botón:', checkoutBtn?.className);
        
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
        } else {
            console.error('❌ ERROR: Botón checkoutBtn no encontrado');
            console.log('Elementos disponibles:', document.querySelectorAll('button'));
            return;
        }

        // 2. VERIFICAR CARRITO
        console.log('2. Verificando carrito...');
        const cartRaw = localStorage.getItem('cart');
        console.log('2.1 Raw cart:', cartRaw);
        
        const cart = JSON.parse(cartRaw || '[]');
        console.log('2.2 Parsed cart:', cart);
        console.log('2.3 Cart length:', cart.length);
        
        if (cart.length === 0) {
            console.log('2.4 Carrito vacío detectado');
            showNotification('El carrito está vacío', 'error');
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = 'Proceder con el pago';
            return;
        }

        // 3. PREPARAR ITEMS
        console.log('3. Preparando items...');
        const items = cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));
        console.log('3.1 Items preparados:', items);

        // 4. VERIFICAR USUARIO
        console.log('4. Verificando usuario...');
        let customerEmail = null;
        let userId = null;
        
        console.log('4.1 localStorage keys:', Object.keys(localStorage));
        console.log('4.2 user en localStorage:', localStorage.getItem('user'));
        console.log('4.3 userEmail en localStorage:', localStorage.getItem('userEmail'));
        
        if (localStorage.getItem('user')) {
            const user = JSON.parse(localStorage.getItem('user'));
            customerEmail = user.email;
            userId = user.id || user._id;
            console.log('4.4 Usuario de localStorage:', customerEmail);
        } else if (localStorage.getItem('userEmail')) {
            customerEmail = localStorage.getItem('userEmail');
            userId = localStorage.getItem('userId') || 'guest';
            console.log('4.5 Usuario de fallback:', customerEmail);
        } else {
            console.log('4.6 Usuario no encontrado');
            alert('Por favor inicia sesión para continuar con el pago');
            window.location.href = '/odym-frontend/auth/login.html';
            return;
        }

        // 5. VERIFICAR CONEXIÓN AL BACKEND
        console.log('5. Verificando conexión al backend...');
        console.log('5.1 API_BASE_URL:', API_BASE_URL);
        console.log('5.2 Endpoint:', `${API_BASE_URL}/checkout/create-checkout-session`);
        
        const payload = {
            items: items,
            customerEmail: customerEmail,
            userId: userId
        };
        console.log('5.3 Payload:', payload);

        showNotification('Redirigiendo a la pasarela de pago...', 'info');

        // 6. HACER LLAMADA AL BACKEND
        console.log('6. Haciendo llamada al backend...');
        const response = await fetch(`${API_BASE_URL}/checkout/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('6.1 Response status:', response.status);
        console.log('6.2 Response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('6.3 Error response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('6.4 Data recibida:', data);
        
        if (data.success && data.url) {
            console.log('6.5 URL de redirección:', data.url);
            
            // Guardar información
            localStorage.setItem('checkoutSession', JSON.stringify({
                sessionId: data.sessionId,
                orderId: data.orderId || null,
                timestamp: Date.now(),
                type: 'cart_checkout'
            }));

            // Cerrar modal
            const cartModal = document.getElementById('cartModal');
            if (cartModal) {
                cartModal.classList.remove('active');
                document.body.style.overflow = '';
            }

            console.log('7. REDIRIGIENDO A:', data.url);
            window.location.href = data.url;
        } else {
            console.error('6.6 Error en data:', data);
            throw new Error(data.error || 'Respuesta inválida del servidor');
        }

    } catch (error) {
        console.error('❌ ERROR COMPLETO:', error);
        console.error('Stack trace:', error.stack);
        showNotification('Error al procesar el pago: ' + error.message, 'error');
        
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = 'Proceder con el pago';
        }
    }
}

// Función para compra directa (Buy Now) desde modal de producto
async function buyNowFromModal(productId, quantity = 1) {
    try {
        console.log('=== BUY NOW FROM MODAL ===');
        console.log('Product ID:', productId, 'Quantity:', quantity);
        
        // Obtener producto real desde la base de datos
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        
        if (!response.ok) {
            throw new Error(`Producto ${productId} no encontrado`);
        }
        
        const product = await response.json();
        console.log('Producto obtenido:', product);
        
        // Verificar stock
        if (product.stock && quantity > product.stock) {
            showNotification(`No hay suficiente stock. Máximo: ${product.stock}`, 'error');
            return false;
        }
        
        // Preparar items para checkout directo
        const items = [{
            productId: productId,
            quantity: quantity
        }];

        // Datos del cliente (por ahora quemados)
        const customerData = {
            email: 'temp@example.com',
            firstName: 'Usuario',
            lastName: 'Temporal'
        };

        showNotification('Procesando compra directa...', 'info');

        // Crear sesión de checkout con Stripe
        const checkoutResponse = await fetch(`${API_BASE_URL}/checkout/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: items,
                customerEmail: customerData.email,
                userId: HARDCODED_USER.id
            })
        });

        if (!checkoutResponse.ok) {
            throw new Error('Error al crear sesión de checkout');
        }

        const data = await checkoutResponse.json();
        
        if (data.success && data.url) {
            // Guardar información de la sesión
            localStorage.setItem('checkoutSession', JSON.stringify({
                sessionId: data.sessionId,
                orderId: data.orderId || null,
                timestamp: Date.now(),
                type: 'buy_now'
            }));

            // Cerrar modal de producto si está abierto
            const productModal = document.getElementById('productModal');
            if (productModal) {
                productModal.classList.remove('active');
                document.body.style.overflow = '';
            }

            // Redirigir a Stripe Checkout
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Error desconocido');
        }

        return true;
        
    } catch (error) {
        console.error('Error en compra directa:', error);
        showNotification('Error al procesar la compra: ' + error.message, 'error');
        return false;
    }
}

// Exportar funciones globales
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.closeCartModal = closeCartModal;
window.proceedToCheckout = proceedToCheckout;
