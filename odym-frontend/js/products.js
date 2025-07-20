let currentCategory = null;
let products = [];

// Cargar productos
function loadProducts() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    productsList.innerHTML = '';
    
    let filteredProducts = products;
    
    
    if (currentCategory) {
    filteredProducts = products.filter(product => {
        return product.category?.name?.toLowerCase() === currentCategory.toLowerCase();
    });
}

    
    // Aplicar filtro de precio
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        
        const maxPrice = parseInt(priceRange.value);
console.log('🔍 Filtro de precio (máx):', maxPrice);  // Asegúrate de ver este valor en consola

        
        filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);


    }
    
    // Aplicar ordenamiento
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        const sortValue = sortBy.value;
        filteredProducts.sort((a, b) => {
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
        document.getElementById('productCount').textContent = `${filteredProducts.length} productos`;
    }
    
    // Mostrar productos
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden';
        productCard.innerHTML = `
            <div class="relative">
                <img src="${product.images[0]}" alt="${product.name}" ... >

                <span class="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">${product.category.name}</span>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-2">${product.name}</h3>
                <p class="text-orange-600 font-bold mb-4">$${product.price.toFixed(2)}</p>
                
                <div class="flex space-x-2">
                    <button class="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="addToCart(${product.id})">
                        Añadir
                    </button>
                    <button class="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded transition duration-300" onclick="viewProduct(${product.id})">
                        Ver
                    </button>
                </div>
            </div>
        `;
        productsList.appendChild(productCard);
    });
}

// Configurar filtros
document.addEventListener('DOMContentLoaded', function() {
    // Solo en la página de productos
    if (!document.getElementById('productsList')) return;
    
    // Verificar parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
        currentCategory = category;
        document.getElementById('productsTitle').textContent = getCategoryName(category);
        
        // Marcar checkbox correspondiente
        document.getElementById(`category-${category}`).checked = true;
        document.getElementById('category-all').checked = false;
    }
    
    // Cargar productos desde el backend antes de renderizar
fetch('http://localhost:3000/api/products')

  .then(response => response.json())
  .then(data => {
    products = data;
    loadProducts();
  })
  .catch(error => console.error('Error cargando productos:', error));

    // Configurar filtros
    document.querySelectorAll('.category-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.value === 'all' && this.checked) {
                document.querySelectorAll('.category-filter').forEach(cb => {
                    if (cb.value !== 'all') cb.checked = false;
                });
                currentCategory = null;
            } else if (this.checked) {
                document.getElementById('category-all').checked = false;
                currentCategory = this.value;
            }
            loadProducts();
        });
    });
    
    // Configurar rango de precio
    const priceRange = document.getElementById('priceRange');
if (priceRange) {
    priceRange.addEventListener('input', function() {
        document.getElementById('priceMax').textContent = `$${this.value}`;
        loadProducts();  // 🔥 Esto es clave
    });
}

    
    // Configurar ordenamiento
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', function() {
            loadProducts();
        });
    }
});

function getCategoryName(category) {
    const names = {
        'pesas': 'Pesas',
        'maquinas': 'Máquinas',
        'accesorios': 'Accesorios',
        'suplementos': 'Suplementos'
    };
    return names[category] || 'Productos';
}