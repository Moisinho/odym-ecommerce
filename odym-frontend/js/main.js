// Variables globales
let cart = JSON.parse(localStorage.getItem('cart')) || [];
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

// Ver detalle de producto
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        currentProduct = product;
        
        // Actualizar modal
        document.getElementById('modalProductTitle').textContent = product.name;
        document.getElementById('modalProductImage').src = product.image;
        document.getElementById('modalProductCategory').textContent = product.category;
        document.getElementById('modalProductPrice').textContent = `$${product.price.toFixed(2)}`;
        document.getElementById('modalProductDescription').textContent = product.description;
        document.getElementById('productQuantity').value = 1;
        
        // Configurar botones
        document.getElementById('addToCartBtn').onclick = () => {
            const quantity = parseInt(document.getElementById('productQuantity').value);
            addToCart(product.id, quantity);
            closeProductModal();
        };
        
        document.getElementById('buyNowBtn').onclick = () => {
            const quantity = parseInt(document.getElementById('productQuantity').value);
            addToCart(product.id, quantity);
            closeProductModal();
            toggleCart();
            document.getElementById('checkoutBtn').click();
        };
        
        // Mostrar modal
        document.getElementById('productModal').classList.add('active');
        document.body.style.overflow = 'hidden';
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

// Elimina las funciones de autenticación que ahora están en auth.js
// Solo mantén esta función para actualizar el carrito basado en el usuario
function updateCartForUser() {
    const user = Auth.currentUser();
    if (user) {
        // Opcional: cargar el carrito del usuario desde backend en el futuro
        console.log("Usuario logueado, cargar su carrito");
    } else {
        // Mantener carrito local
        console.log("Usuario no logueado, usar carrito local");
    }
    updateCartCount();
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
});

// Categorías móviles
function toggleMobileCategories() {
    document.getElementById('mobileCategoriesMenu').classList.toggle('hidden');
}