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
    stock: parseInt(formData.get('stock')),
    categoryId: formData.get('category')
  };

  // Validación (mantén tu validación existente)
  const errors = validateForm(data, {
    name: { required: true, label: 'Nombre', minLength: 3 },
    description: { required: false, label: 'Descripción' },
    price: { required: true, label: 'Precio', numeric: true, min: 0.01 },
    stock: { required: true, label: 'Stock', numeric: true, min: 0 },
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
    
    // Procesar imágenes
    const imageInput = document.getElementById('productImages');
    const imagePreviews = this.getProductImages();
    
    // Si hay nuevas imágenes seleccionadas
    if (imageInput.files.length > 0) {
      data.images = [];
      
      // Procesar imágenes nuevas
      for (let file of imageInput.files) {
        if (file.type.startsWith('image/')) {
          const compressedImage = await this.compressImage(file);
          const imgUrl = await this.uploadImageToImgBB(compressedImage);
          data.images.push(imgUrl);
        }
      }
      
      // Mantener imágenes existentes si estamos editando
      if (this.currentProduct) {
        data.images = [...data.images, ...imagePreviews.filter(img => 
          img.startsWith('http') && // Solo URLs (no base64)
          !img.includes('data:image') // Excluir base64
        )];
      }
    } else {
      // Usar solo imágenes existentes (para edición)
      data.images = imagePreviews;
    }

    if (this.currentProduct) {
      // Actualizar producto
      const response = await api.updateProduct(this.currentProduct._id, data);
      if (!response) throw new Error('No se recibió respuesta del servidor');
      showNotification('Producto actualizado exitosamente');
    } else {
      // Crear nuevo producto
      await api.createProduct(data);
      showNotification('Producto creado exitosamente');
    }

    this.closeModal();
    await this.loadProducts();
  } catch (error) {
    console.error('Error en handleSubmit:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    hideLoading();
  }
}
async uploadImageToImgBB(base64Image) {
  try {
    const formData = new FormData();
    formData.append('key', process.env.IMGBB_API_KEY); // Asegúrate de tener esta variable configurada
    formData.append('image', base64Image.replace(/^data:image\/\w+;base64,/, ''));

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.data || !result.data.url) {
      throw new Error('No se recibió URL de imagen desde imgBB');
    }

    return result.data.url;
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
}

  getProductImages() {
  const images = [];
  const imageInputs = document.querySelectorAll('.product-image-input');
  
  imageInputs.forEach(input => {
    if (input.value && input.value.trim()) {
      // Solo incluir si es URL (http/https) o base64 válido
      if (input.value.startsWith('http') || input.value.startsWith('data:image')) {
        images.push(input.value);
      }
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
        try {
          showLoading();
          const compressedImage = await this.compressImage(file);
          this.addImagePreview(compressedImage);
        } catch (error) {
          showNotification('Error al procesar imagen: ' + error.message, 'error');
        } finally {
          hideLoading();
        }
      }
    }
  }

  async compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Check size and compress further if needed (max ~1MB base64)
        const maxSize = 1000000; // ~1MB in base64
        let currentQuality = quality;
        
        while (compressedDataUrl.length > maxSize && currentQuality > 0.1) {
          currentQuality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }
        
        // If still too large, reduce dimensions
        if (compressedDataUrl.length > maxSize) {
          const newWidth = Math.floor(width * 0.8);
          const newHeight = Math.floor(height * 0.8);
          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        }
        
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Error al cargar imagen'));
      
      // Create object URL for the image
      img.src = URL.createObjectURL(file);
    });
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
  try {
    showLoading();
    this.currentProduct = this.products.find(p => p._id === id);
    if (!this.currentProduct) throw new Error('Producto no encontrado');

    // Llenar formulario
    document.getElementById('productName').value = this.currentProduct.name;
    document.getElementById('productDescription').value = this.currentProduct.description || '';
    document.getElementById('productPrice').value = this.currentProduct.price;
    document.getElementById('productStock').value = this.currentProduct.stock;
    document.getElementById('productCategory').value = this.currentProduct.category?._id || '';
    
    // Limpiar y agregar imágenes existentes
    const imagesContainer = document.getElementById('productImagesContainer');
    if (imagesContainer) {
      imagesContainer.innerHTML = '';
      if (this.currentProduct.images?.length > 0) {
        this.currentProduct.images.forEach(img => {
          // Solo mostrar imágenes que sean URLs válidas
          if (img.startsWith('http')) {
            this.addImagePreview(img);
          }
        });
      }
    }

    // Cambiar título del modal
    document.getElementById('productModalTitle').textContent = 'Editar Producto';
    
    this.showModal();
  } catch (error) {
    showNotification(`Error al cargar producto: ${error.message}`, 'error');
    console.error('Error en editProduct:', error);
  } finally {
    hideLoading();
  }
}

  async deleteProduct(id) {
    const product = this.products.find(p => p._id === id);
    if (!product) {
      showNotification('Producto no encontrado', 'error');
      return;
    }

    showConfirmDialog(
      `¿Estás seguro de eliminar el producto "${product.name}"?`,
      async () => {
        try {
          showLoading();
          await api.deleteProduct(id);
          showNotification('Producto eliminado exitosamente');
          await this.loadProducts();
        } catch (error) {
          console.error('Error en deleteProduct:', error);
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