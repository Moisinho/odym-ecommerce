let currentCategories = [];
let products = [];
let categories = [];
const API_BASE_URL = 'http://localhost:3000/api';

// Función para verificar si el usuario es premium
function isPremiumUser() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user && ['God', 'ODYM God'].includes(user.subscription);
}

// Función para aplicar descuento premium
function applyPremiumDiscount(price) {
    return isPremiumUser() ? price * 0.7 : price;
}

// Función para mostrar precio con descuento
function formatPriceWithDiscount(originalPrice) {
    if (isPremiumUser()) {
        const discountedPrice = applyPremiumDiscount(originalPrice);
        return `
            <div class="price-container">
                <span class="original-price" style="text-decoration: line-through; color: #999; font-size: 0.9em;">$${originalPrice.toFixed(2)}</span>
                <span class="discounted-price" style="color: #e74c3c; font-weight: bold; margin-left: 0.5rem;">$${discountedPrice.toFixed(2)}</span>
                <span class="premium-badge" style="background: #f39c12; color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.7em; margin-left: 0.5rem;">30% OFF</span>
            </div>
        `;
    }
    return `<span class="regular-price">$${originalPrice.toFixed(2)}</span>`;
}

// Función para cargar categorías dinámicamente desde backend
async function loadCategories() {
  try {
    console.log('Cargando categorías...');
    const response = await fetch(API_BASE_URL + '/categories');
    if (!response.ok) throw new Error('Error al cargar categorías');
    categories = await response.json();
    console.log('Categorías recibidas:', categories);

    const container = document.getElementById('categoriesContainer');
    if (!container) {
      console.error('No se encontró el contenedor de categorías');
      return Promise.resolve();
    }

    // Limpiar contenido previo
    container.innerHTML = '';

    // Agregar checkbox "Todos"
    const allDiv = document.createElement('div');
    allDiv.className = 'flex items-center';
    allDiv.innerHTML = '<input type="checkbox" id="category-all" class="category-filter mr-2" value="all" checked><label for="category-all">Todos</label>';
    container.appendChild(allDiv);

    // Agregar categorías dinámicas
    categories.forEach(function(cat) {
      const catDiv = document.createElement('div');
      catDiv.className = 'flex items-center';
      catDiv.innerHTML = '<input type="checkbox" id="category-' + cat.name.toLowerCase() + '" class="category-filter mr-2" value="' + cat.name.toLowerCase() + '"><label for="category-' + cat.name.toLowerCase() + '">' + cat.name + '</label>';
      container.appendChild(catDiv);
    });

    // Configurar eventos para los checkboxes
    document.querySelectorAll('.category-filter').forEach(function(checkbox) {
      checkbox.addEventListener('change', function () {
        if (this.value === 'all' && this.checked) {
          document.querySelectorAll('.category-filter').forEach(function(cb) {
            if (cb.value !== 'all') cb.checked = false;
          });
          currentCategories = [];
        } else {
          const index = currentCategories.indexOf(this.value);
          if (this.checked && index === -1) {
            currentCategories.push(this.value);
          } else if (!this.checked && index > -1) {
            currentCategories.splice(index, 1);
          }
          document.getElementById('category-all').checked = currentCategories.length === 0;
        }
        loadProducts();
      });
    });

    return Promise.resolve();
  } catch (error) {
    console.error('Error cargando categorías:', error);
    return Promise.reject(error);
  }
}

// Cargar productos
function loadProducts() {
  const productsList = document.getElementById('productsList');
  if (!productsList) return;

  productsList.innerHTML = '';

  let filteredProducts = products;

  if (currentCategories.length > 0) {
    filteredProducts = products.filter(function(product) {
      return product.category && product.category.name && currentCategories.includes(product.category.name.toLowerCase());
    });
  }

  // Aplicar filtro de precio
  const priceRange = document.getElementById('priceRange');
  if (priceRange) {
    const maxPrice = parseInt(priceRange.value);
    filteredProducts = filteredProducts.filter(function(product) {
      return product.price <= maxPrice;
    });
  }

  // Aplicar ordenamiento
  const sortBy = document.getElementById('sortBy');
  if (sortBy) {
    const sortValue = sortBy.value;
    filteredProducts.sort(function(a, b) {
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
    document.getElementById('productCount').textContent = filteredProducts.length + ' productos';
  }

  // Mostrar productos
  filteredProducts.forEach(function(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden';
    productCard.innerHTML = '<div class="relative">' +
      '<img src="' + (product.images && product.images[0] ? product.images[0] : '/assets/img/placeholder-product.png') + '" alt="' + product.name + '" class="w-full h-48 object-cover">' +
      '<span class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">' + (product.category ? product.category.name : 'Sin categoría') + '</span>' +
      '</div>' +
      '<div class="p-4">' +
      '<h3 class="font-semibold text-lg mb-2">' + product.name + '</h3>' +
      '<p class="text-gray-600 text-sm mb-2">' + (product.description ? product.description.substring(0, 100) : '') + '...</p>' +
      '<div class="mb-4">' + formatPriceWithDiscount(product.price || 0) + '</div>' +
      '<div class="flex space-x-2">' +
      '<button class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="handleAddToCart(\'' + product._id + '\', 1)">Añadir</button>' +
      '<button class="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="viewProduct(\'' + product._id + '\')">Ver</button>' +
      '</div>' +
      '</div>';
    productsList.appendChild(productCard);
  });
}

async function viewProduct(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const product = await response.json();
    currentProduct = product;

    const modalTitle = document.getElementById("modalProductTitle");
    const modalTitle2 = document.getElementById("modalProductTitle2");
    const modalImage = document.getElementById("modalProductImage");
    const modalCategory = document.getElementById("modalProductCategory");
    const modalPrice = document.getElementById("modalProductPrice");
    const modalDescription = document.getElementById("modalProductDescription");
    const stockElement = document.getElementById("stock");
    const productQuantityInput = document.getElementById("productQuantity"); // Get the quantity input

    if (!modalTitle || !modalImage || !productQuantityInput) {
      // Added productQuantityInput check
      throw new Error(
        "Elementos del modal de producto no encontrados (modalTitle, modalImage, productQuantityInput)"
      );
    }

    modalTitle.textContent = product.name;
    if (modalTitle2) modalTitle2.textContent = product.name;
    modalImage.src =
      product.images?.[0] ||
      "https://via.placeholder.com/400x300?text=Sin+Imagen";
    modalImage.alt = product.name;

    if (modalCategory)
      modalCategory.textContent = product.category?.name || "Sin categoría";
    if (modalPrice)
      modalPrice.innerHTML = formatPriceWithDiscount(product.price || 0);
    if (modalDescription)
      modalDescription.textContent =
        product.description || "Sin descripción disponible";
    if (stockElement) stockElement.textContent = product.stock || 0;

    // Ensure the quantity input is reset/set correctly
    if (productQuantityInput) productQuantityInput.value = 1; // Start with 1 when modal opens

    // Configurar botón de agregar al carrito con el producto correcto
    const addToCartBtn = document.getElementById("addToCartBtn");
    if (addToCartBtn) {
      addToCartBtn.onclick = () => {
        const quantity = parseInt(
          document.getElementById("productQuantity")?.value || 1
        );
        handleAddToCart(product._id, quantity);
      };
    }

    // Configurar botón de comprar ahora - DIRECTO A STRIPE
    const buyNowBtn = document.getElementById("buyNowBtn");
    if (buyNowBtn) {
      // Asegurar que el botón esté habilitado y tenga el texto correcto
      buyNowBtn.disabled = false;
      buyNowBtn.innerHTML = '<i class="fas fa-bolt mr-2"></i>Comprar ahora';
      
      // Asignar event listener con verificación de autenticación mejorada
      buyNowBtn.onclick = () => {
        const quantity = parseInt(
          document.getElementById("productQuantity")?.value || 1
        );

        // Verificar autenticación usando AuthService con manejo de errores
        try {
          if (window.AuthService && window.AuthService.isAuthenticated()) {
            const user = window.AuthService.getUser();
            if (user && user.email) {
              initiateStripeCheckout(product._id, quantity);
              return;
            }
          }
          
          // Si no está autenticado, redirigir al login
          alert("Por favor inicia sesión para continuar con la compra");
          window.location.href = "/odym-frontend/auth/login.html";
        } catch (error) {
          console.error("Error en verificación de autenticación:", error);
          alert("Error al verificar autenticación. Por favor intenta de nuevo.");
        }
      };
    }

    const productModal = document.getElementById("productModal");
    if (productModal) {
      productModal.classList.add("active");
      document.body.style.overflow = "hidden";
    } else {
      throw new Error("Modal de producto no encontrado.");
    }
  } catch (error) {
    console.error("VIEW PRODUCT ERROR: Error al cargar producto:", error);
    showNotification(`Error al cargar producto: ${error.message}`, "error");
  }
}

// Stripe Checkout Integration - Unified with cart.js
async function initiateStripeCheckout(productId, quantity = 1) {
  try {
    const buyNowBtn = document.getElementById("buyNowBtn");
    if (buyNowBtn) {
      buyNowBtn.disabled = true;
      buyNowBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
    }

    const productResponse = await fetch(
      `${API_BASE_URL}/products/${productId}`
    );
    if (!productResponse.ok) {
      throw new Error(
        "INITIATE STRIPE CHECKOUT: Producto no encontrado en la API"
      );
    }
    const product = await productResponse.json();

    if (product.stock && quantity > product.stock) {
      showNotification(
        `No hay suficiente stock. Máximo: ${product.stock}`,
        "error"
      );
      console.warn("INITIATE STRIPE CHECKOUT: Stock insuficiente.");
      return;
    }

    let customerEmail = null;
    let userId = "guest";

    // Usar AuthService para obtener datos del usuario - consistente con cart.js
    if (window.AuthService && window.AuthService.isAuthenticated()) {
      const user = window.AuthService.getUser();
      customerEmail = user.email;
      userId = user.id || user._id || "guest";
    } else {
      console.error(
        "INITIATE STRIPE CHECKOUT: Usuario no autenticado. Redirigiendo a login."
      );
      alert("Por favor inicia sesión para continuar con el pago");
      window.location.href = "/odym-frontend/auth/login.html";
      return;
    }

    const items = [
      {
        productId: productId,
        quantity: quantity,
      },
    ];

    showNotification("Redirigiendo a la pasarela de pago...", "info");

    const checkoutResponse = await fetch(
      `${API_BASE_URL}/checkout/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items,
          customerEmail: customerEmail,
          userId: userId,
        }),
      }
    );

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.json();
      throw new Error(error.message || "Error al crear sesión de checkout");
    }

    const data = await checkoutResponse.json();

    if (data.success && data.url) {
      localStorage.setItem(
        "checkoutSession",
        JSON.stringify({
          sessionId: data.sessionId,
          orderId: data.orderId || null,
          timestamp: Date.now(),
          type: "buy_now",
        })
      );

      const productModal = document.getElementById("productModal");
      if (productModal) {
        productModal.classList.remove("active");
        document.body.style.overflow = "";
      }
      window.location.href = data.url;
    } else {
      throw new Error(
        data.error || "Error desconocido al obtener URL de Stripe."
      );
    }
  } catch (error) {
    console.error("INITIATE STRIPE CHECKOUT ERROR:", error);
    showNotification("Error al procesar la compra: " + error.message, "error");

    const buyNowBtn = document.getElementById("buyNowBtn");
    if (buyNowBtn) {
      buyNowBtn.disabled = false;
      buyNowBtn.innerHTML = '<i class="fas fa-bolt mr-2"></i>Comprar ahora';
    }
  }
}

// Función para cerrar modal de producto
function closeProductModal() {
  const productModal = document.getElementById("productModal");
  if (productModal) {
    productModal.classList.remove("active");
    document.body.style.overflow = "";
    
    // Limpiar event listeners y resetear estado
    const buyNowBtn = document.getElementById("buyNowBtn");
    const addToCartBtn = document.getElementById("addToCartBtn");
    
    if (buyNowBtn) {
      buyNowBtn.onclick = null;
      buyNowBtn.disabled = false;
      buyNowBtn.innerHTML = '<i class="fas fa-bolt mr-2"></i>Comprar ahora';
    }
    
    if (addToCartBtn) {
      addToCartBtn.onclick = null;
    }
    
    // Resetear valores del formulario
    const productQuantityInput = document.getElementById("productQuantity");
    if (productQuantityInput) {
      productQuantityInput.value = 1;
    }
    
    currentProduct = null;
  }
}

// Función para inicializar filtros desde URL
function initializeFiltersFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");

  if (category) {
    // Actualizar título
    document.getElementById("productsTitle").textContent = getCategoryName(category);
    
    // Agregar categoría a la lista de filtros activos
    currentCategories = [category];
    
    // Esperar a que las categorías se carguen y luego marcar el checkbox
    setTimeout(() => {
      const categoryCheckbox = document.getElementById(`category-${category}`);
      const allCheckbox = document.getElementById("category-all");
      
      if (categoryCheckbox) {
        categoryCheckbox.checked = true;
      }
      if (allCheckbox) {
        allCheckbox.checked = false;
      }
      
      // Recargar productos con el filtro aplicado
      loadProducts();
    }, 500);
  }
}

// Configurar filtros
document.addEventListener("DOMContentLoaded", function () {
  // Solo en la página de productos
  if (!document.getElementById("productsList")) return;

  // Cargar categorías primero
  loadCategories().then(() => {
    // Inicializar filtros desde URL después de cargar categorías
    initializeFiltersFromURL();
  });

  // Cargar productos
  fetch(`${API_BASE_URL}/products`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data && Array.isArray(data)) {
        products = data;
      } else {
        console.warn("Estructura de respuesta inesperada:", data);
        products = [];
      }

      // Cargar productos después de un pequeño delay para asegurar que los filtros estén listos
      setTimeout(() => {
        loadProducts();
      }, 600);
    })
    .catch((error) => {
      console.error("Error cargando productos:", error);
    });

  // Configurar rango de precio
  const priceRange = document.getElementById("priceRange");
  if (priceRange) {
    priceRange.addEventListener("input", function () {
      document.getElementById("priceMax").textContent = `$${this.value}`;
      loadProducts();
    });
  }

  // Configurar ordenamiento
  const sortBy = document.getElementById("sortBy");
  if (sortBy) {
    sortBy.addEventListener("change", function () {
      loadProducts();
    });
  }

  // Configurar botones de cantidad
  window.incrementQuantity = function () {
    const input = document.getElementById("productQuantity");
    if (input) {
      input.value = Math.min(
        parseInt(input.value || 1) + 1,
        currentProduct?.stock || 999
      );
    }
  };

  window.decrementQuantity = function () {
    const input = document.getElementById("productQuantity");
    if (input) {
      input.value = Math.max(parseInt(input.value || 1) - 1, 1);
    }
  };
});

function getCategoryName(category) {
  const names = {
    pesas: "Pesas",
    maquinas: "Máquinas",
    accesorios: "Accesorios",
    suplementos: "Suplementos",
  };
  return names[category] || "Productos";
}

// Función para mostrar notificaciones
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500"
  }`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Función para manejar agregar al carrito desde cualquier lugar
async function handleAddToCart(productId, quantity = 1) {
  try {
    // Verificar si la función addToCart está disponible
    if (typeof addToCart === "function") {
      const result = await addToCart(productId, quantity);
      if (result) {
        showNotification("Producto añadido al carrito", "success");
      }
    } else {
      // Fallback: agregar manualmente al carrito
      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!response.ok) throw new Error("Producto no encontrado");

      const product = await response.json();

      // Obtener carrito actual
      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      // Buscar si el producto ya existe
      const existingItem = cart.find((item) => item.productId === productId);

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
            stock: product.stock,
          },
        });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      showNotification(`${product.name} añadido al carrito`, "success");

      // Actualizar contador si está disponible
      if (typeof updateCartCount === "function") {
        updateCartCount();
      }
    }
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    showNotification("Error al agregar producto", "error");
  }
}

async function initiateStripeCheckout(productId, quantity = 1) {
  try {
    const buyNowBtn = document.getElementById("buyNowBtn");
    if (buyNowBtn) {
      buyNowBtn.disabled = true;
      buyNowBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';
    }

    const productResponse = await fetch(
      `${API_BASE_URL}/products/${productId}`
    );
    if (!productResponse.ok) {
      throw new Error(
        "INITIATE STRIPE CHECKOUT: Producto no encontrado en la API"
      );
    }
    const product = await productResponse.json();

    if (product.stock && quantity > product.stock) {
      showNotification(
        `No hay suficiente stock. Máximo: ${product.stock}`,
        "error"
      );
      console.warn("INITIATE STRIPE CHECKOUT: Stock insuficiente.");
      return;
    }

    let customerEmail = null;
    let userId = "guest";

    // Prefer AuthService for user details
    if (window.AuthService && window.AuthService.isAuthenticated()) {
      const user = window.AuthService.getUser();
      customerEmail = user.email;
      userId = user.id || user._id || "guest";
    } else {
      // Fallback for debugging, but should ideally rely on AuthService
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        customerEmail = user.email;
        userId = user.id || user._id || "guest";
      } else if (localStorage.getItem("userEmail")) {
        customerEmail = localStorage.getItem("userEmail");
        userId = localStorage.getItem("userId") || "guest";
      }
    }

    if (!customerEmail) {
      console.error(
        "INITIATE STRIPE CHECKOUT: Correo electrónico del cliente no encontrado. Redirigiendo a login."
      );
      alert("Por favor inicia sesión para continuar con el pago");
      window.location.href = "/odym-frontend/auth/login.html"; // Ensure this path is correct relative to your root
      return;
    }

    const items = [
      {
        productId: productId,
        quantity: quantity,
      },
    ];

    showNotification("Redirigiendo a la pasarela de pago...", "info");

    const checkoutResponse = await fetch(
      `${API_BASE_URL}/checkout/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items,
          customerEmail: customerEmail,
          userId: userId,
        }),
      }
    );

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.json();
      throw new Error(error.message || "Error al crear sesión de checkout");
    }

    const data = await checkoutResponse.json();

    if (data.success && data.url) {
      localStorage.setItem(
        "checkoutSession",
        JSON.stringify({
          sessionId: data.sessionId,
          orderId: data.orderId || null,
          timestamp: Date.now(),
          type: "buy_now",
        })
      );

      const productModal = document.getElementById("productModal");
      if (productModal) {
        productModal.classList.remove("active");
        document.body.style.overflow = "";
      }
      window.location.href = data.url;
    } else {
      throw new Error(
        data.error || "Error desconocido al obtener URL de Stripe."
      );
    }
  } catch (error) {
    console.error("INITIATE STRIPE CHECKOUT ERROR:", error);
    showNotification("Error al procesar la compra: " + error.message, "error");

    const buyNowBtn = document.getElementById("buyNowBtn");
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

// Volver a renderizar lista de productos cuando cambie el estado de autenticación
window.addEventListener('auth-change', () => {
  if (document.getElementById('productsList')) {
    loadProducts();
  }
});
window.initiateStripeCheckout = initiateStripeCheckout;
window.incrementQuantity = function () {
  const input = document.getElementById("productQuantity");
  if (input) {
    input.value = Math.min(parseInt(input.value || 1) + 1, 999);
  }
};
window.decrementQuantity = function () {
  const input = document.getElementById("productQuantity");
  if (input) {
    input.value = Math.max(parseInt(input.value || 1) - 1, 1);
  }
};
