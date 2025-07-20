// Gestión de productos en el panel de administración

class ProductsManager {
  constructor() {
    this.products = [];
    this.categories = [];
    this.currentProduct = null;
    this.init();
  }

  async init() {
    await this.loadProducts();
    await this.loadCategories();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Formulario de producto
    const form = document.getElementById('productForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Botón cancelar
    const cancelBtn = document.getElementById('cancelProductBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }

    // Carga de imágenes
    const imageInput = document.getElementById('productImages');
    if (imageInput) {
      imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    }
  }

  async loadProducts() {
    try {
      showLoading();
      this.products = await api.getProducts();
      this.renderProducts();
    } catch (error) {
      showNotification('Error al cargar productos: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
  }

  async loadCategories() {
    try {
      this.categories = await api.getCategories();
      this.populateCategorySelect();
    } catch (error) {
      showNotification('Error al cargar categorías: ' + error.message, 'error');
    }
  }

  populateCategorySelect() {
    const select = document.getElementById('productCategory');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione una categoría</option>' +
      this.categories.map(category => 
        `<option value="${category._id}">${escapeHtml(category.name)}</option>`
      ).join('');
  }

  renderProducts() {
    const container = document.getElementById('productsTableBody');
    if (!container) return;

    if (this.products.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-gray-500">
            <i class="fas fa-box text-4xl mb-4"></i>
            <p>No hay productos registrados</p>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = this.products.map(product => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              ${product.images && product.images.length > 0 
                ? `<img src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-cover rounded">` 
                : `<i class="fas fa-image text-gray-400"></i>`
              }
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${escapeHtml(product.name)}</div>
              <div class="text-sm text-gray-500">${product.category?.name || 'Sin categoría'}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(product.description?.substring(0, 50) || '')}...</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(product.price)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <span class="px-2 py-1 text-xs font-semibold rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
            ${product.stock} disponibles
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.category?.name || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex space-x-2 justify-end">
            <button onclick="productsManager.editProduct('${product._id}')" 
                    class="text-blue-600 hover:text-blue-900">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="productsManager.deleteProduct('${product._id}')" 
                    class="text-red-600 hover:text-red-900">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      price: parseInt(formData.get('stock')),
      categoryId: formData.get('category'),
      images: this.getProductImages()
    };

    // Validación
    const errors = validateForm(data, {
      name: { required: true, label: 'Nombre', minLength: 3 },
      description: { required: false, label: 'Descripción' },
      price: { required: true, label: 'Precio', numeric: true, min: 0.01 },
      categoryId: { required: true, label: 'Categoría' }
    });

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        showNotification(message, 'error');
      });
      return;
    }

    try {
      showLoading();
      
      if (this.currentProduct) {
        // Actualizar
        await api.updateProduct(this.currentProduct._id, data);
        showNotification('Producto actualizado exitosamente');
      } else {
        // Crear
        await api.createProduct(data);
        showNotification('Producto creado exitosamente');
      }

      this.closeModal();
      await this.loadProducts();
    } catch (error) {
      showNotification('Error: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
  }

  getProductImages() {
    const images = [];
    const imageInputs = document.querySelectorAll('.product-image-input');
    imageInputs.forEach(input => {
      if (input.value && input.value.trim()) {
        images.push(input.value);
      }
    });
    return images;
  }

  async handleImageUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const container = document.getElementById('productImagesContainer');
    if (!container) return;

    for (let file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.addImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  addImagePreview(src) {
    const container = document.getElementById('productImagesContainer');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'relative';
    div.innerHTML = `
      <img src="${src}" alt="Preview" class="w-20 h-20 object-cover rounded">
      <input type="hidden" class="product-image-input" value="${src}">
      <button type="button" onclick="this.parentElement.remove()" 
              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(div);
  }

  async editProduct(id) {
    this.currentProduct = this.products.find(p => p._id === id);
    if (!this.currentProduct) return;

    // Llenar formulario
    document.getElementById('productName').value = this.currentProduct.name;
    document.getElementById('productDescription').value = this.currentProduct.description || '';
    document.getElementById('productPrice').value = this.currentProduct.price;
    document.getElementById('productStock').value = this.currentStock.stock;
    document.getElementById('productCategory').value = this.currentProduct.category?._id || '';
    
    // Limpiar y agregar imágenes
    const imagesContainer = document.getElementById('productImagesContainer');
    if (imagesContainer) {
      imagesContainer.innerHTML = '';
      this.currentProduct.images?.forEach(img => {
        this.addImagePreview(img);
      });
    }

    // Cambiar título del modal
    document.getElementById('productModalTitle').textContent = 'Editar Producto';
    
    this.showModal();
  }

  async deleteProduct(id) {
    const product = this.products.find(p => p._id === id);
    if (!product) return;

    showConfirmDialog(
      `¿Estás seguro de eliminar el producto "${product.name}"?`,
      async () => {
        try {
          showLoading();
          await api.deleteProduct(id);
          showNotification('Producto eliminado exitosamente');
          await this.loadProducts();
        } catch (error) {
          showNotification('Error al eliminar: ' + error.message, 'error');
        } finally {
          hideLoading();
        }
      }
    );
  }

  showNewProductModal() {
    this.currentProduct = null;
    document.getElementById('productModalTitle').textContent = 'Nuevo Producto';
    clearForm('productForm');
    
    // Limpiar imágenes
    const imagesContainer = document.getElementById('productImagesContainer');
    if (imagesContainer) imagesContainer.innerHTML = '';
    
    this.showModal();
  }

  showModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('active');
    }
  }

  closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.add('hidden');
    }
    clearForm('productForm');
    this.currentProduct = null;
  }
}

// Instancia global
let productsManager;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('products.html')) {
    productsManager = new ProductsManager();
  }
});
