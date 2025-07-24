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

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cleanCart();
    updateCartCount();
    
    // Conectar botón de checkout - con retry para asegurar que el botón existe
    function connectCheckoutButton() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', proceedToCheckout);
    console.log('✅ Botón de checkout conectado correctamente desde cart');
  } else {
    console.log('⏳ Botón de checkout no encontrado, reintentando...');
    setTimeout(connectCheckoutButton, 500);
  }
}

    
    // Esperar a que los modales se carguen
    setTimeout(connectCheckoutButton, 100);
    
    console.log('Carrito inicializado con productos reales');
});

// También conectar cuando se abre el modal de carrito
const originalToggleCart = toggleCart;
window.toggleCart = async function() {
    await originalToggleCart();
    
    // Asegurar que el botón esté conectado cuando se abre el modal
    setTimeout(() => {
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn && !checkoutBtn.hasAttribute('data-connected')) {
            checkoutBtn.addEventListener('click', proceedToCheckout);
            checkoutBtn.setAttribute('data-connected', 'true');
            console.log('✅ Botón de checkout reconectado al abrir modal');
        }
    }, 100);
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

// Función de checkout
async function proceedToCheckout() {
    try {
        // Obtener carrito actual
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        if (cart.length === 0) {
            showNotification('El carrito está vacío', 'error');
            return;
        }

        // Preparar items para el checkout
        const items = cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));

        // Datos del cliente (por ahora quemados, más tarde con formulario)
        const customerData = {
            email: 'temp@example.com',
            firstName: 'Usuario',
            lastName: 'Temporal'
        };

        showNotification('Redirigiendo a la pasarela de pago...', 'info');

        // Crear sesión de checkout con Stripe
        const response = await fetch(`${API_BASE_URL}/checkout/create-checkout-session`, {
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

        if (!response.ok) {
            throw new Error('Error al crear sesión de checkout');
        }

        const data = await response.json();
        
        if (data.success && data.url) {
            // Guardar información de la sesión
            localStorage.setItem('checkoutSession', JSON.stringify({
                sessionId: data.sessionId,
                orderId: data.orderId || null,
                timestamp: Date.now()
            }));

            // Redirigir a Stripe Checkout
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Error desconocido');
        }

    } catch (error) {
        console.error('Error en checkout:', error);
        showNotification('Error al procesar el pago: ' + error.message, 'error');
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
