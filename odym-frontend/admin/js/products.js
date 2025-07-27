(() => {
  const ProductsApp = (() => {
    // Private variables
    let currentProduct = null;
    let htmlElements = {}; // To be populated after DOM is ready
    let isInitialized = false; // Prevent multiple initializations

    // API methods for interacting with the backend
    const api = {
      getProducts: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/products');
          if (!response.ok) throw new Error('Could not fetch products');
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('Error fetching products:', error);
          return [];
        }
      },
      getCategories: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/categories');
          if (!response.ok) throw new Error('Could not fetch categories');
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('Error fetching categories:', error);
          return [];
        }
      },
      createProduct: async (productData) => {
        try {
          const response = await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not create product');
          }
          return await response.json();
        } catch (error) {
          console.error('Error creating product:', error);
          throw error;
        }
      },
      updateProduct: async (productData) => {
        try {
          const response = await fetch(`http://localhost:3000/api/products/${productData._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not update product');
          }
          return await response.json();
        } catch (error) {
          console.error('Error updating product:', error);
          throw error;
        }
      },
      deleteProduct: async (productId) => {
        try {
          const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not delete product');
          }
          return await response.json();
        } catch (error) {
          console.error('Error deleting product:', error);
          throw error;
        }
      },
    };

    // Render methods for updating the UI
    const render = {
      renderCategories: (categories) => {
        if (!htmlElements.productCategory) return;
        htmlElements.productCategory.innerHTML = '<option value="">Seleccione una categoría</option>';
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category._id;
          option.textContent = category.name;
          htmlElements.productCategory.appendChild(option);
        });
      },
      renderProducts: (products) => {
        if (!htmlElements.productsTableBody) return;

        if (products.length === 0) {
          htmlElements.productsTableBody.innerHTML = `
            <tr>
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-box text-4xl mb-4 text-gray-300"></i>
                <p>No hay productos registrados</p>
              </td>
            </tr>
          `;
          return;
        }

        htmlElements.productsTableBody.innerHTML = '';
        products.forEach(product => {
          const row = document.createElement('tr');
          row.dataset.productId = product._id;
          row.className = 'hover:bg-gray-50';

          const categoryName = product.category ? product.category.name : 'Sin categoría';
          const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;

          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                ${imageUrl ?
              `<img class="h-10 w-10 rounded-lg object-cover mr-3" src="${imageUrl}" alt="${product.name}">` :
              `<div class="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-image text-gray-400"></i>
                  </div>`
            }
                <div>
                  <div class="text-sm font-medium text-gray-900 product-name">${product.name}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900 max-w-xs truncate product-description" title="${product.description || ''}">${product.description || 'Sin descripción'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 product-price">$${parseFloat(product.price).toFixed(2)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span class="px-2 py-1 text-xs font-semibold rounded-full ${product.stock > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'} product-stock">${product.stock}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 product-category" data-category-id="${product.category?._id || ''}">${categoryName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <button class="editProductBtn text-orange-600 hover:text-orange-900 mr-3" title="Editar producto">
                <i class="fas fa-edit"></i>
              </button>
              <button class="deleteProductBtn text-red-600 hover:text-red-900" title="Eliminar producto">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          htmlElements.productsTableBody.appendChild(row);
        });
      }
    };

    // General methods
    const methods = {
      initHtmlElements: () => {
        htmlElements = {
          productModal: document.getElementById('productModal'),
          productForm: document.getElementById('productForm'),
          closeModalBtn: document.getElementById('closeModalBtn'),
          cancelProductBtn: document.getElementById('cancelProductBtn'),
          productsTableBody: document.getElementById('productsTableBody'),
          productModalTitle: document.getElementById('productModalTitle'),
          productCategory: document.getElementById('productCategory'),
          newProductBtn: document.getElementById('newProductBtn'),
        };
      },
      openModal: () => {
        if (htmlElements.productModal) {
          htmlElements.productModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
      },
      closeModal: () => {
        if (htmlElements.productModal) {
          htmlElements.productModal.classList.add('hidden');
          document.body.style.overflow = 'auto'; // Restore scrolling
        }
        if (htmlElements.productForm) htmlElements.productForm.reset();
        currentProduct = null;
      },

      cancelModal: () => {
        methods.closeModal();
      },
      loadInitialData: async () => {
        try {
          console.log('🔄 Cargando datos iniciales...');

          // Show loading state
          if (htmlElements.productsTableBody) {
            htmlElements.productsTableBody.innerHTML = `
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Cargando productos...
                </td>
              </tr>
            `;
          }

          const [products, categories] = await Promise.all([
            api.getProducts(),
            api.getCategories()
          ]);

          console.log('📦 Productos cargados:', products.length);
          console.log('🏷️ Categorías cargadas:', categories.length);

          render.renderProducts(products);
          render.renderCategories(categories);

        } catch (error) {
          console.error("❌ Failed to load initial data.", error);

          if (htmlElements.productsTableBody) {
            htmlElements.productsTableBody.innerHTML = `
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-red-500">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Error al cargar productos. Verifique la conexión con el servidor.
                </td>
              </tr>
            `;
          }
        }
      },
      toBase64(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });
      },
      init: async () => {
        if (isInitialized) {
          console.log('⚠️ ProductsApp ya está inicializado');
          return;
        }

        console.log('🚀 Inicializando ProductsApp...');
        isInitialized = true;

        methods.initHtmlElements();
        handlers.setupEventDelegation(); // Set up delegation only once
        handlers.handleEventListeners();
        await methods.loadInitialData();
        console.log('✅ ProductsApp inicializado correctamente');
      },
    };

    // Event Handlers
    const handlers = {
      handleCreateProduct: async (e) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.productForm);

          // Validar campos requeridos
          const name = formData.get('name')?.trim();
          const price = formData.get('price');
          const categoryId = formData.get('category');

          if (!name) {
            alert('El nombre del producto es requerido');
            return;
          }

          if (!price || parseFloat(price) <= 0) {
            alert('El precio debe ser mayor a 0');
            return;
          }

          if (!categoryId) {
            alert('Debe seleccionar una categoría');
            return;
          }

          // Obtener el input de archivos
          const fileInput = document.getElementById('productImages');
          const files = fileInput.files;
          const base64Images = [];

          // Convertir cada archivo a base64
          for (const file of files) {
            try {
              const base64 = await methods.toBase64(file);
              base64Images.push(base64);
            } catch (err) {
              console.error('Error al convertir imagen a base64:', err);
            }
          }

          // Armar los datos del producto
          const productData = {
            name: name,
            price: parseFloat(price),
            categoryId: categoryId,
            stock: parseInt(formData.get('stock')) || 0,
            description: formData.get('description')?.trim() || '',
            images: base64Images,
          };

          console.log('📝 Creando producto:', productData);

          const result = await api.createProduct(productData);
          console.log('✅ Producto creado:', result);

          alert('Producto creado exitosamente');
          methods.closeModal();

          // Recargar productos
          const products = await api.getProducts();
          render.renderProducts(products);

        } catch (error) {
          console.error('❌ Error al crear producto:', error);
          alert('Error al crear producto: ' + error.message);
        }
      },

      handleUpdateProduct: async (e, productId) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.productForm);

          // Validar campos requeridos
          const name = formData.get('name')?.trim();
          const price = formData.get('price');
          const categoryId = formData.get('category');

          if (!name) {
            alert('El nombre del producto es requerido');
            return;
          }

          if (!price || parseFloat(price) <= 0) {
            alert('El precio debe ser mayor a 0');
            return;
          }

          if (!categoryId) {
            alert('Debe seleccionar una categoría');
            return;
          }

          // Obtener el input de archivos
          const fileInput = document.getElementById('productImages');
          const files = fileInput.files;
          const base64Images = [];

          // Convertir cada archivo a base64 si hay nuevas imágenes
          for (const file of files) {
            try {
              const base64 = await methods.toBase64(file);
              base64Images.push(base64);
            } catch (err) {
              console.error('Error al convertir imagen a base64:', err);
            }
          }

          const updatedData = {
            _id: productId,
            name: name,
            price: parseFloat(price),
            categoryId: categoryId,
            stock: parseInt(formData.get('stock')) || 0,
            description: formData.get('description')?.trim() || '',
          };

          // Solo incluir imágenes si se han seleccionado nuevas
          if (base64Images.length > 0) {
            updatedData.images = base64Images;
          }

          console.log('✏️ Actualizando producto:', updatedData);

          const result = await api.updateProduct(updatedData);
          console.log('✅ Producto actualizado:', result);

          alert('Producto actualizado exitosamente');
          methods.closeModal();

          // Recargar productos
          const products = await api.getProducts();
          render.renderProducts(products);

        } catch (error) {
          console.error('❌ Error al actualizar producto:', error);
          alert('Error al actualizar producto: ' + error.message);
        }
      },

      handleShowNewProductModal: () => {
        currentProduct = null;
        if (htmlElements.productModalTitle) htmlElements.productModalTitle.textContent = 'Nuevo Producto';
        if (htmlElements.productForm) htmlElements.productForm.reset();
        methods.openModal();
      },

      handleShowEditProductModal: (product) => {
        currentProduct = product;
        if (htmlElements.productModalTitle) htmlElements.productModalTitle.textContent = 'Editar Producto';
        if (htmlElements.productForm) {
          htmlElements.productForm.name.value = product.name;
          htmlElements.productForm.price.value = product.price;
          htmlElements.productForm.category.value = product.category?._id || '';
          htmlElements.productForm.stock.value = product.stock;
          htmlElements.productForm.description.value = product.description || '';
        }
        methods.openModal();
      },

      handleDeleteProduct: async (productId) => {
        const confirmed = confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.');

        if (!confirmed) return;

        try {
          console.log('🗑️ Eliminando producto:', productId);
          await api.deleteProduct(productId);
          alert('Producto eliminado exitosamente');

          // Recargar productos
          const products = await api.getProducts();
          render.renderProducts(products);

        } catch (error) {
          console.error('Error al eliminar producto:', error);
          alert('Error al eliminar producto: ' + error.message);
        }
      },

      handleEventListeners: () => {
        // Remove existing listeners to prevent duplicates
        if (htmlElements.newProductBtn) {
          htmlElements.newProductBtn.removeEventListener('click', handlers.handleShowNewProductModal);
          htmlElements.newProductBtn.addEventListener('click', handlers.handleShowNewProductModal);
        }

        // Form submit handler - handles both create and update
        if (htmlElements.productForm) {
          // Remove existing listener
          htmlElements.productForm.removeEventListener('submit', handlers.handleFormSubmit);
          // Add new listener
          htmlElements.productForm.addEventListener('submit', handlers.handleFormSubmit);
        }

        // Modal close handlers
        if (htmlElements.closeModalBtn) {
          htmlElements.closeModalBtn.removeEventListener('click', methods.closeModal);
          htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        }
        if (htmlElements.cancelProductBtn) {
          htmlElements.cancelProductBtn.removeEventListener('click', methods.closeModal);
          htmlElements.cancelProductBtn.addEventListener('click', methods.cancelModal);
        }

        // Close modal when clicking outside
        if (htmlElements.productModal) {
          htmlElements.productModal.removeEventListener('click', handlers.handleModalClick);
          htmlElements.productModal.addEventListener('click', handlers.handleModalClick);
        }
      },

      // Separate form submit handler to avoid duplication
      handleFormSubmit: async (e) => {
        e.preventDefault();

        // Prevent multiple submissions
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
          if (currentProduct) {
            await handlers.handleUpdateProduct(e, currentProduct._id);
          } else {
            await handlers.handleCreateProduct(e);
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar';
        }
      },

      // Separate modal click handler
      handleModalClick: (e) => {
        if (e.target === htmlElements.productModal) {
          methods.closeModal();
        }
      },

      // Use event delegation for dynamically created buttons (only set once)
      setupEventDelegation: () => {
        // Remove existing delegation listener if it exists
        if (handlers.delegationHandler) {
          document.removeEventListener('click', handlers.delegationHandler);
        }

        // Create new delegation handler
        handlers.delegationHandler = (e) => {
          // Edit button handler
          if (e.target.closest('.editProductBtn')) {
            const row = e.target.closest('tr');
            const productId = row.dataset.productId;
            const product = {
              _id: productId,
              name: row.querySelector('.product-name').textContent,
              price: parseFloat(row.querySelector('.product-price').textContent.replace('$', '')),
              category: {
                _id: row.querySelector('.product-category').dataset.categoryId,
                name: row.querySelector('.product-category').textContent
              },
              stock: parseInt(row.querySelector('.product-stock').textContent),
              description: row.querySelector('.product-description').textContent
            };
            handlers.handleShowEditProductModal(product);
          }

          // Delete button handler
          if (e.target.closest('.deleteProductBtn')) {
            const row = e.target.closest('tr');
            const productId = row.dataset.productId;
            handlers.handleDeleteProduct(productId);
          }
        };

        // Add the delegation listener
        document.addEventListener('click', handlers.delegationHandler);
      },
    };

    return {
      init: methods.init,
    };
  })();

  // Make ProductsApp globally available
  window.ProductsApp = ProductsApp;
})();