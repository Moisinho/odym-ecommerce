(() => {
  const CategoriesApp = (() => {
    // Private variables
    let currentCategory = null;
    let htmlElements = {}; // To be populated after DOM is ready
    let isInitialized = false; // Prevent multiple initializations

    // API methods for interacting with the backend
    const api = {
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
      createCategory: async (categoryData) => {
        try {
          const response = await fetch('http://localhost:3000/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not create category');
          }
          return await response.json();
        } catch (error) {
          console.error('Error creating category:', error);
          throw error;
        }
      },
      updateCategory: async (categoryData) => {
        try {
          const response = await fetch(`http://localhost:3000/api/categories/${categoryData._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not update category');
          }
          return await response.json();
        } catch (error) {
          console.error('Error updating category:', error);
          throw error;
        }
      },
      deleteCategory: async (categoryId) => {
        try {
          const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not delete category');
          }
          return await response.json();
        } catch (error) {
          console.error('Error deleting category:', error);
          throw error;
        }
      },
    };

    // Render methods for updating the UI
    const render = {
      renderCategories: (categories) => {
        if (!htmlElements.categoriesTableBody) return;

        if (categories.length === 0) {
          htmlElements.categoriesTableBody.innerHTML = `
            <tr>
              <td colspan="3" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-tags text-4xl mb-4 text-gray-300"></i>
                <p>No hay categorías registradas</p>
              </td>
            </tr>
          `;
          return;
        }

        htmlElements.categoriesTableBody.innerHTML = '';
        categories.forEach(category => {
          const row = document.createElement('tr');
          row.dataset.categoryId = category._id;
          row.className = 'hover:bg-gray-50';

          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 category-name">${category.name}</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-gray-900 max-w-xs truncate category-description" title="${category.description || ''}">${category.description || 'Sin descripción'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <button class="editCategoryBtn text-orange-600 hover:text-orange-900 mr-3" title="Editar categoría">
                <i class="fas fa-edit"></i>
              </button>
              <button class="deleteCategoryBtn text-red-600 hover:text-red-900" title="Eliminar categoría">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          htmlElements.categoriesTableBody.appendChild(row);
        });
      }
    };

    // General methods
    const methods = {
      initHtmlElements: () => {
        htmlElements = {
          categoryModal: document.getElementById('categoryModal'),
          categoryForm: document.getElementById('categoryForm'),
          closeModalBtn: document.getElementById('closeModalBtn'),
          cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
          categoriesTableBody: document.getElementById('categoriesTableBody'),
          categoryModalTitle: document.getElementById('categoryModalTitle'),
          newCategoryBtn: document.getElementById('newCategoryBtn'),
        };
      },
      openModal: () => {
        if (htmlElements.categoryModal) {
          htmlElements.categoryModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
      },
      closeModal: () => {
        if (htmlElements.categoryModal) {
          htmlElements.categoryModal.classList.add('hidden');
          document.body.style.overflow = 'auto'; // Restore scrolling
        }
        if (htmlElements.categoryForm) htmlElements.categoryForm.reset();
        currentCategory = null;
      },

      cancelModal: () => {
        methods.closeModal();
      },
      loadInitialData: async () => {
        try {
          console.log('🔄 Cargando datos iniciales...');

          // Show loading state
          if (htmlElements.categoriesTableBody) {
            htmlElements.categoriesTableBody.innerHTML = `
              <tr>
                <td colspan="3" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Cargando categorías...
                </td>
              </tr>
            `;
          }

          const categories = await api.getCategories();

          console.log('🏷️ Categorías cargadas:', categories.length);

          render.renderCategories(categories);

        } catch (error) {
          console.error("❌ Failed to load initial data.", error);

          if (htmlElements.categoriesTableBody) {
            htmlElements.categoriesTableBody.innerHTML = `
              <tr>
                <td colspan="3" class="px-4 py-8 text-center text-red-500">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Error al cargar categorías. Verifique la conexión con el servidor.
                </td>
              </tr>
            `;
          }
        }
      },
      init: async () => {
        if (isInitialized) {
          console.log('⚠️ CategoriesApp ya está inicializado');
          return;
        }

        console.log('🚀 Inicializando CategoriesApp...');
        isInitialized = true;

        methods.initHtmlElements();
        handlers.setupEventDelegation(); // Set up delegation only once
        handlers.handleEventListeners();
        await methods.loadInitialData();
        console.log('✅ CategoriesApp inicializado correctamente');
      },
    };

    // Event Handlers
    const handlers = {
      handleCreateCategory: async (e) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.categoryForm);

          // Validar campos requeridos
          const name = formData.get('name')?.trim();

          if (!name) {
            alert('El nombre de la categoría es requerido');
            return;
          }

          // Armar los datos de la categoría
          const categoryData = {
            name: name,
            description: formData.get('description')?.trim() || '',
          };

          console.log('📝 Creando categoría:', categoryData);

          const result = await api.createCategory(categoryData);
          console.log('✅ Categoría creada:', result);

          alert('Categoría creada exitosamente');
          methods.closeModal();

          // Recargar categorías
          const categories = await api.getCategories();
          render.renderCategories(categories);

        } catch (error) {
          console.error('❌ Error al crear categoría:', error);
          alert('Error al crear categoría: ' + error.message);
        }
      },

      handleUpdateCategory: async (e, categoryId) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.categoryForm);

          // Validar campos requeridos
          const name = formData.get('name')?.trim();

          if (!name) {
            alert('El nombre de la categoría es requerido');
            return;
          }

          const updatedData = {
            _id: categoryId,
            name: name,
            description: formData.get('description')?.trim() || '',
          };

          console.log('✏️ Actualizando categoría:', updatedData);

          const result = await api.updateCategory(updatedData);
          console.log('✅ Categoría actualizada:', result);

          alert('Categoría actualizada exitosamente');
          methods.closeModal();

          // Recargar categorías
          const categories = await api.getCategories();
          render.renderCategories(categories);

        } catch (error) {
          console.error('❌ Error al actualizar categoría:', error);
          alert('Error al actualizar categoría: ' + error.message);
        }
      },

      handleShowNewCategoryModal: () => {
        currentCategory = null;
        if (htmlElements.categoryModalTitle) htmlElements.categoryModalTitle.textContent = 'Nueva Categoría';
        if (htmlElements.categoryForm) htmlElements.categoryForm.reset();
        methods.openModal();
      },

      handleShowEditCategoryModal: (category) => {
        currentCategory = category;
        if (htmlElements.categoryModalTitle) htmlElements.categoryModalTitle.textContent = 'Editar Categoría';
        if (htmlElements.categoryForm) {
          htmlElements.categoryForm.name.value = category.name;
          htmlElements.categoryForm.description.value = category.description || '';
        }
        methods.openModal();
      },

      handleDeleteCategory: async (categoryId) => {
        const confirmed = confirm('¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.');

        if (!confirmed) return;

        try {
          console.log('🗑️ Eliminando categoría:', categoryId);
          await api.deleteCategory(categoryId);
          alert('Categoría eliminada exitosamente');

          // Recargar categorías
          const categories = await api.getCategories();
          render.renderCategories(categories);

        } catch (error) {
          console.error('Error al eliminar categoría:', error);
          alert('Error al eliminar categoría: ' + error.message);
        }
      },

      handleEventListeners: () => {
        // Remove existing listeners to prevent duplicates
        if (htmlElements.newCategoryBtn) {
          htmlElements.newCategoryBtn.removeEventListener('click', handlers.handleShowNewCategoryModal);
          htmlElements.newCategoryBtn.addEventListener('click', handlers.handleShowNewCategoryModal);
        }

        // Form submit handler - handles both create and update
        if (htmlElements.categoryForm) {
          // Remove existing listener
          htmlElements.categoryForm.removeEventListener('submit', handlers.handleFormSubmit);
          // Add new listener
          htmlElements.categoryForm.addEventListener('submit', handlers.handleFormSubmit);
        }

        // Modal close handlers
        if (htmlElements.closeModalBtn) {
          htmlElements.closeModalBtn.removeEventListener('click', methods.closeModal);
          htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        }
        if (htmlElements.cancelCategoryBtn) {
          htmlElements.cancelCategoryBtn.removeEventListener('click', methods.closeModal);
          htmlElements.cancelCategoryBtn.addEventListener('click', methods.cancelModal);
        }

        // Close modal when clicking outside
        if (htmlElements.categoryModal) {
          htmlElements.categoryModal.removeEventListener('click', handlers.handleModalClick);
          htmlElements.categoryModal.addEventListener('click', handlers.handleModalClick);
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
          if (currentCategory) {
            await handlers.handleUpdateCategory(e, currentCategory._id);
          } else {
            await handlers.handleCreateCategory(e);
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar';
        }
      },

      // Separate modal click handler
      handleModalClick: (e) => {
        if (e.target === htmlElements.categoryModal) {
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
          if (e.target.closest('.editCategoryBtn')) {
            const row = e.target.closest('tr');
            const categoryId = row.dataset.categoryId;
            const category = {
              _id: categoryId,
              name: row.querySelector('.category-name').textContent,
              description: row.querySelector('.category-description').textContent
            };
            handlers.handleShowEditCategoryModal(category);
          }

          // Delete button handler
          if (e.target.closest('.deleteCategoryBtn')) {
            const row = e.target.closest('tr');
            const categoryId = row.dataset.categoryId;
            handlers.handleDeleteCategory(categoryId);
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

  // Make CategoriesApp globally available
  window.CategoriesApp = CategoriesApp;
})();
