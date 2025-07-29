// Almacenamos los productos destacados en una variable global
window.featuredProducts = [];

// Utilidades de precio premium (fallback en caso de que main.js aún no haya sido cargado)
function isPremiumUserFallback() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user && ['God', 'ODYM God'].includes(user.subscription);
  } catch (_) {
    return false;
  }
}

function applyPremiumDiscountFallback(price) {
  return isPremiumUserFallback() ? price * 0.7 : price;
}

function formatPriceWithDiscountFallback(originalPrice) {
  // Si ya existe la función global de main.js úsala
  if (typeof formatPriceWithDiscount === 'function') {
    return formatPriceWithDiscount(originalPrice);
  }
  if (isPremiumUserFallback()) {
    const discountedPrice = applyPremiumDiscountFallback(originalPrice);
    return `
      <div class="price-container">
        <span class="original-price" style="text-decoration: line-through; color: #999; font-size: 0.9em;">$${originalPrice.toFixed(2)}</span>
        <span class="discounted-price" style="color: #e74c3c; font-weight: bold; margin-left: 0.5rem;">$${discountedPrice.toFixed(2)}</span>
        <span class="premium-badge" style="background: #f39c12; color: white; padding: 0.2rem 0.5rem; border-radius: 10px; font-size: 0.7em; margin-left: 0.5rem;">30% OFF</span>
      </div>`;
  }
  return `<span class="regular-price text-orange-600 font-bold">$${originalPrice.toFixed(2)}</span>`;
}

async function fetchAndRenderFeaturedProducts() {
  try {
    // Usar el endpoint de productos más comprados
    const response = await fetch('http://localhost:3000/api/products/most-purchased?limit=4');
    const products = await response.json();
    window.featuredProducts = products; // Almacenamos los productos en la variable global
    
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    container.innerHTML = products.map(product => `
      <div class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer" onclick="viewProduct('${product._id}')">
        <div class="relative">
          <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" alt="${product.name}" class="w-full h-48 object-contain bg-gray-100" />
          <span class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">${product.category?.name || 'General'}</span>
          ${product.purchaseStats ? `<span class="absolute top-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full">🔥 ${product.purchaseStats.totalQuantity} vendidos</span>` : ''}
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-lg mb-1">${product.name}</h3>
          <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || 'Sin descripción'}</p>
          <div class="flex justify-between items-center">
            <div>${formatPriceWithDiscountFallback(product.price || 0)}</div>
            ${product.purchaseStats ? `<div class="text-xs text-gray-500">${product.purchaseStats.totalOrders} órdenes</div>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading featured products:', error);
    // Fallback: cargar productos regulares si falla el endpoint de más comprados
    try {
      const fallbackResponse = await fetch('http://localhost:3000/api/products');
      const fallbackProducts = await fallbackResponse.json();
      window.featuredProducts = fallbackProducts.slice(0, 4);
      
      const container = document.getElementById('featuredProducts');
      if (!container) return;

      container.innerHTML = fallbackProducts.slice(0, 4).map(product => `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer" onclick="viewProduct('${product._id}')">
          <div class="relative">
            <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" alt="${product.name}" class="w-full h-48 object-contain bg-gray-100" />
            <span class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">${product.category?.name || 'General'}</span>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-1">${product.name}</h3>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || 'Sin descripción'}</p>
            <div>${formatPriceWithDiscountFallback(product.price || 0)}</div>
          </div>
        </div>
      `).join('');
    } catch (fallbackError) {
      console.error('Error loading fallback products:', fallbackError);
    }
  }
}

document.addEventListener('DOMContentLoaded', fetchAndRenderFeaturedProducts);

// Volver a renderizar productos destacados cuando cambie la autenticación
window.addEventListener('auth-change', fetchAndRenderFeaturedProducts);