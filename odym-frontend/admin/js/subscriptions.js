/**
 * Módulo para la gestión de suscripciones
 */
const App = (function() {
    'use strict';

    // Variables del módulo
    let currentPlan = null;
    let plans = [];

    // Elementos del DOM
    let elements = {
        newPlanBtn: null,
        plansTableBody: null,
        planModal: null,
        planForm: null,
        planModalTitle: null,
        closeModalBtn: null,
        cancelPlanBtn: null,
        planName: null,
        planDescription: null,
        planPrice: null,
        planDuration: null,
        planStatus: null,
        featuresContainer: null,
        addFeatureBtn: null
    };

    /**
     * API - Métodos para interactuar con el backend
     */
    const api = {
        /**
         * Obtiene la lista de planes de suscripción
         * @returns {Promise<Array>} - Lista de planes
         */
        getPlans: async function() {
            try {
                const response = await fetch(`${API_BASE_URL}/subscriptions/plans`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Error al obtener planes');
                }
                
                return data.plans || [];
            } catch (error) {
                console.error('Error al obtener planes:', error);
                showNotification('Error al cargar los planes de suscripción', 'error');
                return [];
            }
        },

        /**
         * Crea un nuevo plan de suscripción
         * @param {Object} planData - Datos del plan
         * @returns {Promise<Object>} - Plan creado
         */
        createPlan: async function(planData) {
            try {
                const response = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(planData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Error al crear el plan');
                }
                
                showNotification('Plan creado correctamente', 'success');
                return data.plan;
            } catch (error) {
                console.error('Error al crear plan:', error);
                showNotification('Error al crear el plan', 'error');
                throw error;
            }
        },

        /**
         * Actualiza un plan de suscripción existente
         * @param {string} planId - ID del plan
         * @param {Object} planData - Datos actualizados del plan
         * @returns {Promise<Object>} - Plan actualizado
         */
        updatePlan: async function(planId, planData) {
            try {
                const response = await fetch(`${API_BASE_URL}/subscriptions/plans/${planId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(planData)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Error al actualizar el plan');
                }
                
                showNotification('Plan actualizado correctamente', 'success');
                return data.plan;
            } catch (error) {
                console.error('Error al actualizar plan:', error);
                showNotification('Error al actualizar el plan', 'error');
                throw error;
            }
        },

        /**
         * Elimina un plan de suscripción
         * @param {string} planId - ID del plan
         * @returns {Promise<boolean>} - Resultado de la operación
         */
        deletePlan: async function(planId) {
            try {
                const response = await fetch(`${API_URL}/subscriptions/plans/${planId}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Error al eliminar el plan');
                }
                
                showNotification('Plan eliminado correctamente', 'success');
                return true;
            } catch (error) {
                console.error('Error al eliminar plan:', error);
                showNotification('Error al eliminar el plan', 'error');
                return false;
            }
        },

        /**
         * Obtiene los suscriptores de un plan
         * @param {string} planId - ID del plan
         * @returns {Promise<Array>} - Lista de suscriptores
         */
        getPlanSubscribers: async function(planId) {
            try {
                const response = await fetch(`${API_BASE_URL}/subscriptions/plans/${planId}/subscribers`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Error al obtener suscriptores');
                }
                
                return data.subscribers || [];
            } catch (error) {
                console.error('Error al obtener suscriptores:', error);
                showNotification('Error al cargar los suscriptores', 'error');
                return [];
            }
        }
    };

    /**
     * Render - Métodos para actualizar la UI
     */
    const render = {
        /**
         * Renderiza la lista de planes en la tabla
         * @param {Array} plansList - Lista de planes
         */
        plans: function(plansList) {
            const tableBody = elements.plansTableBody;
            tableBody.innerHTML = '';
            
            if (!plansList || plansList.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No se encontraron planes de suscripción
                    </td>
                `;
                tableBody.appendChild(emptyRow);
                return;
            }
            
            plansList.forEach(plan => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.dataset.id = plan._id;
                
                // Formatear precio
                const formattedPrice = `$${parseFloat(plan.price).toFixed(2)}/mes`;
                
                // Formatear estado
                const statusMap = {
                    'active': { text: 'Activo', class: 'bg-green-100 text-green-800' },
                    'inactive': { text: 'Inactivo', class: 'bg-red-100 text-red-800' }
                };
                
                const status = statusMap[plan.status] || { text: plan.status, class: 'bg-gray-100 text-gray-800' };
                
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${plan.name}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${formattedPrice}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${plan.subscribersCount || 0}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.class}">
                            ${status.text}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button class="text-orange-600 hover:text-orange-900 edit-plan-btn">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="text-red-600 hover:text-red-900 delete-plan-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        },

        /**
         * Renderiza las características del plan en el formulario
         * @param {Array} features - Lista de características
         */
        features: function(features = []) {
            const container = elements.featuresContainer;
            container.innerHTML = '';
            
            // Si no hay características, agregar una vacía
            if (!features || features.length === 0) {
                features = [''];
            }
            
            features.forEach(feature => {
                const featureItem = document.createElement('div');
                featureItem.className = 'feature-item flex items-center mb-2';
                featureItem.innerHTML = `
                    <input type="text" name="features[]" value="${feature}" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Característica del plan">
                    <button type="button" class="remove-feature ml-2 text-red-500 hover:text-red-700">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                container.appendChild(featureItem);
            });
            
            // Agregar eventos a los botones de eliminar
            const removeButtons = container.querySelectorAll('.remove-feature');
            removeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const featureItem = this.closest('.feature-item');
                    if (container.children.length > 1) {
                        featureItem.remove();
                    } else {
                        featureItem.querySelector('input').value = '';
                    }
                });
            });
        }
    };

    /**
     * Layout - Métodos para cargar componentes de la interfaz
     */
    const layout = {
        /**
         * Carga todos los componentes parciales
         */
        loadAll: async function() {
            await Promise.all([
                window.loadPartial('header-container', './partials/header.html', () => {
                    const pageTitle = document.getElementById('page-title');
                    if (pageTitle) pageTitle.innerText = 'Suscripciones';
                }),
                window.loadPartial('sidebar-container', './partials/aside.html', () => {
                    window.setActiveLink('subscriptions.html');
                })
            ]);
        }
    };

    /**
     * Methods - Métodos generales del módulo
     */
    const methods = {
        /**
         * Inicializa los elementos del DOM
         */
        initElements: function() {
            elements.newPlanBtn = document.getElementById('newPlanBtn');
            elements.plansTableBody = document.getElementById('plansTableBody');
            elements.planModal = document.getElementById('planModal');
            elements.planForm = document.getElementById('planForm');
            elements.planModalTitle = document.getElementById('planModalTitle');
            elements.closeModalBtn = document.getElementById('closeModalBtn');
            elements.cancelPlanBtn = document.getElementById('cancelPlanBtn');
            elements.planName = document.getElementById('planName');
            elements.planDescription = document.getElementById('planDescription');
            elements.planPrice = document.getElementById('planPrice');
            elements.planDuration = document.getElementById('planDuration');
            elements.planStatus = document.getElementById('planStatus');
            elements.featuresContainer = document.getElementById('featuresContainer');
            elements.addFeatureBtn = document.getElementById('addFeatureBtn');
        },

        /**
         * Inicializa los eventos
         */
        initEvents: function() {
            // Botón nuevo plan
            if (elements.newPlanBtn) {
                elements.newPlanBtn.addEventListener('click', events.showNewPlanModal);
            }
            
            // Modal
            if (elements.closeModalBtn) {
                elements.closeModalBtn.addEventListener('click', events.hidePlanModal);
            }
            
            if (elements.cancelPlanBtn) {
                elements.cancelPlanBtn.addEventListener('click', events.hidePlanModal);
            }
            
            // Formulario
            if (elements.planForm) {
                elements.planForm.addEventListener('submit', events.handlePlanFormSubmit);
            }
            
            // Agregar característica
            if (elements.addFeatureBtn) {
                elements.addFeatureBtn.addEventListener('click', events.addFeature);
            }
            
            // Delegación de eventos para botones de la tabla
            if (elements.plansTableBody) {
                elements.plansTableBody.addEventListener('click', events.handleTableActions);
            }
        },

        /**
         * Carga los datos iniciales
         */
        loadInitialData: async function() {
            try {
                // Cargar planes
                plans = await api.getPlans();
                render.plans(plans);
            } catch (error) {
                console.error('Error al cargar datos iniciales:', error);
            }
        },

        /**
         * Muestra el modal de plan
         * @param {string} mode - Modo del modal ('new' o 'edit')
         * @param {Object} planData - Datos del plan (solo para edición)
         */
        showPlanModal: function(mode = 'new', planData = null) {
            currentPlan = planData;
            
            // Actualizar título
            elements.planModalTitle.textContent = mode === 'new' ? 'Nuevo Plan' : 'Editar Plan';
            
            // Limpiar formulario
            elements.planForm.reset();
            
            // Limpiar características
            render.features([]);
            
            // Si es edición, llenar el formulario con los datos del plan
            if (mode === 'edit' && planData) {
                elements.planName.value = planData.name || '';
                elements.planDescription.value = planData.description || '';
                elements.planPrice.value = planData.price || '';
                elements.planDuration.value = planData.duration || '';
                elements.planStatus.value = planData.status || 'active';
                
                // Renderizar características
                render.features(planData.features || []);
            }
            
            // Mostrar modal
            elements.planModal.classList.remove('hidden');
        },

        /**
         * Oculta el modal de plan
         */
        hidePlanModal: function() {
            elements.planModal.classList.add('hidden');
            currentPlan = null;
        },

        /**
         * Guarda el plan (crea o actualiza)
         * @param {Object} formData - Datos del formulario
         */
        savePlan: async function(formData) {
            try {
                // Obtener características del formulario
                const featureInputs = elements.featuresContainer.querySelectorAll('input[name="features[]"]');
                const features = Array.from(featureInputs)
                    .map(input => input.value.trim())
                    .filter(feature => feature !== '');
                
                const planData = {
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    duration: parseInt(formData.duration),
                    features: features,
                    status: formData.status
                };
                
                if (currentPlan) {
                    // Actualizar plan existente
                    await api.updatePlan(currentPlan._id, planData);
                } else {
                    // Crear nuevo plan
                    await api.createPlan(planData);
                }
                
                methods.hidePlanModal();
                methods.loadInitialData();
            } catch (error) {
                console.error('Error al guardar plan:', error);
            }
        },

        /**
         * Elimina un plan
         * @param {string} planId - ID del plan
         */
        deletePlan: async function(planId) {
            try {
                const confirmed = await showConfirmDialog('¿Estás seguro de eliminar este plan?', 
                    'Esta acción no se puede deshacer.');
                
                if (!confirmed) return;
                
                const success = await api.deletePlan(planId);
                
                if (success) {
                    methods.loadInitialData();
                }
            } catch (error) {
                console.error('Error al eliminar plan:', error);
            }
        }
    };

    /**
     * Events - Manejadores de eventos
     */
    const events = {
        /**
         * Muestra el modal para crear un nuevo plan
         */
        showNewPlanModal: function() {
            methods.showPlanModal('new');
        },

        /**
         * Muestra el modal para editar un plan
         * @param {Event} e - Evento
         */
        showEditPlanModal: function(e) {
            const row = e.target.closest('tr');
            const planId = row.dataset.id;
            
            // Buscar el plan en la lista
            const plan = plans.find(p => p._id === planId);
            
            if (plan) {
                methods.showPlanModal('edit', plan);
            }
        },

        /**
         * Oculta el modal de plan
         */
        hidePlanModal: function() {
            methods.hidePlanModal();
        },

        /**
         * Maneja el envío del formulario de plan
         * @param {Event} e - Evento
         */
        handlePlanFormSubmit: async function(e) {
            e.preventDefault();
            
            const form = e.target;
            const formData = {
                name: form.name.value,
                description: form.description.value,
                price: form.price.value,
                duration: form.duration.value,
                status: form.status.value
            };
            
            await methods.savePlan(formData);
        },

        /**
         * Agrega un nuevo campo de característica
         */
        addFeature: function() {
            const featureItem = document.createElement('div');
            featureItem.className = 'feature-item flex items-center mb-2';
            featureItem.innerHTML = `
                <input type="text" name="features[]" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Característica del plan">
                <button type="button" class="remove-feature ml-2 text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            elements.featuresContainer.appendChild(featureItem);
            
            // Agregar evento al botón de eliminar
            const removeButton = featureItem.querySelector('.remove-feature');
            removeButton.addEventListener('click', function() {
                featureItem.remove();
            });
        },

        /**
         * Maneja las acciones de la tabla (editar, eliminar)
         * @param {Event} e - Evento
         */
        handleTableActions: function(e) {
            const target = e.target.closest('button');
            if (!target) return;
            
            const row = target.closest('tr');
            const planId = row.dataset.id;
            
            if (target.classList.contains('edit-plan-btn')) {
                events.showEditPlanModal(e);
            } else if (target.classList.contains('delete-plan-btn')) {
                methods.deletePlan(planId);
            }
        }
    };

    /**
     * Inicialización del módulo
     */
    async function init() {
        await layout.loadAll();
        methods.initElements();
        methods.initEvents();
        methods.loadInitialData();
    }

    // API pública del módulo
    return {
        init: init
    };
})();

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', App.init);