// Datos de productos
const products = [
    {
        id: 1,
        name: "Mancuernas Ajustables 40kg",
        price: 1299.99,
        category: "pesas",
        description: "Set de mancuernas ajustables de alta calidad con peso máximo de 40kg por mancuerna. Incluye discos de diferentes pesos y barras cromadas con sistema de bloqueo rápido.",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f3f4f6'/%3E%3Cpath d='M50 150 L100 150 L110 140 L190 140 L200 150 L250 150 M50 150 L50 160 L100 160 L110 170 L190 170 L200 160 L250 160 L250 150 M50 150 L50 160' stroke='%23333' stroke-width='8' fill='none'/%3E%3Ccircle cx='80' cy='155' r='20' fill='%23666'/%3E%3Ccircle cx='130' cy='155' r='15' fill='%23666'/%3E%3Ccircle cx='170' cy='155' r='15' fill='%23666'/%3E%3Ccircle cx='220' cy='155' r='20' fill='%23666'/%3E%3C/svg%3E"
    },
    // ... (resto de los productos)
];

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
function loadFeaturedProducts() {
    const featuredProducts = document.getElementById('featuredProducts');
    if (!featuredProducts) return;
    
    featuredProducts.innerHTML = '';
    
    // Obtener un producto de cada categoría
    const categories = ['pesas', 'maquinas', 'accesorios', 'suplementos'];
    categories.forEach(category => {
        const product = products.find(p => p.category === category);
        if (product) {
            const productCard = document.createElement('div');
            productCard.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden';
            productCard.innerHTML = `
                <div class="relative">
                    <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-contain bg-gray-100">
                    <span class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">${product.category}</span>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
                    <p class="text-orange-600 font-bold mb-4">$${product.price.toFixed(2)}</p>
                    <div class="flex space-x-2">
                        <button class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="addToCart(${product.id})">
                            Añadir
                        </button>
                        <button class="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="viewProduct(${product.id})">
                            Ver
                        </button>
                    </div>
                </div>
            `;
            featuredProducts.appendChild(productCard);
        }
    });
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