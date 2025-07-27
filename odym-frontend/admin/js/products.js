(() => {
  const App = (() => {
    // Private variables
    let currentProduct = null;
    let htmlElements = {}; // To be populated after DOM is ready

    // API methods for interacting with the backend
    const api = {
      getProducts: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/products');
          if (!response.ok) throw new Error('Could not fetch products');
          return await response.json();
        } catch (error) {
          console.error('Error fetching products:', error);
          return [];
        }
      },
      getCategories: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/categories');
          if (!response.ok) throw new Error('Could not fetch categories');
          return await response.json();
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
        htmlElements.productCategory.innerHTML = '<option value="">Seleccionar categoría</option>';
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category._id;
          option.textContent = category.name;
          htmlElements.productCategory.appendChild(option);
        });
      },
      renderProducts: (products) => {
        if (!htmlElements.productsTableBody) return;
        htmlElements.productsTableBody.innerHTML = '';
        if (products.length === 0) {
          htmlElements.productsTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No hay productos para mostrar.</td></tr>';
          return;
        }
        products.forEach(product => {
          const row = document.createElement('tr');
          row.dataset.productId = product._id;
          const categoryName = product.category ? product.category.name : 'N/A';
          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900 product-name">${product.name}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm text-gray-900 max-w-xs truncate product-description">${product.description || ''}</div></td>
            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 product-price">$${product.price.toFixed(2)}</span></td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 product-stock">${product.stock}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 product-category" data-category-id="${product.category?._id || ''}">${categoryName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <button id="editProductBtn" class="text-orange-600 hover:text-orange-900">Editar</button>
              <button id="deleteProductBtn" class="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
            </td>
          `;
          htmlElements.productsTableBody.appendChild(row);
        });
      }
    };

    // Layout methods for loading partials and setting active links
    const layout = {
      loadAll: async () => {
        await Promise.all([
          window.loadPartial('header-container', './partials/header.html', () => {
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) pageTitle.innerText = 'Productos';
          }),
          window.loadPartial('sidebar-container', './partials/aside.html', () => {
            window.setActiveLink('products.html');
          })
        ]);
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
        };
      },
      openModal: () => {
        if (htmlElements.productModal) htmlElements.productModal.classList.remove('hidden');
      },
      closeModal: () => {
        if (htmlElements.productModal) htmlElements.productModal.classList.add('hidden');
        if (htmlElements.productForm) htmlElements.productForm.reset();
        currentProduct = null;
      },
      loadInitialData: async () => {
        try {
          const [products, categories] = await Promise.all([api.getProducts(), api.getCategories()]);
          render.renderProducts(products);
          render.renderCategories(categories);
        } catch (error) {
          console.error("Failed to load initial data.", error);
          render.renderProducts([]); // Render empty state on error
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
        await layout.loadAll(); // 1. Load HTML partials first
        methods.initHtmlElements(); // 2. Then, get references to all elements
        handlers.handleEventListeners(); // 3. Then, attach event listeners
        await methods.loadInitialData(); // 4. Finally, fetch and render data
      },
    };

    // Event Handlers
    const handlers = {
      handleCreateProduct: async (e) => {
        e.preventDefault();
      
        const formData = new FormData(htmlElements.productForm);
      
        // Obtener el input de archivos
        const fileInput = document.getElementById('productImages');
        const files = fileInput.files;
        const base64Images = [];
      
        // Convertir cada archivo a base64
        for (const file of files) {
          try {
            const base64 = await methods.toBase64(file);
            base64Images.push(base64); // Contiene "data:image/jpeg;base64,..." etc.
          } catch (err) {
            console.error('Error al convertir imagen a base64:', err);
          }
        }
      
        // Armar los datos del producto
        const productData = {
          name: formData.get('name'),
          price: formData.get('price'),
          categoryId: formData.get('category'),
          stock: formData.get('stock'),
          description: formData.get('description'),
          images: base64Images,
        };
      
        console.log('Producto a enviar:', productData);
      
        try {
          await api.createProduct(productData);
          alert('Producto creado exitosamente');
          methods.closeModal();
          const products = await api.getProducts(); // Actualiza lista
          render.renderProducts(products);
        } catch (error) {
          alert('Error al crear producto: ' + error.message);
          console.error(error);
        }
      },         
      handleUpdateProduct: async (e, productId) => {
        e.preventDefault();
        const formData = new FormData(htmlElements.productForm);
        
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
          name: formData.get('name'),
          price: parseFloat(formData.get('price')),
          categoryId: formData.get('category'),
          stock: parseInt(formData.get('stock')),
          description: formData.get('description'),
        };

        // Solo incluir imágenes si se han seleccionado nuevas
        if (base64Images.length > 0) {
          updatedData.images = base64Images;
        }
      
        try {
          await api.updateProduct(updatedData);
          alert('Producto actualizado exitosamente');
          methods.closeModal();
          const products = await api.getProducts();
          render.renderProducts(products);
        } catch (error) {
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
          htmlElements.productForm.category.value = product.category._id;
          htmlElements.productForm.stock.value = product.stock;
          htmlElements.productForm.description.value = product.description || '';
        }
        methods.openModal();
      },
      handleDeleteProduct: async (productId) => {
        const confirmed = await window.showConfirmDialog('¿Estás seguro de que deseas eliminar este producto?', 'Esta acción no se puede deshacer.');
        
        if (!confirmed) return;
        
        try {
          await api.deleteProduct(productId);
          window.showNotification('Producto eliminado exitosamente');
          const products = await api.getProducts();
          render.renderProducts(products);
        } catch (error) {
          console.error('Error al eliminar producto:', error);
          window.showNotification('Error al eliminar producto', 'error');
        }
      },
      handleEventListeners: () => {
        // Use event delegation for the dynamically loaded buttons
        document.body.addEventListener('click', (e) => {
          if (e.target.closest('#newProductBtn')) {
            handlers.handleShowNewProductModal();
          }
          
          // Edit button handler
          if (e.target.closest('#editProductBtn')) {
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
          if (e.target.closest('#deleteProductBtn')) {
            const row = e.target.closest('tr');
            const productId = row.dataset.productId;
            handlers.handleDeleteProduct(productId);
          }
        });

        // Form submit handler - handles both create and update
        if (htmlElements.productForm) {
          htmlElements.productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (currentProduct) {
              await handlers.handleUpdateProduct(e, currentProduct._id);
            } else {
              await handlers.handleCreateProduct(e);
            }
          });
        }
        
        if (htmlElements.closeModalBtn) htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        if (htmlElements.cancelProductBtn) htmlElements.cancelProductBtn.addEventListener('click', methods.closeModal);
      },
    };

    return {
      init: methods.init,
    };
  })();

  // Start the application once the initial DOM is loaded
  document.addEventListener('DOMContentLoaded', App.init);
})();