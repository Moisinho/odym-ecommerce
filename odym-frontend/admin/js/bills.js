(() => {
  const BillsApp = (() => {
    // Private variables
    let currentBill = null;
    let htmlElements = {}; // To be populated after DOM is ready
    let isInitialized = false; // Prevent multiple initializations

    // API methods for interacting with the backend
    const api = {
      getBills: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/bills');
          if (!response.ok) throw new Error('Could not fetch bills');
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('Error fetching bills:', error);
          return [];
        }
      },
      getCustomers: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/customers');
          if (!response.ok) throw new Error('Could not fetch customers');
          const data = await response.json();
          return data.customers || [];
        } catch (error) {
          console.error('Error fetching customers:', error);
          return [];
        }
      },
      getOrders: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/orders');
          if (!response.ok) throw new Error('Could not fetch orders');
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('Error fetching orders:', error);
          return [];
        }
      },
      createBill: async (billData) => {
        try {
          const response = await fetch('http://localhost:3000/api/bills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not create bill');
          }
          return await response.json();
        } catch (error) {
          console.error('Error creating bill:', error);
          throw error;
        }
      },
      updateBill: async (billData) => {
        try {
          const response = await fetch(`http://localhost:3000/api/bills/${billData._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(billData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not update bill');
          }
          return await response.json();
        } catch (error) {
          console.error('Error updating bill:', error);
          throw error;
        }
      },
      deleteBill: async (billId) => {
        try {
          const response = await fetch(`http://localhost:3000/api/bills/${billId}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not delete bill');
          }
          return await response.json();
        } catch (error) {
          console.error('Error deleting bill:', error);
          throw error;
        }
      },
    };

    // Render methods for updating the UI
    const render = {
      renderBills: (bills) => {
        if (!htmlElements.billsTableBody) return;

        if (bills.length === 0) {
          htmlElements.billsTableBody.innerHTML = `
            <tr>
              <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                <i class="fas fa-file-invoice text-4xl mb-4 text-gray-300"></i>
                <p>No hay facturas registradas</p>
              </td>
            </tr>
          `;
          return;
        }

        htmlElements.billsTableBody.innerHTML = '';
        bills.forEach(bill => {
          const row = document.createElement('tr');
          row.dataset.billId = bill._id;
          row.className = 'hover:bg-gray-50';

          const customerName = bill.customerId ? bill.customerId.fullName : 'Cliente eliminado';
          const customerEmail = bill.customerId ? bill.customerId.email : '';
          const orderNumber = bill.orderId ? (bill.orderId.orderNumber || `#${bill.orderId._id.slice(-6)}`) : 'Pedido eliminado';

          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 bill-order">${orderNumber}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900 bill-customer">${customerName}</div>
              <div class="text-sm text-gray-500">${customerEmail}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 bill-date">${formatDate(bill.issueDate)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bill-total">$${parseFloat(bill.total).toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 bill-payment-method">
                ${bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1)}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
              <button class="editBillBtn text-orange-600 hover:text-orange-900 mr-3" title="Editar factura">
                <i class="fas fa-edit"></i>
              </button>
              <button class="deleteBillBtn text-red-600 hover:text-red-900" title="Eliminar factura">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          `;
          htmlElements.billsTableBody.appendChild(row);
        });
      },
      renderCustomers: (customers) => {
        const customerSelect = document.getElementById('customerSelect');
        if (!customerSelect) return;

        customerSelect.innerHTML = '<option value="">Seleccionar cliente</option>';
        customers.forEach(customer => {
          const option = document.createElement('option');
          option.value = customer._id;
          option.textContent = `${customer.fullName} (${customer.email})`;
          customerSelect.appendChild(option);
        });
      },
      renderOrders: (orders) => {
        const orderSelect = document.getElementById('orderSelect');
        if (!orderSelect) return;

        orderSelect.innerHTML = '<option value="">Seleccionar pedido</option>';
        orders.forEach(order => {
          const option = document.createElement('option');
          option.value = order._id;
          option.textContent = `Pedido #${order._id.slice(-6)} - $${parseFloat(order.totalAmount).toFixed(2)}`;
          option.dataset.customerId = order.userId;
          option.dataset.total = order.totalAmount;
          orderSelect.appendChild(option);
        });
      }
    };

    // General methods
    const methods = {
      initHtmlElements: () => {
        htmlElements = {
          billModal: document.getElementById('billModal'),
          billForm: document.getElementById('billForm'),
          closeModalBtn: document.getElementById('closeModalBtn'),
          cancelBillBtn: document.getElementById('cancelBillBtn'),
          billsTableBody: document.getElementById('billsTableBody'),
          billModalTitle: document.getElementById('billModalTitle'),
          newBillBtn: document.getElementById('newBillBtn'),
        };
      },
      openModal: () => {
        if (htmlElements.billModal) {
          htmlElements.billModal.classList.remove('hidden');
          document.body.style.overflow = 'hidden';
        }
      },
      closeModal: () => {
        if (htmlElements.billModal) {
          htmlElements.billModal.classList.add('hidden');
          document.body.style.overflow = 'auto';
        }
        if (htmlElements.billForm) htmlElements.billForm.reset();
        currentBill = null;
      },
      cancelModal: () => {
        methods.closeModal();
      },
      loadInitialData: async () => {
        try {
          console.log('🔄 Cargando datos iniciales...');

          if (htmlElements.billsTableBody) {
            htmlElements.billsTableBody.innerHTML = `
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>
                  Cargando facturas...
                </td>
              </tr>
            `;
          }

          const [bills, customers, orders] = await Promise.all([
            api.getBills(),
            api.getCustomers(),
            api.getOrders()
          ]);

          console.log('🧾 Facturas cargadas:', bills.length);
          console.log('👥 Clientes cargados:', customers.length);
          console.log('📦 Pedidos cargados:', orders.length);
          
          render.renderBills(bills);
          render.renderCustomers(customers);
          render.renderOrders(orders);

        } catch (error) {
          console.error("❌ Failed to load initial data.", error);

          if (htmlElements.billsTableBody) {
            htmlElements.billsTableBody.innerHTML = `
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-red-500">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Error al cargar facturas. Verifique la conexión con el servidor.
                </td>
              </tr>
            `;
          }
        }
      },
      init: async () => {
        if (isInitialized) {
          console.log('⚠️ BillsApp ya está inicializado');
          return;
        }

        console.log('🚀 Inicializando BillsApp...');
        isInitialized = true;

        methods.initHtmlElements();
        handlers.setupEventDelegation();
        handlers.handleEventListeners();
        await methods.loadInitialData();
        console.log('✅ BillsApp inicializado correctamente');
      },
    };

    // Event Handlers
    const handlers = {
      handleCreateBill: async (e) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.billForm);

          const orderId = formData.get('orderId')?.trim();
          const customerId = formData.get('customerId')?.trim();
          const issueDate = formData.get('issueDate');
          const total = formData.get('total');
          const paymentMethod = formData.get('paymentMethod');
          const paymentDetails = formData.get('paymentDetails')?.trim();

          if (!orderId || !customerId || !issueDate || !total || !paymentMethod || !paymentDetails) {
            alert('Todos los campos son requeridos');
            return;
          }

          const billData = {
            orderId,
            customerId,
            issueDate,
            total: parseFloat(total),
            paymentMethod,
            paymentDetails
          };

          console.log('📝 Creando factura:', billData);

          const result = await api.createBill(billData);
          console.log('✅ Factura creada:', result);

          alert('Factura creada exitosamente');
          methods.closeModal();

          const bills = await api.getBills();
          render.renderBills(bills);

        } catch (error) {
          console.error('❌ Error al crear factura:', error);
          alert('Error al crear factura: ' + error.message);
        }
      },

      handleUpdateBill: async (e, billId) => {
        e.preventDefault();

        try {
          const formData = new FormData(htmlElements.billForm);

          const orderId = formData.get('orderId')?.trim();
          const customerId = formData.get('customerId')?.trim();
          const issueDate = formData.get('issueDate');
          const total = formData.get('total');
          const paymentMethod = formData.get('paymentMethod');
          const paymentDetails = formData.get('paymentDetails')?.trim();

          if (!orderId || !customerId || !issueDate || !total || !paymentMethod || !paymentDetails) {
            alert('Todos los campos son requeridos');
            return;
          }

          const updatedData = {
            _id: billId,
            orderId,
            customerId,
            issueDate,
            total: parseFloat(total),
            paymentMethod,
            paymentDetails
          };

          console.log('✏️ Actualizando factura:', updatedData);

          const result = await api.updateBill(updatedData);
          console.log('✅ Factura actualizada:', result);

          alert('Factura actualizada exitosamente');
          methods.closeModal();

          const bills = await api.getBills();
          render.renderBills(bills);

        } catch (error) {
          console.error('❌ Error al actualizar factura:', error);
          alert('Error al actualizar factura: ' + error.message);
        }
      },

      handleShowNewBillModal: async () => {
        currentBill = null;
        if (htmlElements.billModalTitle) htmlElements.billModalTitle.textContent = 'Nueva Factura';
        if (htmlElements.billForm) {
          htmlElements.billForm.reset();
          // Set today's date as default
          const today = new Date().toISOString().split('T')[0];
          htmlElements.billForm.issueDate.value = today;
        }
        
        // Load fresh data for selects
        const [customers, orders] = await Promise.all([
          api.getCustomers(),
          api.getOrders()
        ]);
        render.renderCustomers(customers);
        render.renderOrders(orders);
        
        methods.openModal();
      },

      handleShowEditBillModal: async (bill) => {
        currentBill = bill;
        if (htmlElements.billModalTitle) htmlElements.billModalTitle.textContent = 'Editar Factura';
        
        // Load fresh data for selects
        const [customers, orders] = await Promise.all([
          api.getCustomers(),
          api.getOrders()
        ]);
        render.renderCustomers(customers);
        render.renderOrders(orders);
        
        if (htmlElements.billForm) {
          htmlElements.billForm.orderId.value = bill.orderId || '';
          htmlElements.billForm.customerId.value = bill.customerId || '';
          htmlElements.billForm.issueDate.value = bill.issueDate ? bill.issueDate.split('T')[0] : '';
          htmlElements.billForm.total.value = bill.total || '';
          htmlElements.billForm.paymentMethod.value = bill.paymentMethod || '';
          htmlElements.billForm.paymentDetails.value = bill.paymentDetails || '';
        }
        
        methods.openModal();
      },

      handleDeleteBill: async (billId) => {
        const confirmed = confirm('¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.');

        if (!confirmed) return;

        try {
          console.log('🗑️ Eliminando factura:', billId);
          await api.deleteBill(billId);
          alert('Factura eliminada exitosamente');

          const bills = await api.getBills();
          render.renderBills(bills);

        } catch (error) {
          console.error('Error al eliminar factura:', error);
          alert('Error al eliminar factura: ' + error.message);
        }
      },

      handleEventListeners: () => {
        if (htmlElements.newBillBtn) {
          htmlElements.newBillBtn.removeEventListener('click', handlers.handleShowNewBillModal);
          htmlElements.newBillBtn.addEventListener('click', handlers.handleShowNewBillModal);
        }

        if (htmlElements.billForm) {
          htmlElements.billForm.removeEventListener('submit', handlers.handleFormSubmit);
          htmlElements.billForm.addEventListener('submit', handlers.handleFormSubmit);
        }

        if (htmlElements.closeModalBtn) {
          htmlElements.closeModalBtn.removeEventListener('click', methods.closeModal);
          htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        }
        if (htmlElements.cancelBillBtn) {
          htmlElements.cancelBillBtn.removeEventListener('click', methods.closeModal);
          htmlElements.cancelBillBtn.addEventListener('click', methods.cancelModal);
        }

        if (htmlElements.billModal) {
          htmlElements.billModal.removeEventListener('click', handlers.handleModalClick);
          htmlElements.billModal.addEventListener('click', handlers.handleModalClick);
        }

        // Add order selection handler
        const orderSelect = document.getElementById('orderSelect');
        if (orderSelect) {
          orderSelect.removeEventListener('change', handlers.handleOrderSelection);
          orderSelect.addEventListener('change', handlers.handleOrderSelection);
        }
      },

      handleFormSubmit: async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';

        try {
          if (currentBill) {
            await handlers.handleUpdateBill(e, currentBill._id);
          } else {
            await handlers.handleCreateBill(e);
          }
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Guardar';
        }
      },

      handleModalClick: (e) => {
        if (e.target === htmlElements.billModal) {
          methods.closeModal();
        }
      },

      handleOrderSelection: (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption && selectedOption.dataset.customerId) {
          const customerSelect = document.getElementById('customerSelect');
          const totalInput = document.querySelector('input[name="total"]');
          
          if (customerSelect) {
            customerSelect.value = selectedOption.dataset.customerId;
          }
          if (totalInput && selectedOption.dataset.total) {
            totalInput.value = selectedOption.dataset.total;
          }
        }
      },

      setupEventDelegation: () => {
        if (handlers.delegationHandler) {
          document.removeEventListener('click', handlers.delegationHandler);
        }

        handlers.delegationHandler = async (e) => {
          if (e.target.closest('.editBillBtn')) {
            const row = e.target.closest('tr');
            const billId = row.dataset.billId;
            const bill = {
              _id: billId,
              // We'll need to fetch the full bill data for editing
            };
            await handlers.handleShowEditBillModal(bill);
          }

          if (e.target.closest('.deleteBillBtn')) {
            const row = e.target.closest('tr');
            const billId = row.dataset.billId;
            handlers.handleDeleteBill(billId);
          }
        };

        document.addEventListener('click', handlers.delegationHandler);
      },
    };

    return {
      init: methods.init,
    };
  })();

  // Make BillsApp globally available
  window.BillsApp = BillsApp;
})();