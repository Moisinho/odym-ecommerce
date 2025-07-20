import { loadHeaderFooter, showLoading, hideLoading, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadHeaderFooter();
  showLoading();

  try {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
      showEmptyCart();
    } else {
      // Obtener detalles de productos
      const productIds = cart.map(item => item.productId);
      const response = await fetch('/api/products/by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: productIds })
      });
      const products = await response.json();
      
      renderCartItems(cart, products);
      updateCartSummary(cart, products);
    }
  } catch (error) {
    console.error('Error loading cart:', error);
    showToast('Error al cargar el carrito', 'error');
  } finally {
    hideLoading();
  }
});

function renderCartItems(cart, products) {
  const container = document.getElementById('cart-items');
  container.innerHTML = cart.map(item => {
    const product = products.find(p => p._id === item.productId);
    if (!product) return '';
    
    return `
      <div class="flex items-start py-4 border-b border-gray-200">
        <img src="${product.images[0]}" alt="${product.name}" 
             class="w-20 h-20 object-cover rounded mr-4">
        <div class="flex-1">
          <h4 class="font-semibold">${product.name}</h4>
          <p class="text-gray-600 text-sm">${product.category?.name || ''}</p>
          <div class="flex items-center mt-2">
            <button class="quantity-btn" data-id="${product._id}" data-action="decrease">-</button>
            <span class="mx-2 w-8 text-center">${item.quantity}</span>
            <button class="quantity-btn" data-id="${product._id}" data-action="increase">+</button>
          </div>
        </div>
        <div class="text-right">
          <p class="font-semibold">$${(product.price * item.quantity).toFixed(2)}</p>
          <button class="remove-btn text-red-500 mt-1" data-id="${product._id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Event listeners
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', handleQuantityChange);
  });
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', removeItem);
  });
}

function handleQuantityChange(e) {
  const productId = e.target.dataset.id;
  const action = e.target.dataset.action;
  const cart = JSON.parse(localStorage.getItem('cart'));
  
  const item = cart.find(i => i.productId === productId);
  if (!item) return;

  if (action === 'increase') {
    item.quantity += 1;
  } else if (action === 'decrease' && item.quantity > 1) {
    item.quantity -= 1;
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  location.reload(); // Recargar para actualizar precios
}

function removeItem(e) {
  const productId = e.target.closest('button').dataset.id;
  let cart = JSON.parse(localStorage.getItem('cart'));
  
  cart = cart.filter(item => item.productId !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  location.reload();
}

function updateCartSummary(cart, products) {
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find(p => p._id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);
  
  const shipping = subtotal > 0 ? 99.99 : 0;
  const total = subtotal + shipping;

  document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
  document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function showEmptyCart() {
  document.getElementById('cart-container').innerHTML = `
    <div class="text-center py-12">
      <i class="fas fa-shopping-cart text-gray-300 text-5xl mb-4"></i>
      <p class="text-gray-500 text-lg mb-4">Tu carrito está vacío</p>
      <a href="/products/list.html" class="btn-primary inline-block">Ver productos</a>
    </div>
  `;
}