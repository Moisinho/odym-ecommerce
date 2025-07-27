// Función para agregar productos desde la página de productos
async function addProductToCart(productId, quantity = 1) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!response.ok) {
            throw new Error('Producto no encontrado');
        }
        
        const product = await response.json();
        
        // Recargar carrito desde localStorage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Buscar si el producto ya existe
        const existingItem = cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            // Agregar nuevo producto con datos reales
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
        
        // Guardar en localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Actualizar contador
        updateCartCount();
        
        // Mostrar notificación
        showNotification(`${product.name} añadido al carrito`, 'success');
        
        return true;
        
    } catch (error) {
        console.error('Error al agregar producto:', error);
        showNotification('Error al agregar producto al carrito', 'error');
        return false;
    }
}

// Función para agregar desde la página de productos
function addToCartFromProduct(productId, quantity = 1) {
    return addProductToCart(productId, quantity);
}

// Función para agregar desde la lista de productos
function addToCartFromList(productId) {
    return addProductToCart(productId, 1);
}

// Función para ver carrito con productos reales
async function viewCartWithRealProducts() {
    await toggleCart();
}

// Función para limpiar carrito completamente
function clearCartCompletely() {
    localStorage.removeItem('cart');
    updateCartCount();
    showNotification('Carrito limpiado', 'info');
}

// Función para obtener resumen del carrito
function getCartSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 99.99 : 0;
    const total = subtotal + shipping;
    
    return {
        items: cart.length,
        subtotal,
        shipping,
        total,
        products: cart
    };
}

// Función para sincronizar carrito con backend (cuando haya autenticación)
async function syncCartWithBackend() {
    // Esta función se usará cuando implementemos autenticación
}

// Hacer funciones disponibles globalmente
window.addProductToCart = addProductToCart;
window.addToCartFromProduct = addToCartFromProduct;
window.addToCartFromList = addToCartFromList;
window.viewCartWithRealProducts = viewCartWithRealProducts;
window.clearCartCompletely = clearCartCompletely;
window.getCartSummary = getCartSummary;
