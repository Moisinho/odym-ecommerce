// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Usuario quemado para testing (reemplazar con autenticación real)
const HARDCODED_USER = {
    id: '507f1f77bcf86cd799439011',
    email: 'temp@example.com',
    name: 'Usuario Temporal'
};

// Inicializar carrito desde localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Limpiar cualquier dato corrupto del carrito al inicializar
function cleanCart() {
    try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            // Verificar que sea un array válido
            if (!Array.isArray(parsedCart)) {
                console.log('Carrito corrupto detectado, limpiando...');
                localStorage.removeItem('cart');
                cart = [];
                return;
            }
            
            // Verificar que cada item tenga la estructura correcta
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

// Inicializar contador del carrito al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cleanCart();
    updateCartCount();
    console.log('Carrito inicializado:', cart);
});

// En la función addToCart (asegúrate de que verifique el usuario)
function addToCart(productId, quantity = 1) {
    // Verificar si Auth está disponible, si no usar usuario hardcoded
    let user = HARDCODED_USER;
    try {
        if (typeof Auth !== 'undefined' && Auth.currentUser) {
            user = Auth.currentUser() || HARDCODED_USER;
        }
    } catch (error) {
        console.log('Auth not available, using hardcoded user');
    }
    
    // Buscar el producto en el array global products o crear uno temporal
    let product = null;
    
    // Intentar diferentes formas de encontrar el producto
    if (typeof products !== 'undefined' && Array.isArray(products)) {
        product = products.find(p => p.id === productId || p._id === productId);
    }
    
    // Si no se encuentra, crear un producto temporal para pruebas
    if (!product) {
        console.warn('Producto no encontrado, creando temporal:', productId);
        product = {
            _id: productId,
            id: productId,
            name: 'Producto ' + productId,
            price: 99.99,
            images: ['/assets/img/placeholder-product.png'],
            category: { name: 'General' }
        };
    }
    
    // Recargar carrito desde localStorage
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Buscar si el producto ya existe en el carrito
    const existingItem = cart.find(item => 
        (item.productId === productId || (item.product && (item.product._id === productId || item.product.id === productId)))
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
        console.log('Producto existente, incrementando cantidad:', existingItem.quantity);
    } else {
        // Agregar nuevo producto con estructura correcta
        const newItem = {
            productId: productId,
            quantity: quantity,
            product: {
                _id: product._id || productId,
                name: product.name || 'Producto sin nombre',
                price: product.price || 0,
                images: product.images || [product.image || '/assets/img/placeholder-product.png'],
                category: product.category || { name: 'Sin categoría' }
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
    showNotification(`${product.name || 'Producto'} añadido al carrito`);
}


// Actualizar contador del carrito
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = count;
        
        // Mostrar/ocultar contador
        if (count > 0) {
            cartCount.classList.remove('hidden');
        } else {
            cartCount.classList.add('hidden');
        }
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

// Función para limpiar completamente el carrito (para debugging)
function clearCart() {
    cart = [];
    localStorage.removeItem('cart');
    updateCartModal();
    updateCartCount();
    console.log('Carrito completamente limpiado');
}

// Hacer la función disponible globalmente para debugging
window.clearCart = clearCart;
window.debugCart = debugCart;
window.testAddToCart = function() {
    console.log('=== TEST DE CARRITO ===');
    console.log('Carrito antes:', cart);
    addToCart('test-product-1', 2);
    console.log('Carrito después:', cart);
    console.log('localStorage:', localStorage.getItem('cart'));
    updateCartModal();
};

// Cerrar modal de carrito
function closeCartModal() {
    document.getElementById('cartModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Función para obtener productos reales desde la base de datos
async function fetchProductDetails(productIds) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/by-ids`, {
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
        return data.products || data;
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

// Incrementar cantidad en carrito
function incrementCartItem(index) {
    // Recargar carrito desde localStorage para asegurar sincronización
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart[index]) {
        cart[index].quantity++;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartModal();
        updateCartCount();
    }
}

// Decrementar cantidad en carrito
function decrementCartItem(index) {
    // Recargar carrito desde localStorage para asegurar sincronización
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart[index] && cart[index].quantity > 1) {
        cart[index].quantity--;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartModal();
        updateCartCount();
    }
}

// Eliminar item del carrito
function removeCartItem(index) {
    // Recargar carrito desde localStorage para asegurar sincronización
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Verificar si Auth está disponible
    try {
        if (typeof Auth !== 'undefined' && Auth.currentUser) {
            const user = Auth.currentUser();
            if (user) {
                console.log("Eliminando producto para usuario logueado", user.email);
                // Aquí iría una llamada API en el futuro
            }
        }
    } catch (error) {
        console.log('Auth not available for remove item');
    }
    
    if (cart[index]) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartModal();
        updateCartCount();
    }
}

// Actualizar resumen del carrito
function updateCartSummary() {
    // Recargar carrito desde localStorage para asegurar sincronización
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const subtotal = cart.reduce((total, item) => {
        if (!item.product) return total;
        const price = item.product.price || 0;
        return total + (price * item.quantity);
    }, 0);
    
    const shipping = subtotal > 0 ? 99.99 : 0;
    const total = subtotal + shipping;
    
    const cartSubtotalElement = document.getElementById('cartSubtotal');
    const cartShippingElement = document.getElementById('cartShipping');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (cartSubtotalElement) cartSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (cartShippingElement) cartShippingElement.textContent = `$${shipping.toFixed(2)}`;
    if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
    
    // Configurar botón de checkout
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.onclick = () => {
            closeCartModal();
            showCheckout();
        };
    }
}

// Mostrar checkout
function showCheckout() {
    // Actualizar items
    const checkoutItems = document.getElementById('checkoutItems');
    if (!checkoutItems) return;
    
    checkoutItems.innerHTML = '';
    
    cart.forEach(item => {
        const checkoutItem = document.createElement('div');
        checkoutItem.className = 'flex items-center py-2 border-b border-gray-200';
        checkoutItem.innerHTML = `
            <img src="${item.product.image}" alt="${item.product.name}" class="w-12 h-12 object-contain bg-gray-100 rounded">
            <div class="flex-1 ml-3">
                <h4 class="font-semibold text-sm">${item.product.name}</h4>
                <p class="text-gray-600 text-xs">Cantidad: ${item.quantity}</p>
            </div>
            <div class="text-right">
                <p class="font-semibold">$${(item.product.price * item.quantity).toFixed(2)}</p>
            </div>
        `;
        checkoutItems.appendChild(checkoutItem);
    });
    
    // Actualizar resumen
    const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 99.99 : 0;
    const total = subtotal + shipping;
    
    document.getElementById('checkoutSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('checkoutShipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('checkoutTotal').textContent = `$${total.toFixed(2)}`;
    
    // Configurar botón de realizar pedido
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.onclick = () => {
            // Validar formulario
            const form = document.getElementById('shippingForm');
            if (form.checkValidity()) {
                completeOrder();
            } else {
                form.reportValidity();
            }
        };
    }
    
    // Mostrar modal
    document.getElementById('checkoutModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de checkout
function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Completar pedido con integración de Stripe
async function completeOrder() {
    try {
        // Obtener datos del formulario
        const form = document.getElementById('shippingForm');
        const formData = new FormData(form);
        
        const shippingAddress = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            postalCode: formData.get('postalCode'),
            country: formData.get('country') || 'US'
        };

        // Preparar items para el checkout
        const items = cart.map(item => ({
            productId: item.product._id || item.product.id,
            quantity: item.quantity
        }));

        // Mostrar loading
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        const originalText = placeOrderBtn.textContent;
        placeOrderBtn.textContent = 'Procesando...';
        placeOrderBtn.disabled = true;

        // Crear sesión de checkout con Stripe
        const response = await fetch(`${API_BASE_URL}/checkout/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: items,
                customerEmail: shippingAddress.email,
                userId: HARDCODED_USER.id
            })
        });

        const data = await response.json();

        if (data.success && data.url) {
            // Guardar información de la orden en localStorage para después del pago
            localStorage.setItem('pendingOrder', JSON.stringify({
                items: cart,
                shippingAddress: shippingAddress,
                totalAmount: data.totalAmount,
                sessionId: data.sessionId
            }));

            // Redirigir a Stripe Checkout
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Error creating checkout session');
        }

    } catch (error) {
        console.error('Error completing order:', error);
        showNotification('Error al procesar el pedido: ' + error.message, 'error');
        
        // Restaurar botón
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        placeOrderBtn.textContent = 'Realizar Pedido';
        placeOrderBtn.disabled = false;
    }
}

// Función para manejar el éxito del pago (llamar desde success.html)
async function handlePaymentSuccess() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (sessionId) {
            // Verificar la sesión con el backend
            const response = await fetch(`${API_BASE_URL}/checkout/session/${sessionId}`);
            const data = await response.json();
            
            if (data.success && data.session.payment_status === 'paid') {
                // Obtener información de la orden pendiente
                const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder') || '{}');
                
                // Crear la orden en el backend
                if (pendingOrder.items && pendingOrder.shippingAddress) {
                    await createOrderInBackend(pendingOrder);
                }
                
                // Limpiar carrito y datos temporales
                cart = [];
                localStorage.removeItem('cart');
                localStorage.removeItem('pendingOrder');
                updateCartCount();
                
                // Mostrar confirmación
                showPaymentSuccess(data.session);
            }
        }
    } catch (error) {
        console.error('Error handling payment success:', error);
    }
}

// Crear orden en el backend después del pago exitoso
async function createOrderInBackend(orderData) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/quick-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: orderData.items.map(item => ({
                    productId: item.product._id || item.product.id,
                    quantity: item.quantity
                })),
                shippingAddress: orderData.shippingAddress
            })
        });

        const data = await response.json();
        
        if (data.success) {
            console.log('Order created successfully:', data.order);
            return data.order;
        } else {
            console.error('Error creating order:', data.error);
        }
    } catch (error) {
        console.error('Error creating order in backend:', error);
    }
}

// Mostrar éxito del pago
function showPaymentSuccess(session) {
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    
    // Si existe el elemento orderNumber, actualizarlo
    const orderNumberElement = document.getElementById('orderNumber');
    if (orderNumberElement) {
        orderNumberElement.textContent = orderNumber;
    }
    
    // Mostrar modal de confirmación si existe
    const confirmationModal = document.getElementById('confirmationModal');
    if (confirmationModal) {
        confirmationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        // Si no hay modal, mostrar alerta
        alert(`¡Pago exitoso! Número de orden: ${orderNumber}`);
    }
}

// Cerrar modal de confirmación
function closeConfirmationModal() {
    document.getElementById('confirmationModal').classList.remove('active');
    document.body.style.overflow = '';
}