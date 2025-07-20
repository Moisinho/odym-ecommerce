// Utilidades para el panel de administración

// Mostrar notificación toast
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  } text-white`;
  
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
      <span>${message}</span>
      <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Auto-remover después de 3 segundos
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Mostrar loading overlay
function showLoading() {
  const loading = document.createElement('div');
  loading.id = 'loading-overlay';
  loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  loading.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg">
      <div class="flex items-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span class="ml-3">Cargando...</span>
      </div>
    </div>
  `;
  document.body.appendChild(loading);
}

// Ocultar loading overlay
function hideLoading() {
  const loading = document.getElementById('loading-overlay');
  if (loading) loading.remove();
}

// Confirmación de eliminación
function showConfirmDialog(message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">Confirmar eliminación</h3>
      <p class="text-gray-600 mb-6">${message}</p>
      <div class="flex justify-end space-x-3">
        <button class="px-4 py-2 text-gray-600 hover:text-gray-800" onclick="this.closest('.fixed').remove()">
          Cancelar
        </button>
        <button class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onclick="this.closest('.fixed').remove(); onConfirm()">
          Eliminar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

// Validar formulario
function validateForm(formData, rules) {
  const errors = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = formData[field];
    
    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = `${rule.label || field} es requerido`;
    }
    
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} debe tener al menos ${rule.minLength} caracteres`;
    }
    
    if (rule.numeric && value && isNaN(value)) {
      errors[field] = `${rule.label || field} debe ser un número`;
    }
    
    if (rule.min && value && parseFloat(value) < rule.min) {
      errors[field] = `${rule.label || field} debe ser mayor o igual a ${rule.min}`;
    }
  }
  
  return errors;
}

// Limpiar formulario
function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) form.reset();
}

// Llenar formulario con datos
function populateForm(formId, data) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  Object.keys(data).forEach(key => {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = data[key];
      } else if (input.type === 'file') {
        // No llenar inputs de archivo
      } else {
        input.value = data[key];
      }
    }
  });
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
