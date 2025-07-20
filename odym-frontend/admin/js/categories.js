// Gestión de categorías en el panel de administración

class CategoriesManager {
  constructor() {
    this.categories = [];
    this.currentCategory = null;
    this.init();
  }

  async init() {
    await this.loadCategories();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Formulario de categoría
    const form = document.getElementById('categoryForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Botón cancelar
    const cancelBtn = document.getElementById('cancelCategoryBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }
  }

  async loadCategories() {
    try {
      showLoading();
      this.categories = await api.getCategories();
      this.renderCategories();
    } catch (error) {
      showNotification('Error al cargar categorías: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
  }

  renderCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;

    if (this.categories.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-folder-open text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">No hay categorías registradas</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.categories.map(category => `
      <div class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-semibold text-gray-800">${escapeHtml(category.name)}</h3>
          <div class="flex space-x-2">
            <button onclick="categoriesManager.editCategory('${category._id}')" 
                    class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="categoriesManager.deleteCategory('${category._id}')" 
                    class="text-red-600 hover:text-red-800">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <p class="text-gray-600 text-sm">${escapeHtml(category.description || 'Sin descripción')}</p>
        <div class="mt-4 text-xs text-gray-500">
          ID: ${category._id.substring(0, 8)}...
        </div>
      </div>
    `).join('');
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description')
    };

    // Validación
    const errors = validateForm(data, {
      name: { required: true, label: 'Nombre', minLength: 3 },
      description: { required: false, label: 'Descripción' }
    });

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        showNotification(message, 'error');
      });
      return;
    }

    try {
      showLoading();
      
      if (this.currentCategory) {
        // Actualizar
        await api.updateCategory(this.currentCategory._id, data);
        showNotification('Categoría actualizada exitosamente');
      } else {
        // Crear
        await api.createCategory(data);
        showNotification('Categoría creada exitosamente');
      }

      this.closeModal();
      await this.loadCategories();
    } catch (error) {
      showNotification('Error: ' + error.message, 'error');
    } finally {
      hideLoading();
    }
  }

  async editCategory(id) {
    this.currentCategory = this.categories.find(c => c._id === id);
    if (!this.currentCategory) return;

    // Llenar formulario
    document.getElementById('categoryName').value = this.currentCategory.name;
    document.getElementById('categoryDescription').value = this.currentCategory.description || '';
    
    // Cambiar título del modal
    document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
    
    this.showModal();
  }

  async deleteCategory(id) {
    const category = this.categories.find(c => c._id === id);
    if (!category) return;

    showConfirmDialog(
      `¿Estás seguro de eliminar la categoría "${category.name}"?`,
      async () => {
        try {
          showLoading();
          await api.deleteCategory(id);
          showNotification('Categoría eliminada exitosamente');
          await this.loadCategories();
        } catch (error) {
          showNotification('Error al eliminar: ' + error.message, 'error');
        } finally {
          hideLoading();
        }
      }
    );
  }

  showNewCategoryModal() {
    this.currentCategory = null;
    document.getElementById('categoryModalTitle').textContent = 'Nueva Categoría';
    clearForm('categoryForm');
    this.showModal();
  }

  showModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('active');
    }
  }

  closeModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
      modal.classList.remove('active');
      modal.classList.add('hidden');
    }
    clearForm('categoryForm');
    this.currentCategory = null;
  }
}

// Instancia global
let categoriesManager;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('categories.html')) {
    categoriesManager = new CategoriesManager();
  }
});
