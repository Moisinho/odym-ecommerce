/**
 * Archivo principal de funciones compartidas para el panel de administración
 */

// URL base de la API
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Carga un componente parcial en un elemento del DOM
 * @param {string} elementId - ID del elemento donde cargar el parcial
 * @param {string} url - URL del parcial
 * @param {Function} callback - Función a ejecutar después de cargar
 */
async function loadPartial(elementId, url, callback) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = data;
            if (callback) callback();
        } else {
            console.error(`Element with id '${elementId}' not found.`);
        }
    } catch (error) {
        console.error('Error loading partial:', error);
    }
}

/**
 * Establece el enlace activo en el sidebar
 * @param {string} pageName - Nombre de la página actual
 */
function setActiveLink(pageName) {
    setTimeout(() => {
        const links = document.querySelectorAll('#sidebar-container a.sidebar-link');
        links.forEach(link => {
            link.classList.remove('bg-orange-50', 'text-orange-600', 'border-l-4', 'border-orange-600', 'pl-5');
            link.classList.add('text-gray-600', 'pl-6');
            if (link.href.includes(pageName)) {
                link.classList.add('bg-orange-50', 'text-orange-600', 'border-l-4', 'border-orange-600', 'pl-5');
                link.classList.remove('text-gray-600', 'pl-6');
            }
        });
    }, 100);
}

/**
 * Muestra un diálogo de confirmación
 * @param {string} title - Título del diálogo
 * @param {string} message - Mensaje del diálogo
 * @returns {Promise<boolean>} - Promesa que se resuelve con true si se confirma, false si se cancela
 */
function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        dialog.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
                <p class="text-gray-600 mb-6">${message}</p>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-btn" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Cancelar
                    </button>
                    <button id="confirm-btn" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        Confirmar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const cancelBtn = dialog.querySelector('#cancel-btn');
        const confirmBtn = dialog.querySelector('#confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(false);
        });
        
        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(true);
        });
    });
}

// Exportar funciones globales
window.loadPartial = loadPartial;
window.setActiveLink = setActiveLink;
window.showConfirmDialog = showConfirmDialog;