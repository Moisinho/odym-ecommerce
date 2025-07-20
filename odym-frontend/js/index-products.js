async function fetchAndRenderFeaturedProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products')

    const products = await response.json();
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    container.innerHTML = products.map(product => `
      <div class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 cursor-pointer" onclick="location.href='/products/detail.html?id=${product._id}'">
        <img src="${product.images}" alt="${product.name}" class="w-full h-48 object-cover" />
        <div class="p-4">
          <h3 class="font-semibold text-lg mb-1">${product.name}</h3>
          <p class="text-gray-600 text-sm mb-3 line-clamp-2">${product.description}</p>
          <div class="text-orange-600 font-bold">$${product.price.toFixed(2)}</div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading featured products:', error);
  }
}

document.addEventListener('DOMContentLoaded', fetchAndRenderFeaturedProducts);
