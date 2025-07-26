let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Función para limpiar carrito
function cleanCart() {
  try {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      const parsedCart = JSON.parse(storedCart);
      if (!Array.isArray(parsedCart)) {
        localStorage.removeItem("cart");
        cart = [];
        return;
      }

      const validCart = parsedCart.filter((item) => {
        return (
          item &&
          typeof item === "object" &&
          item.productId &&
          item.quantity &&
          item.product &&
          typeof item.product === "object" &&
          item.product.name &&
          typeof item.product.price === "number"
        );
      });

      if (validCart.length !== parsedCart.length) {
        localStorage.setItem("cart", JSON.stringify(validCart));
        cart = validCart;
      } else {
        cart = parsedCart;
      }
    }
  } catch (error) {
    console.error("Error al limpiar carrito:", error);
    localStorage.removeItem("cart");
    cart = [];
  }
}

// Función para actualizar contador del carrito
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    cartCount.textContent = count;
    if (count > 0) {
      cartCount.classList.remove("hidden");
      cartCount.style.display = "flex";
    } else {
      cartCount.classList.add("hidden");
      cartCount.style.display = "none";
    }
  }
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

// Función global para proceder al pago
async function proceedToCheckout() {
  try {
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (!checkoutBtn) {
      return;
    }

    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...';

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (cart.length === 0) {
      showNotification("El carrito está vacío", "error");
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML =
        '<i class="fas fa-credit-card mr-2"></i> Proceder al pago';
      return;
    }

    let customerEmail = null;
    let userId = null;

    if (window.AuthService && window.AuthService.isAuthenticated()) {
      const user = window.AuthService.getUser();
      customerEmail = user.email;
      userId = user.id || user._id;
    } else {
      alert("Por favor inicia sesión para continuar con el pago");
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML =
        '<i class="fas fa-credit-card mr-2"></i> Proceder al pago';
      window.location.href = "/odym-frontend/auth/login.html";
      return;
    }

    const items = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const payload = {
      items: items,
      customerEmail: customerEmail,
      userId: userId,
    };

    const response = await fetch(
      `${API_BASE_URL}/checkout/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.success && data.url) {
      localStorage.setItem(
        "checkoutSession",
        JSON.stringify({
          sessionId: data.sessionId,
          orderId: data.orderId || null,
          timestamp: Date.now(),
          type: "cart_checkout",
        })
      );

      const cartModal = document.getElementById("cartModal");
      if (cartModal) {
        cartModal.classList.remove("active");
        document.body.style.overflow = "";
      }

      window.location.href = data.url;
    } else {
      throw new Error(data.error || "Error desconocido");
    }
  } catch (error) {
    console.error("ERROR:", error);
    showNotification("Error al procesar el pago: " + error.message, "error");

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML =
        '<i class="fas fa-credit-card mr-2"></i> Proceder al pago';
    }
  }
}

// Función global para compra directa
async function buyNowFromModal(productId, quantity = 1) {
  try {
    const productResponse = await fetch(
      `${API_BASE_URL}/products/${productId}`
    );
    if (!productResponse.ok) throw new Error("Producto no encontrado");

    const product = await productResponse.json();

    if (product.stock && quantity > product.stock) {
      showNotification(
        `No hay suficiente stock. Máximo: ${product.stock}`,
        "error"
      );
      return false;
    }

    let customerEmail = null;
    let userId = null;

    if (window.AuthService && window.AuthService.isAuthenticated()) {
      const user = window.AuthService.getUser();
      customerEmail = user.email;
      userId = user.id || user._id;
    } else {
      alert("Por favor inicia sesión para continuar con la compra");
      window.location.href = "/odym-frontend/auth/login.html";
      return false;
    }

    const items = [
      {
        productId: productId,
        quantity: quantity,
      },
    ];

    const payload = {
      items: items,
      customerEmail: customerEmail,
      userId: userId,
    };

    const response = await fetch(
      `${API_BASE_URL}/checkout/create-checkout-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

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
      return true;
    } else {
      throw new Error(data.error || "Error desconocido");
    }
  } catch (error) {
    console.error("ERROR en buyNow:", error);
    showNotification("Error al procesar la compra: " + error.message, "error");
    return false;
  }
}

// Función para abrir/cerrar carrito
async function toggleCart() {
  const cartModal = document.getElementById("cartModal");
  if (!cartModal) {
    console.error("Cart modal not found");
    return;
  }

  cleanCart();

  // Actualizar modal si existe
  const cartItems = document.getElementById("cartItems");
  if (cartItems) {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
    cartItems.innerHTML = "";
    const scrollContainer = document.createElement("div");
    scrollContainer.className = "max-h-96 overflow-y-auto pr-2";

    if (cart.length === 0) {
      const emptyCartMessage = document.getElementById("emptyCartMessage");
      const cartSummary = document.getElementById("cartSummary");
      if (emptyCartMessage) emptyCartMessage.classList.remove("hidden");
      if (cartSummary) cartSummary.classList.add("hidden");
    } else {
      const emptyCartMessage = document.getElementById("emptyCartMessage");
      const cartSummary = document.getElementById("cartSummary");
      if (emptyCartMessage) emptyCartMessage.classList.add("hidden");
      if (cartSummary) cartSummary.classList.remove("hidden");

      // Renderizar productos del carrito
      cart.forEach((item, index) => {
        const product = item.product;
        if (!product) return;

        const cartItem = document.createElement("div");
        cartItem.className =
          "flex items-start py-4 border-b border-gray-200 last:border-b-0";

        const productImage =
          product.images?.[0] ||
          product.image ||
          "/assets/img/placeholder-product.png";
        const productName = product.name || "Producto sin nombre";
        const productCategory =
          product.category?.name || product.category || "Sin categoría";
        const productPrice = product.price || 0;

        cartItem.innerHTML = `
                <img src="${productImage}" alt="${productName}"
                     class="w-20 h-20 object-cover rounded bg-gray-100 flex-shrink-0">
                <div class="flex-1 ml-4">
                    <h4 class="font-semibold text-gray-900">${productName}</h4>
                    <p class="text-gray-600 text-sm">${productCategory}</p>
                    <p class="text-orange-600 font-bold text-lg mt-1">$${productPrice.toFixed(
                      2
                    )}</p>
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
                      productPrice * item.quantity
                    ).toFixed(2)}</p>
                    <button class="text-red-500 hover:text-red-700 text-sm" onclick="removeCartItem(${index})">
                        <i class="fas fa-trash mr-1"></i> Eliminar
                    </button>
                </div>
            `;
        scrollContainer.appendChild(cartItem);
      });

      cartItems.appendChild(scrollContainer);

      // Actualizar resumen
      const subtotal = cart.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
      );
      const shipping = 15;
      const total = subtotal + shipping;

      document.getElementById(
        "cartSubtotal"
      ).textContent = `$${subtotal.toFixed(2)}`;
      document.getElementById(
        "cartShipping"
      ).textContent = `$${shipping.toFixed(2)}`;
      document.getElementById("cartTotal").textContent = `$${total.toFixed(2)}`;
    }
  }

  cartModal.classList.toggle("active");

  if (cartModal.classList.contains("active")) {
    document.body.style.overflow = "hidden";

    // IMPORTANTE: Asegurar que el botón de checkout esté conectado cada vez que se abre el carrito
    setTimeout(() => {
      const checkoutBtn = document.getElementById("checkoutBtn");
      if (checkoutBtn && !checkoutBtn.onclick) {
        console.log('🔄 Reconectando botón "Proceder al pago"...');
        checkoutBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          console.log("🛒 Iniciando checkout desde carrito...");
          proceedToCheckout();
        };
        console.log('✅ Botón "Proceder al pago" reconectado');
      }
    }, 100);
  } else {
    document.body.style.overflow = "";
  }
}

// Funciones de control del carrito
function incrementCartItem(index) {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index]) {
    const product = cart[index].product;
    if (product.stock && cart[index].quantity + 1 > product.stock) {
      showNotification("No hay suficiente stock", "error");
      return;
    }
    cart[index].quantity += 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
  }
}

function decrementCartItem(index) {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index] && cart[index].quantity > 1) {
    cart[index].quantity -= 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
  }
}

function removeCartItem(index) {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart[index]) {
    const productName = cart[index].product.name;
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showNotification(`${productName} eliminado del carrito`, "info");
  }
}

// Función para cerrar modal
function closeCartModal() {
  const cartModal = document.getElementById("cartModal");
  if (cartModal) {
    cartModal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// Función para conectar todos los botones
function connectAllButtons() {
  // Conectar botón "Proceder al pago" - solo si existe
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn && !checkoutBtn.onclick) {
    checkoutBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      proceedToCheckout();
    };
  }

  // Conectar botón del carrito en el header - solo si no tiene onclick ya
  const cartButton =
    document.getElementById("cartButton") ||
    document.querySelector('[onclick="toggleCart()"]');
  if (cartButton && !cartButton.onclick) {
    cartButton.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleCart();
    };
  }

  // NO conectar el botón "Comprar ahora" aquí - se maneja en products.js
  // Esto evita conflictos con el modal de productos
}

// Función para esperar y conectar el botón del carrito con reintentos
function waitForCheckoutButton(maxRetries = 5, retryDelay = 300) {
  let retries = 0;

  const tryConnect = () => {
    const checkoutBtn = document.getElementById("checkoutBtn");

    if (checkoutBtn) {
      // Botón encontrado, conectarlo solo si no está ya conectado
      if (!checkoutBtn.onclick) {
        checkoutBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          proceedToCheckout();
        };
      }
      return true;
    }

    retries++;
    if (retries < maxRetries) {
      setTimeout(tryConnect, retryDelay);
    }

    return false;
  };

  tryConnect();
}

// Observer para detectar cuando se cargan los modales
function observeModalLoading() {
  // Intentar conectar inmediatamente
  waitForCheckoutButton();

  // Si no funciona, observar solo el contenedor de modales específicamente
  const modalsContainer = document.getElementById("modals");
  if (modalsContainer && !document.getElementById("checkoutBtn")) {
    const observer = new MutationObserver((mutations, obs) => {
      // Solo verificar si se agregó contenido al contenedor de modales
      const cartModal = document.getElementById("cartModal");
      if (cartModal) {
        setTimeout(() => {
          waitForCheckoutButton();
        }, 100);
        obs.disconnect();
      }
    });

    observer.observe(modalsContainer, {
      childList: true,
    });
  }
}

// Inicialización global
function initGlobal() {
  cleanCart();
  updateCartCount();

  // Conectar botones cuando el DOM esté listo
  const connectButtons = () => {
    connectAllButtons();
    // Solo iniciar observación de modales si es necesario
    setTimeout(() => {
      observeModalLoading();
    }, 500);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connectButtons);
  } else {
    connectButtons();
  }
}

// Inicializar
initGlobal();

// Exportar funciones globales
window.proceedToCheckout = proceedToCheckout;
window.buyNowFromModal = buyNowFromModal;
window.toggleCart = toggleCart;
window.closeCartModal = closeCartModal;
window.updateCartCount = updateCartCount;
window.incrementCartItem = incrementCartItem;
window.decrementCartItem = decrementCartItem;
window.removeCartItem = removeCartItem;
