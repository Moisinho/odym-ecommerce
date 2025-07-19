// En la función addToCart (asegúrate de que verifique el usuario)
function addToCart(productId, quantity = 1) {
    const user = Auth.currentUser();
    const product = products.find(p => p.id === productId);
    
    if (product) {
        if (user) {
            // Lógica para usuario logueado (puedes enviar a backend)
            console.log("Añadiendo producto para usuario logueado", user.email);
            // Aquí iría una llamada API en el futuro
        }
        
        // Lógica existente para carrito local
        const existingItem = cart.find(item => item.product.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                product: product,
                quantity: quantity
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification(`${product.name} añadido al carrito`);
    }
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

// Abrir/cerrar carrito
function toggleCart() {
    updateCartModal();
    document.getElementById('cartModal').classList.toggle('active');
    
    if (document.getElementById('cartModal').classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Cerrar modal de carrito
function closeCartModal() {
    document.getElementById('cartModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Actualizar modal de carrito
function updateCartModal() {
    const cartItems = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cartItems || !emptyCartMessage || !cartSummary) return;
    
    // Limpiar contenido
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        // Mostrar mensaje de carrito vacío
        emptyCartMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
    } else {
        // Ocultar mensaje de carrito vacío
        emptyCartMessage.classList.add('hidden');
        cartSummary.classList.remove('hidden');
        
        // Mostrar items
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'flex items-center py-4 border-b border-gray-200';
            cartItem.innerHTML = `
                <img src="${item.product.image}" alt="${item.product.name}" class="w-16 h-16 object-contain bg-gray-100 rounded">
                <div class="flex-1 ml-4">
                    <h4 class="font-semibold">${item.product.name}</h4>
                    <p class="text-gray-600 text-sm">${item.product.category}</p>
                    <div class="flex items-center mt-2">
                        <button class="text-gray-500 hover:text-gray-700" onclick="decrementCartItem(${index})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="mx-2">${item.quantity}</span>
                        <button class="text-gray-500 hover:text-gray-700" onclick="incrementCartItem(${index})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold">$${(item.product.price * item.quantity).toFixed(2)}</p>
                    <button class="text-red-500 hover:text-red-700 mt-2" onclick="removeCartItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        // Actualizar resumen
        updateCartSummary();
    }
}

// Incrementar cantidad en carrito
function incrementCartItem(index) {
    cart[index].quantity++;
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartModal();
    updateCartCount();
}

// Decrementar cantidad en carrito
function decrementCartItem(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartModal();
        updateCartCount();
    }
}

// Eliminar item del carrito

function removeCartItem(index) {
    const user = Auth.currentUser();
    if (user) {
        console.log("Eliminando producto para usuario logueado", user.email);
        // Aquí iría una llamada API en el futuro
    }
    
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartModal();
    updateCartCount();
}

// Actualizar resumen del carrito
function updateCartSummary() {
    const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 99.99 : 0;
    const total = subtotal + shipping;
    
    document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cartShipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
    
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

// Completar pedido
function completeOrder() {
    // Generar número de pedido aleatorio
    const orderNumber = Math.floor(100000 + Math.random() * 900000);
    document.getElementById('orderNumber').textContent = orderNumber;
    
    // Cerrar modal de checkout
    closeCheckoutModal();
    
    // Mostrar confirmación
    document.getElementById('confirmationModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Vaciar carrito
    cart = [];
    localStorage.removeItem('cart');
    updateCartCount();
}

// Cerrar modal de confirmación
function closeConfirmationModal() {
    document.getElementById('confirmationModal').classList.remove('active');
    document.body.style.overflow = '';
}