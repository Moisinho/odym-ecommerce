import { loadHeaderFooter, showToast } from '../utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadHeaderFooter();
  
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId) {
    showToast('Producto no encontrado', 'error');
    window.location.href = '/products/list.html';
    return;
  }

  try {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) throw new Error('Producto no existe');
    
    const product = await response.json();
    renderProductDetail(product);
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al cargar el producto', 'error');
    window.location.href = '/products/list.html';
  }
});

function renderProductDetail(product) {
  const container = document.getElementById('product-detail');
  container.innerHTML = `
    <div class="md:flex">
      <!-- Galería de Imágenes -->
      <div class="md:w-1/2 p-6">
        <div class="mb-4 h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <img src="${product.images[0]}" alt="${product.name}" 
               class="max-h-full max-w-full object-contain" id="main-image">
        </div>
        <div class="flex space-x-2 overflow-x-auto py-2">
          ${product.images.map((img, index) => `
            <img src="${img}" alt="Miniatura ${index + 1}" 
                 class="w-16 h-16 object-cover rounded cursor-pointer border-2
                        ${index === 0 ? 'border-orange-500' : 'border-transparent'}"
                 onclick="document.getElementById('main-image').src = this.src;
                          this.classList.add('border-orange-500');
                          Array.from(this.parentNode.children).forEach(el => {
                            if (el !== this) el.classList.remove('border-orange-500');
                          });">
          `).join('')}
        </div>
      </div>

      <!-- Información del Producto -->
      <div class="md:w-1/2 p-6">
        <h1 class="text-3xl font-bold mb-2">${product.name}</h1>
        <div class="flex items-center mb-4">
          <span class="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">
            ${product.category?.name || 'Sin categoría'}
          </span>
        </div>
        
        <p class="text-orange-600 text-2xl font-bold mb-6">$${product.price.toFixed(2)}</p>
        
        <div class="mb-6">
          <h3 class="font-semibold mb-2">Descripción</h3>
          <p class="text-gray-700">${product.description}</p>
        </div>

        <!-- Selector de Cantidad -->
        <div class="mb-6">
          <label class="block text-gray-700 mb-2">Cantidad</label>
          <div class="flex items-center w-32">
            <button class="bg-gray-200 px-3 py-1 rounded-l" onclick="updateQuantity(-1)">-</button>
            <input type="number" id="quantity" value="1" min="1" 
                   class="w-full text-center border-t border-b border-gray-300 py-1">
            <button class="bg-gray-200 px-3 py-1 rounded-r" onclick="updateQuantity(1)">+</button>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex space-x-4">
          <button onclick="addToCart('${product._id}')"
                  class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded">
            <i class="fas fa-cart-plus mr-2"></i> Añadir al carrito
          </button>
          <button onclick="buyNow('${product._id}')"
                  class="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded">
            Comprar ahora
          </button>
        </div>
      </div>
    </div>
  `;
}

// Funciones globales para los botones
window.updateQuantity = function(change) {
  const input = document.getElementById('quantity');
  const newValue = parseInt(input.value) + change;
  if (newValue >= 1) input.value = newValue;
};

window.addToCart = async function(productId) {
  const quantity = parseInt(document.getElementById('quantity').value);
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  showToast('Producto añadido al carrito');
  updateCartCount();
};

window.buyNow = function(productId) {
  addToCart(productId);
  window.location.href = '/cart/checkout.html';
};