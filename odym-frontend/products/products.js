import { loadHeaderFooter, showLoading, hideLoading, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadHeaderFooter();
  showLoading();

  // Obtener parámetros de URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('category');

  try {
    // Cargar categorías para filtros
    const categories = await fetch('/api/categories').then(res => res.json());
    renderCategoryFilters(categories, categoryId);

    // Cargar productos
    let url = '/api/products';
    if (categoryId) url += `?category=${categoryId}`;
    
    const products = await fetch(url).then(res => res.json());
    renderProducts(products);
    
    // Actualizar título si hay categoría
    if (categoryId) {
      const category = categories.find(c => c._id === categoryId);
      if (category) document.getElementById('page-title').textContent = category.name;
    }
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Error al cargar productos', 'error');
  } finally {
    hideLoading();
  }
});

function renderCategoryFilters(categories, activeCategory) {
  const container = document.getElementById('category-filters');
  container.innerHTML = `
    <a href="/products/list.html" 
       class="block py-2 px-3 rounded ${!activeCategory ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
       Todas
    </a>
    ${categories.map(cat => `
      <a href="/products/list.html?category=${cat._id}" 
         class="block py-2 px-3 rounded ${activeCategory === cat._id ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}">
         ${cat.name}
      </a>
    `).join('')}
  `;
}

function renderProducts(products) {
  const container = document.getElementById('products-grid');
  document.getElementById('product-count').textContent = `${products.length} productos`;
  
  container.innerHTML = products.map(product => `
    <div class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1">
      <img src="${product.images[0] || '/assets/img/placeholder-product.png'}" 
           alt="${product.name}" 
           class="w-full h-48 object-cover cursor-pointer"
           onclick="location.href='/products/detail.html?id=${product._id}'">
      <div class="p-4">
        <h3 class="font-semibold text-lg mb-1">${product.name}</h3>
        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
        <div class="flex justify-between items-center">
          <span class="text-orange-600 font-bold">$${product.price.toFixed(2)}</span>
          <button class="add-to-cart btn-primary py-1 px-3 text-sm" 
                  data-id="${product._id}">
            <i class="fas fa-cart-plus mr-1"></i> Añadir
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Event listeners para botones
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const productId = e.target.closest('button').dataset.id;
      await addToCart(productId);
    });
  });
}

async function addToCart(productId) {
  try {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item.productId === productId);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ productId, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Producto añadido al carrito');
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Error al añadir al carrito', 'error');
  }
}

// Actualizar contador del carrito
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = document.getElementById('cart-count');
  
  if (cartCount) {
    cartCount.textContent = count;
    cartCount.classList.toggle('hidden', count === 0);
  }
}