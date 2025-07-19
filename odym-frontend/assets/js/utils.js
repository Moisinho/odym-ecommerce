// Cargar header y footer
export async function loadHeaderFooter() {
  const header = await fetch('/partials/header.html').then(res => res.text());
  const footer = await fetch('/partials/footer.html').then(res => res.text());
  
  if (document.getElementById('header')) {
    document.getElementById('header').innerHTML = header;
  }
  if (document.getElementById('footer')) {
    document.getElementById('footer').innerHTML = footer;
  }
  
  // Actualizar contador del carrito
  updateCartCount();
}

// Mostrar notificación
export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 animate-fadeIn ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Mostrar/ocultar loading
export function showLoading() {
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loader.innerHTML = `
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
  `;
  document.body.appendChild(loader);
}

export function hideLoading() {
  const loader = document.getElementById('global-loader');
  if (loader) loader.remove();
}

// Actualizar contador del carrito
export function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = document.getElementById('cart-count');
  
  if (cartCount) {
    cartCount.textContent = count;
    cartCount.classList.toggle('hidden', count === 0);
  }
}