// Almacenamos los productos destacados en una variable global
window.featuredProducts = [];

async function fetchAndRenderFeaturedProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products');
    const products = await response.json();
    window.featuredProducts = products; // Almacenamos los productos en la variable global
    
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    container.innerHTML = products.map(product => `
      <div class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer" onclick="viewProduct('${product._id}')">
        <div class="relative">
          <img src="${product.images[0]}" alt="${product.name}" class="w-full h-48 object-contain bg-gray-100" />
          <span class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">${product.category?.name || 'General'}</span>
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-lg mb-1">${product.name}</h3>
          <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description || 'Sin descripción'}</p>
          <div class="text-orange-600 font-bold">$${product.price?.toFixed(2) || '0.00'}</div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading featured products:', error);
  }
}

document.addEventListener('DOMContentLoaded', fetchAndRenderFeaturedProducts);