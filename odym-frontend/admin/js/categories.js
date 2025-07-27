(() => {
  const App = (() => {
    // API
    const api = {
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
      createCategory: async (categoryData) => {
        try {
          const response = await fetch('http://localhost:3000/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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
    };

    // HTML Elements
    const htmlElements = {
      newCategoryBtn: document.getElementById('newCategoryBtn'),
      categoryModal: document.getElementById('categoryModal'),
      categoryForm: document.getElementById('categoryForm'),
      closeModalBtn: document.getElementById('closeModalBtn'),
      cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
      categoryModalTitle: document.getElementById('categoryModalTitle'),
      categoriesTableBody: document.getElementById('categoriesTableBody'),
    };

    // Render methods
    const render = {
      renderCategories: (categories) => {
        htmlElements.categoriesTableBody.innerHTML = '';
        if (categories.length === 0) {
          htmlElements.categoriesTableBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">No hay categorías para mostrar.</td></tr>';
          return;
        }
        categories.forEach(category => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${category.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${category.description || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <a href="#" class="text-orange-600 hover:text-orange-900">Editar</a>
              <a href="#" class="text-red-600 hover:text-red-900 ml-4">Eliminar</a>
            </td>
          `;
          htmlElements.categoriesTableBody.appendChild(row);
        });
      }
    }

    // Layout
    const layout = {
      loadAll: async () => {
        await Promise.all([
          window.loadPartial('header-container', './partials/header.html', () => {
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) pageTitle.innerText = 'Categorías';
          }),
          window.loadPartial('sidebar-container', './partials/aside.html', () => {
            window.setActiveLink('categories.html');
          })
        ]);
      }
    };

    // Methods
    const methods = {
      openModal: () => {
        htmlElements.categoryModal.classList.remove('hidden');
      },
      closeModal: () => {
        htmlElements.categoryModal.classList.add('hidden');
        htmlElements.categoryForm.reset();
      },
      init: async () => {
        await layout.loadAll();
        try {
          const categories = await api.getCategories();
          render.renderCategories(categories);
        } catch (error) {
          console.error("Failed to load categories.", error);
        } finally {
          handlers.handleEventListeners();
        }
      },
    };

    // Handlers
    const handlers = {
      handleCreateCategory: async (e) => {
        e.preventDefault();
        const formData = new FormData(htmlElements.categoryForm);
        const categoryData = {
          name: formData.get('name'),
          description: formData.get('description'),
        };

        try {
          await api.createCategory(categoryData);
          alert('Categoría creada exitosamente');
          methods.closeModal();
          // Refresh category list
          const categories = await api.getCategories();
          render.renderCategories(categories);
        } catch (error) {
          alert('Error al crear categoría: ' + error.message);
        }
      },
      handleShowNewCategoryModal: () => {
        htmlElements.categoryModalTitle.textContent = 'Nueva Categoría';
        htmlElements.categoryForm.reset();
        methods.openModal();
      },
      handleEventListeners: () => {
        htmlElements.newCategoryBtn.addEventListener('click', handlers.handleShowNewCategoryModal);
        htmlElements.categoryForm.addEventListener('submit', handlers.handleCreateCategory);
        htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        htmlElements.cancelCategoryBtn.addEventListener('click', methods.closeModal);
      },
    };

    return {
      init: methods.init,
    };
  })();

  document.addEventListener('DOMContentLoaded', App.init);
})();
