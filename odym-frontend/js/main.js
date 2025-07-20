let currentProduct = null;

// Funciones de navegación
function filterByCategory(category) {
    if (window.location.pathname.includes('products.html')) {
        // Si ya estamos en la página de productos, solo filtramos
        currentCategory = category;
        loadProducts();
    } else {
        // Redirigir a la página de productos con el parámetro de categoría
        window.location.href = `products.html?category=${category}`;
    }
}

// Cargar productos destacados
async function loadFeaturedProducts() {
    const featuredProducts = document.getElementById('featuredProducts');
    if (!featuredProducts) return;

    try {
        const response = await fetch('/api/products');
        const products = await response.json();

        console.log('Fetched products:', products);

        featuredProducts.innerHTML = '';

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden';
            productCard.innerHTML = `
                <div class="relative">
                    <img src="${product.images[0] || '/assets/img/placeholder-product.png'}" alt="${product.name}" class="w-full h-48 object-contain bg-gray-100">
                    <span class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">${product.category.name}</span>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
                    <p class="text-orange-600 font-bold mb-4">$${product.price.toFixed(2)}</p>
                    <div class="flex space-x-2">
                        <button class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="addToCart('${product._id}')">
                            Añadir
                        </button>
                        <button class="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="viewProduct('${product._id}')">
                            Ver
                        </button>
                    </div>
                </div>
            `;
            featuredProducts.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}


document.addEventListener('DOMContentLoaded', fetchAndRenderFeaturedProducts);

// Ver detalle de producto
// Ver detalle de producto
function viewProduct(productId) {
  // Usamos la variable global window.featuredProducts
  const product = window.featuredProducts.find(p => p._id === productId);
  
  if (product) {
    currentProduct = product;
    
    // Actualizar modal
    const modal = document.getElementById('productModal');
    if (!modal) {
      console.error('Product modal not found');
      return;
    }
    
    document.getElementById('modalProductTitle').textContent = product.name;
    document.getElementById('modalProductImage').src = product.images[0] || '/assets/img/placeholder-product.png';
    document.getElementById('modalProductCategory').textContent = product.category?.name || 'General';
    document.getElementById('modalProductPrice').textContent = `$${product.price?.toFixed(2) || '0.00'}`;
    document.getElementById('modalProductDescription').textContent = product.description || 'Sin descripción disponible';
    document.getElementById('stock').textContent = product.stock || 'Disponible';
    document.getElementById('productQuantity').value = 1;
    
    // Configurar botones
    document.getElementById('addToCartBtn').onclick = () => {
      const quantity = parseInt(document.getElementById('productQuantity').value);
      addToCart(product._id, quantity);
      closeProductModal();
    };
    
    document.getElementById('buyNowBtn').onclick = () => {
      const quantity = parseInt(document.getElementById('productQuantity').value);
      addToCart(product._id, quantity);
      closeProductModal();
      toggleCart();
      const checkoutBtn = document.getElementById('checkoutBtn');
      if (checkoutBtn) checkoutBtn.click();
    };
    
    // Mostrar modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    console.error('Product not found:', productId);
  }
}

// Cerrar modal de producto
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
}

// Incrementar cantidad
function incrementQuantity() {
    const input = document.getElementById('productQuantity');
    input.value = parseInt(input.value) + 1;
}

// Decrementar cantidad
function decrementQuantity() {
    const input = document.getElementById('productQuantity');
    const value = parseInt(input.value);
    if (value > 1) {
        input.value = value - 1;
    }
}

// Mostrar notificación
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fadeIn';
    notification.textContent = message;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Funciones para el carrito de compras
async function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    if (!cartModal) {
        console.error('Cart modal not found');
        return;
    }
    
    // Verificar si cart.js está cargado
    if (typeof updateCartModal === 'function') {
        // Si cart.js está disponible, usar su función asíncrona
        await updateCartModal();
    } else {
        // Fallback básico para mostrar el modal
        console.log('Using fallback cart display');
        displayBasicCart();
    }
    
    // Toggle del modal
    cartModal.classList.toggle('active');
    
    if (cartModal.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Función fallback para mostrar carrito básico cuando cart.js no esté disponible
function displayBasicCart() {
    const cartItems = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cartItems || !emptyCartMessage || !cartSummary) return;
    
    // Cargar carrito desde localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Limpiar contenido
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        emptyCartMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        return;
    }
    
    // Ocultar mensaje de carrito vacío
    emptyCartMessage.classList.add('hidden');
    cartSummary.classList.remove('hidden');
    
    // Mostrar productos básicos
    cart.forEach((item, index) => {
        const product = item.product || {};
        const cartItem = document.createElement('div');
        cartItem.className = 'flex items-start py-4 border-b border-gray-200';
        
        cartItem.innerHTML = `
            <img src="${product.images?.[0] || product.image || '/assets/img/placeholder-product.png'}" 
                 alt="${product.name || 'Producto'}" 
                 class="w-20 h-20 object-cover rounded bg-gray-100 flex-shrink-0">
            <div class="flex-1 ml-4">
                <h4 class="font-semibold text-gray-900">${product.name || 'Producto sin nombre'}</h4>
                <p class="text-gray-600 text-sm">${product.category?.name || product.category || 'Sin categoría'}</p>
                <p class="text-orange-600 font-bold text-lg mt-1">$${(product.price || 0).toFixed(2)}</p>
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
                <p class="font-bold text-lg">$${((product.price || 0) * item.quantity).toFixed(2)}</p>
                <button class="text-red-500 hover:text-red-700 text-sm" onclick="removeCartItem(${index})">
                    <i class="fas fa-trash mr-1"></i> Eliminar
                </button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    // Actualizar resumen
    updateBasicCartSummary(cart);
}

// Función para actualizar resumen básico del carrito
function updateBasicCartSummary(cart) {
    const subtotal = cart.reduce((total, item) => {
        const price = item.product?.price || 0;
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
}

// Funciones básicas para manejar el carrito cuando cart.js no esté disponible
function incrementCartItem(index) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index] && cart[index].quantity < 99) {
        cart[index].quantity++;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayBasicCart();
        updateCartCount();
    }
}

function decrementCartItem(index) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index] && cart[index].quantity > 1) {
        cart[index].quantity--;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayBasicCart();
        updateCartCount();
    }
}

function removeCartItem(index) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        displayBasicCart();
        updateCartCount();
    }
}

// Actualizar contador del carrito
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
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

function closeCartModal() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Elimina las funciones de autenticación que ahora están en auth.js
// Solo mantén esta función para actualizar el carrito basado en el usuario
function updateCartForUser() {
    try {
        if (typeof Auth !== 'undefined' && Auth.currentUser) {
            const user = Auth.currentUser();
            if (user) {
                // Opcional: cargar el carrito del usuario desde backend en el futuro
                console.log("Usuario logueado, cargar su carrito");
            } else {
                // Mantener carrito local
                console.log("Usuario no logueado, usar carrito local");
            }
        } else {
            console.log("Auth no disponible, usar carrito local");
        }
    } catch (error) {
        console.log("Error con Auth, usar carrito local:", error);
    }
    
    // Llamar updateCartCount solo si existe (está definida en cart.js)
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
}

// Modifica el event listener del DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Auth (ya se inicializa automáticamente en auth.js)
    
    // Configurar menú móvil
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            document.getElementById('mobileMenu').classList.toggle('hidden');
        });
    }
    
    // Cargar productos destacados en la página de inicio
    if (document.getElementById('featuredProducts')) {
        loadFeaturedProducts();
    }
    
    // Actualizar UI basado en autenticación
    updateCartForUser();
    
    // Inicializar contador del carrito
    updateCartCount();
});

// Categorías móviles
function toggleMobileCategories() {
    document.getElementById('mobileCategoriesMenu').classList.toggle('hidden');
}