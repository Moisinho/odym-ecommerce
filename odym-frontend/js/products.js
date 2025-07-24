// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

let currentCategory = null;
let products = [];

// Cargar productos
function loadProducts() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    productsList.innerHTML = '';
    
    let filteredProducts = products;
    
    if (currentCategory) {
        filteredProducts = products.filter(product => {
            return product.category?.name?.toLowerCase() === currentCategory.toLowerCase();
        });
    }
    
    // Aplicar filtro de precio
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        const maxPrice = parseInt(priceRange.value);
        filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);
    }
    
    // Aplicar ordenamiento
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        const sortValue = sortBy.value;
        filteredProducts.sort((a, b) => {
            switch (sortValue) {
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                default: return 0;
            }
        });
    }
    
    // Actualizar contador
    if (document.getElementById('productCount')) {
        document.getElementById('productCount').textContent = `${filteredProducts.length} productos`;
    }
    
    // Mostrar productos
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden';
        productCard.innerHTML = `
            <div class="relative">
                <img src="${product.images?.[0] || '/assets/img/placeholder-product.png'}" 
                     alt="${product.name}" 
                     class="w-full h-48 object-cover">
                <span class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                    ${product.category?.name || 'Sin categoría'}
                </span>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-2">${product.description?.substring(0, 100) || ''}...</p>
                <p class="text-orange-600 font-bold text-xl mb-4">$${product.price?.toFixed(2) || '0.00'}</p>
                
                <div class="flex space-x-2">
                    <button class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300" 
                            onclick="handleAddToCart('${product._id}', 1)">
                        Añadir
                    </button>
                    <button class="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded transition duration-300" 
                            onclick="viewProduct('${product._id}')">
                        Ver
                    </button>
                </div>
            </div>
        `;
        productsList.appendChild(productCard);
    });
}

// Función para ver producto individual
async function viewProduct(productId) {
    console.log('Viendo producto:', productId);
    
    try {
        // Obtener producto específico
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const product = await response.json();
        console.log('Producto obtenido:', product);
        currentProduct = product;
        
        // Verificar que los elementos del modal existan
        const modalTitle = document.getElementById('modalProductTitle');
        const modalTitle2 = document.getElementById('modalProductTitle2');
        const modalImage = document.getElementById('modalProductImage');
        const modalCategory = document.getElementById('modalProductCategory');
        const modalPrice = document.getElementById('modalProductPrice');
        const modalDescription = document.getElementById('modalProductDescription');
        const stockElement = document.getElementById('stock');
        
        if (!modalTitle || !modalImage) {
            throw new Error('Elementos del modal no encontrados');
        }
        
        // Actualizar modal con datos del producto específico
        modalTitle.textContent = product.name;
        if (modalTitle2) modalTitle2.textContent = product.name;
        modalImage.src = product.images?.[0] || 'https://via.placeholder.com/400x300?text=Sin+Imagen';
        modalImage.alt = product.name;
        
        if (modalCategory) modalCategory.textContent = product.category?.name || 'Sin categoría';
        if (modalPrice) modalPrice.textContent = product.price?.toFixed(2) || '0.00';
        if (modalDescription) modalDescription.textContent = product.description || 'Sin descripción disponible';
        if (stockElement) stockElement.textContent = product.stock || 0;
        
        // Configurar botón de agregar al carrito con el producto correcto
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.onclick = () => {
                const quantity = parseInt(document.getElementById('productQuantity')?.value || 1);
                handleAddToCart(product._id, quantity);
            };
        }
        
        // Configurar botón de comprar ahora - DIRECTO A STRIPE
        const buyNowBtn = document.getElementById('buyNowBtn');
        if (buyNowBtn) {
            buyNowBtn.onclick = () => {
                const quantity = parseInt(document.getElementById('productQuantity')?.value || 1);
                initiateStripeCheckout(product._id, quantity);
            };
        }
        
        // Mostrar modal
        const productModal = document.getElementById('productModal');
        if (productModal) {
            productModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('Modal mostrado correctamente');
        } else {
            throw new Error('Modal de producto no encontrado');
        }
        
    } catch (error) {
        console.error('Error al cargar producto:', error);
        showNotification(`Error al cargar producto: ${error.message}`, 'error');
    }
}

// Función para cerrar modal de producto
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
}

// Configurar filtros
document.addEventListener('DOMContentLoaded', function() {
    // Solo en la página de productos
    if (!document.getElementById('productsList')) return;
    
    // Verificar parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
        currentCategory = category;
        document.getElementById('productsTitle').textContent = getCategoryName(category);
        
        // Marcar checkbox correspondiente
        const categoryCheckbox = document.getElementById(`category-${category}`);
        if (categoryCheckbox) {
            categoryCheckbox.checked = true;
            document.getElementById('category-all').checked = false;
        }
    }
    
    // Cargar productos desde el backend - usando la misma estructura que debug
    console.log('Cargando productos desde:', `${API_BASE_URL}/products`);
    
    fetch(`${API_BASE_URL}/products`)
        .then(response => {
            console.log('Respuesta del servidor:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);
            
            // Usar la estructura exacta que funciona en debug
            if (data && Array.isArray(data)) {
                products = data;
                console.log('Productos cargados:', products.length);
            } else {
                console.warn('Estructura de respuesta inesperada:', data);
                products = [];
            }
            
            loadProducts();
        })
        .catch(error => {
            console.error('Error cargando productos:', error);
            console.log('Usando productos de ejemplo...');
            
            // Productos de ejemplo para testing
            products = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    name: 'Pesa Olímpica 20kg',
                    price: 89.99,
                    images: ['https://via.placeholder.com/300x200?text=Pesa+20kg'],
                    category: { name: 'Pesas' },
                    description: 'Pesa olímpica profesional de 20kg con acabado cromado',
                    stock: 15
                },
                {
                    _id: '507f1f77bcf86cd799439012',
                    name: 'Mancuerna Ajustable 10kg',
                    price: 45.99,
                    images: ['https://via.placeholder.com/300x200?text=Mancuerna+10kg'],
                    category: { name: 'Pesas' },
                    description: 'Mancuerna ajustable de 10kg con sistema de bloqueo rápido',
                    stock: 25
                },
                {
                    _id: '507f1f77bcf86cd799439013',
                    name: 'Barra Olímpica 2.2m',
                    price: 120.00,
                    images: ['https://via.placeholder.com/300x200?text=Barra+2.2m'],
                    category: { name: 'Pesas' },
                    description: 'Barra olímpica profesional de 2.2m con agarre antideslizante',
                    stock: 10
                },
                {
                    _id: '507f1f77bcf86cd799439014',
                    name: 'Banco Ajustable',
                    price: 199.99,
                    images: ['https://via.placeholder.com/300x200?text=Banco+Ajustable'],
                    category: { name: 'Máquinas' },
                    description: 'Banco ajustable para entrenamiento de fuerza',
                    stock: 8
                },
                {
                    _id: '507f1f77bcf86cd799439015',
                    name: 'Cuerda de Saltar',
                    price: 15.99,
                    images: ['https://via.placeholder.com/300x200?text=Cuerda+Saltar'],
                    category: { name: 'Accesorios' },
                    description: 'Cuerda de saltar ajustable con contador digital',
                    stock: 50
                }
            ];
            loadProducts();
        });

    // Configurar filtros
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.value === 'all' && this.checked) {
                document.querySelectorAll('.category-filter').forEach(cb => {
                    if (cb.value !== 'all') cb.checked = false;
                });
                currentCategory = null;
            } else if (this.checked) {
                document.getElementById('category-all').checked = false;
                currentCategory = this.value;
            }
            loadProducts();
        });
    });
    
    // Configurar rango de precio
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.addEventListener('input', function() {
            document.getElementById('priceMax').textContent = `$${this.value}`;
            loadProducts();
        });
    }
    
    // Configurar ordenamiento
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', function() {
            loadProducts();
        });
    }
    
    // Configurar botones de cantidad
    window.incrementQuantity = function() {
        const input = document.getElementById('productQuantity');
        if (input) {
            input.value = Math.min(parseInt(input.value || 1) + 1, currentProduct?.stock || 999);
        }
    };
    
    window.decrementQuantity = function() {
        const input = document.getElementById('productQuantity');
        if (input) {
            input.value = Math.max(parseInt(input.value || 1) - 1, 1);
        }
    };
});

function getCategoryName(category) {
    const names = {
        'pesas': 'Pesas',
        'maquinas': 'Máquinas',
        'accesorios': 'Accesorios',
        'suplementos': 'Suplementos'
    };
    return names[category] || 'Productos';
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

// Función para manejar agregar al carrito desde cualquier lugar
async function handleAddToCart(productId, quantity = 1) {
    console.log('Agregando al carrito:', productId, 'cantidad:', quantity);
    
    try {
        // Verificar si la función addToCart está disponible
        if (typeof addToCart === 'function') {
            const result = await addToCart(productId, quantity);
            if (result) {
                showNotification('Producto añadido al carrito', 'success');
            }
        } else {
            // Fallback: agregar manualmente al carrito
            const response = await fetch(`${API_BASE_URL}/products/${productId}`);
            if (!response.ok) throw new Error('Producto no encontrado');
            
            const product = await response.json();
            
            // Obtener carrito actual
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            // Buscar si el producto ya existe
            const existingItem = cart.find(item => item.productId === productId);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    productId: productId,
                    quantity: quantity,
                    product: {
                        _id: product._id,
                        name: product.name,
                        price: product.price,
                        images: product.images || [],
                        category: product.category,
                        stock: product.stock
                    }
                });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            showNotification(`${product.name} añadido al carrito`, 'success');
            
            // Actualizar contador si está disponible
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        showNotification('Error al agregar producto', 'error');
    }
}

// Stripe Checkout Integration
async function initiateStripeCheckout(productId, quantity = 1) {
    try {
        // Show loading state
        const buyNowBtn = document.getElementById('buyNowBtn');
        if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
        }

        // Get user email from authentication
        let customerEmail = null;
        let userId = 'guest';
        
        // Check AuthService first
        if (window.AuthService && window.AuthService.isAuthenticated()) {
            const user = window.AuthService.getUser();
            customerEmail = user.email;
            userId = user.id || user._id || 'guest';
        } 
        // Fallback to localStorage
        else {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                customerEmail = user.email;
                userId = user.id || user._id || 'guest';
            }
            // Check legacy storage
            else if (localStorage.getItem('userEmail')) {
                customerEmail = localStorage.getItem('userEmail');
                userId = localStorage.getItem('userId') || 'guest';
            }
        }

        // If no email found, prompt user to login
        if (!customerEmail) {
            alert('Por favor inicia sesión para continuar con el pago');
            if (window.AuthService) {
                window.location.href = '/odym-frontend/auth/login.html';
            } else {
                window.location.href = 'auth/login.html';
            }
            return;
        }

        // Create checkout session
        const checkoutResponse = await fetch('http://localhost:3000/api/checkout/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [{
                    productId: productId,
                    quantity: quantity
                }],
                customerEmail: customerEmail,
                userId: userId
            })
        });

        if (!checkoutResponse.ok) {
            const error = await checkoutResponse.json();
            throw new Error(error.message || 'Error al crear sesión de checkout');
        }

        const { url } = await checkoutResponse.json();

        // Redirect to Stripe Checkout
        window.location.href = url;

    } catch (error) {
        console.error('Checkout error:', error);
        alert('Error: ' + error.message);
        
        // Reset button state
        const buyNowBtn = document.getElementById('buyNowBtn');
        if (buyNowBtn) {
            buyNowBtn.disabled = false;
            buyNowBtn.innerHTML = '<i class="fas fa-bolt mr-2"></i>Comprar ahora';
        }
    }
}

// Hacer funciones globales
window.viewProduct = viewProduct;
window.closeProductModal = closeProductModal;
window.handleAddToCart = handleAddToCart;
window.initiateStripeCheckout = initiateStripeCheckout;
window.incrementQuantity = function() {
    const input = document.getElementById('productQuantity');
    if (input) {
        input.value = Math.min(parseInt(input.value || 1) + 1, 999);
    }
};
window.decrementQuantity = function() {
    const input = document.getElementById('productQuantity');
    if (input) {
        input.value = Math.max(parseInt(input.value || 1) - 1, 1);
    }
};
