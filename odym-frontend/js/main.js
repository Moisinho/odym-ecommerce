const API_BASE_URL = "http://localhost:3000/api";
let currentProduct = null;

// Funciones de navegación
function filterByCategory(category) {
  if (window.location.pathname.includes("products.html")) {
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
  const featuredProducts = document.getElementById("featuredProducts");
  if (!featuredProducts) return;

  try {
    const response = await fetch("/api/products");
    const products = await response.json();

    featuredProducts.innerHTML = "";

    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className =
        "product-card bg-white rounded-lg shadow-md overflow-hidden";
      productCard.innerHTML = `
                <div class="relative">
                    <img src="${
                      product.images[0] || "/assets/img/placeholder-product.png"
                    }" alt="${
        product.name
      }" class="w-full h-48 object-contain bg-gray-100">
                    <span class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">${
                      product.category.name
                    }</span>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
                    <p class="text-orange-600 font-bold mb-4">$${product.price.toFixed(
                      2
                    )}</p>
                    <div class="flex space-x-2">
                        <button class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="addToCart('${
                          product._id
                        }')">
                            Añadir
                        </button>
                        <button class="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="viewProduct('${
                          product._id
                        }')">
                            Ver
                        </button>
                    </div>
                </div>
            `;
      featuredProducts.appendChild(productCard);
    });
  } catch (error) {
    console.error("Error loading featured products:", error);
  }
}

// Cerrar modal de producto
function closeProductModal() {
  document.getElementById("productModal").classList.remove("active");
  document.body.style.overflow = "";
}

// Incrementar cantidad
function incrementQuantity() {
  const input = document.getElementById("productQuantity");
  input.value = parseInt(input.value) + 1;
}

// Decrementar cantidad
function decrementQuantity() {
  const input = document.getElementById("productQuantity");
  const value = parseInt(input.value);
  if (value > 1) {
    input.value = value - 1;
  }
}

// Mostrar notificación
function showNotification(message) {
  // Crear elemento de notificación
  const notification = document.createElement("div");
  notification.className =
    "fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fadeIn";
  notification.textContent = message;

  // Añadir al DOM
  document.body.appendChild(notification);

  // Eliminar después de 3 segundos
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Funciones para el carrito de compras
async function toggleCart() {
  const cartModal = document.getElementById("cartModal");
  if (!cartModal) {
    console.error("Cart modal not found");
    return;
  }

  // Verificar si cart.js está cargado
  if (typeof updateCartModal === "function") {
    // Si cart.js está disponible, usar su función asíncrona
    await updateCartModal();
  } else {
    displayBasicCart();
  }

  // Toggle del modal
  cartModal.classList.toggle("active");

  if (cartModal.classList.contains("active")) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
}

// Función fallback para mostrar carrito básico cuando cart.js no esté disponible
function displayBasicCart() {
  const cartItems = document.getElementById("cartItems");
  const emptyCartMessage = document.getElementById("emptyCartMessage");
  const cartSummary = document.getElementById("cartSummary");

  if (!cartItems || !emptyCartMessage || !cartSummary) return;

  // Cargar carrito desde localStorage
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // Limpiar contenido
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    emptyCartMessage.classList.remove("hidden");
    cartSummary.classList.add("hidden");
    return;
  }

  // Ocultar mensaje de carrito vacío
  emptyCartMessage.classList.add("hidden");
  cartSummary.classList.remove("hidden");

  // Mostrar productos básicos
  cart.forEach((item, index) => {
    const product = item.product || {};
    const cartItem = document.createElement("div");
    cartItem.className = "flex items-start py-4 border-b border-gray-200";

    cartItem.innerHTML = `
            <img src="${
              product.images?.[0] ||
              product.image ||
              "/assets/img/placeholder-product.png"
            }" 
                 alt="${product.name || "Producto"}" 
                 class="w-20 h-20 object-cover rounded bg-gray-100 flex-shrink-0">
            <div class="flex-1 ml-4">
                <h4 class="font-semibold text-gray-900">${
                  product.name || "Producto sin nombre"
                }</h4>
                <p class="text-gray-600 text-sm">${
                  product.category?.name || product.category || "Sin categoría"
                }</p>
                <p class="text-orange-600 font-bold text-lg mt-1">$${(
                  product.price || 0
                ).toFixed(2)}</p>
            </div>
            <div class="flex flex-col items-end space-y-2">
                <div class="flex items-center bg-gray-100 rounded">
                    <button class="px-3 py-1 text-gray-600 hover:text-gray-800" onclick="decrementCartItem(${index})">
                        <i class="fas fa-minus text-xs"></i>
                    </button>
                    <span class="px-3 py-1 font-medium text-sm">${
                      item.quantity
                    }</span>
                    <button class="px-3 py-1 text-gray-600 hover:text-gray-800" onclick="incrementCartItem(${index})">
                        <i class="fas fa-plus text-xs"></i>
                    </button>
                </div>
                <p class="font-bold text-lg">$${(
                  (product.price || 0) * item.quantity
                ).toFixed(2)}</p>
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
    return total + price * item.quantity;
  }, 0);

  const shipping = subtotal > 0 ? 99.99 : 0;
  const total = subtotal + shipping;

  const cartSubtotalElement = document.getElementById("cartSubtotal");
  const cartShippingElement = document.getElementById("cartShipping");
  const cartTotalElement = document.getElementById("cartTotal");

  if (cartSubtotalElement)
    cartSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  if (cartShippingElement)
    cartShippingElement.textContent = `$${shipping.toFixed(2)}`;
  if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

// Funciones básicas para manejar el carrito cuando cart.js no esté disponible
function incrementCartItem(index) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index] && cart[index].quantity < 99) {
    cart[index].quantity++;
    localStorage.setItem("cart", JSON.stringify(cart));
    displayBasicCart();
    updateCartCount();
  }
}

function decrementCartItem(index) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index] && cart[index].quantity > 1) {
    cart[index].quantity--;
    localStorage.setItem("cart", JSON.stringify(cart));
    displayBasicCart();
    updateCartCount();
  }
}

function removeCartItem(index) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index]) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    displayBasicCart();
    updateCartCount();
  }
}

// Actualizar contador del carrito
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const cartCount = document.getElementById("cartCount");

  if (cartCount) {
    cartCount.textContent = count;

    // Mostrar/ocultar contador
    if (count > 0) {
      cartCount.classList.remove("hidden");
    } else {
      cartCount.classList.add("hidden");
    }
  }
}

function closeCartModal() {
  const cartModal = document.getElementById("cartModal");
  if (cartModal) {
    cartModal.classList.remove("active");
    document.body.style.overflow = "";
  }
}


// Enhanced authentication guard for index.html
function initializeAuthentication() {
  // Validate session on page load
  if (window.AuthCleanup) {
    AuthCleanup.validateSession();
  }
  
  // Check for stale sessions
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      
      // Check if this is a stale session
      const now = new Date().getTime();
      const lastActivity = userData.lastActivity || 0;
      
      if (now - lastActivity > 24 * 60 * 60 * 1000) {
        console.log('🧹 Sesión antigua detectada, limpiando...');
        if (window.AuthCleanup) {
          AuthCleanup.cleanupAll();
        }
      }
    } catch (error) {
      console.error('❌ Error al validar sesión:', error);
      localStorage.removeItem('user');
    }
  }
}

// Modifica el event listener del DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize authentication guard
  initializeAuthentication();
  
  // Inicializar Auth (ya se inicializa automáticamente en auth.js)
  if (window.AuthService) {
    AuthService.init();
  }
  
  // Initialize admin login fix
  if (window.AdminLoginFix) {
    AdminLoginFix.preventDualDisplay();
  }

  // Configurar menú móvil
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", function () {
      document.getElementById("mobileMenu").classList.toggle("hidden");
    });
  }

  // Cargar productos destacados en la página de inicio
  if (document.getElementById("featuredProducts")) {
    loadFeaturedProducts();
  }

  updateCartCount();
});

// Categorías móviles
function toggleMobileCategories() {
  document.getElementById("mobileCategoriesMenu").classList.toggle("hidden");
}
