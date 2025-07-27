(() => {
  const App = (() => {
    // Private variables
    let currentOrder = null;
    let htmlElements = {}; // To be populated after DOM is ready

    // API methods for interacting with the backend
    const api = {
      getOrders: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/orders');
          if (!response.ok) throw new Error('Could not fetch orders');
          return await response.json();
        } catch (error) {
          console.error('Error fetching orders:', error);
          return [];
        }
      },
      getClients: async () => {
        try {
          const response = await fetch('http://localhost:3000/api/clients');
          if (!response.ok) throw new Error('Could not fetch clients');
          return await response.json();
        } catch (error) {
          console.error('Error fetching clients:', error);
          return [];
        }
      },
      createOrder: async (orderData) => {
        try {
          const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not create order');
          }
          return await response.json();
        } catch (error) {
          console.error('Error creating order:', error);
          throw error;
        }
      },
      updateOrder: async (orderData) => {
        try {
          const response = await fetch(`http://localhost:3000/api/orders/${orderData._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not update order');
          }
          return await response.json();
        } catch (error) {
          console.error('Error updating order:', error);
          throw error;
        }
      },
      deleteOrder: async (orderId) => {
        try {
          const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Could not delete order');
          }
          return await response.json();
        } catch (error) {
          console.error('Error deleting order:', error);
          throw error;
        }
      },
    };

    // Render methods for updating the UI
    const render = {
      renderClients: (clients) => {
        if (!htmlElements.orderClient) return;
        htmlElements.orderClient.innerHTML = '<option value="">Seleccionar cliente</option>';
        clients.forEach(client => {
          const option = document.createElement('option');
          option.value = client._id;
          option.textContent = client.name;
          htmlElements.orderClient.appendChild(option);
        });
      },
      renderOrders: (orders) => {
        if (!htmlElements.ordersTableBody) return;
        htmlElements.ordersTableBody.innerHTML = '';
        if (orders.length === 0) {
          htmlElements.ordersTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No hay pedidos para mostrar.</td></tr>';
          return;
        }
        orders.forEach(order => {
          const row = document.createElement('tr');
          row.dataset.orderId = order._id;
          row.classList.add('hover:bg-gray-50');
          
          // Format date
          const orderDate = new Date(order.createdAt);
          const formattedDate = orderDate.toLocaleDateString('es-ES');
          
          // Get status class
          let statusClass = '';
          switch(order.status) {
            case 'pending':
              statusClass = 'bg-yellow-100 text-yellow-800';
              break;
            case 'processing':
              statusClass = 'bg-blue-100 text-blue-800';
              break;
            case 'shipped':
              statusClass = 'bg-indigo-100 text-indigo-800';
              break;
            case 'delivered':
              statusClass = 'bg-green-100 text-green-800';
              break;
            case 'cancelled':
              statusClass = 'bg-red-100 text-red-800';
              break;
            default:
              statusClass = 'bg-gray-100 text-gray-800';
          }
          
          // Translate status
          let statusText = '';
          switch(order.status) {
            case 'pending':
              statusText = 'Pendiente';
              break;
            case 'processing':
              statusText = 'Procesando';
              break;
            case 'shipped':
              statusText = 'Enviado';
              break;
            case 'delivered':
              statusText = 'Entregado';
              break;
            case 'cancelled':
              statusText = 'Cancelado';
              break;
            default:
              statusText = order.status;
          }
          
          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order._id.substring(0, 6)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.client ? order.client.name : 'Cliente no disponible'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formattedDate}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">$${order.totalAmount.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                ${statusText}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-2">
                <button class="view-order-btn text-blue-600 hover:text-blue-900"><i class="fas fa-eye"></i></button>
                <button class="edit-order-btn text-orange-600 hover:text-orange-900"><i class="fas fa-edit"></i></button>
                <button class="delete-order-btn text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          `;
          htmlElements.ordersTableBody.appendChild(row);
        });
      },
      renderPagination: (pagination) => {
        if (!htmlElements.paginationContainer) return;
        
        const { page, pages, total } = pagination;
        const start = (page - 1) * 10 + 1;
        const end = Math.min(page * 10, total);
        
        // Update text
        htmlElements.paginationInfo.textContent = `Mostrando ${start} a ${end} de ${total} resultados`;
        
        // Clear pagination buttons
        htmlElements.paginationButtons.innerHTML = '';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50';
        prevButton.textContent = 'Anterior';
        prevButton.disabled = page === 1;
        if (page > 1) {
          prevButton.addEventListener('click', () => methods.changePage(page - 1));
        } else {
          prevButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        htmlElements.paginationButtons.appendChild(prevButton);
        
        // Page buttons
        const maxButtons = 3;
        const startPage = Math.max(1, page - Math.floor(maxButtons / 2));
        const endPage = Math.min(pages, startPage + maxButtons - 1);
        
        for (let i = startPage; i <= endPage; i++) {
          const pageButton = document.createElement('button');
          pageButton.className = i === page 
            ? 'px-3 py-1 bg-orange-600 text-white rounded-md text-sm' 
            : 'px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50';
          pageButton.textContent = i.toString();
          pageButton.addEventListener('click', () => methods.changePage(i));
          htmlElements.paginationButtons.appendChild(pageButton);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50';
        nextButton.textContent = 'Siguiente';
        nextButton.disabled = page === pages;
        if (page < pages) {
          nextButton.addEventListener('click', () => methods.changePage(page + 1));
        } else {
          nextButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
        htmlElements.paginationButtons.appendChild(nextButton);
      }
    };

    // Layout methods for loading partials and setting active links
    const layout = {
      loadAll: async () => {
        await Promise.all([
          window.loadPartial('header-container', './partials/header.html', () => {
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) pageTitle.innerText = 'Pedidos';
          }),
          window.loadPartial('sidebar-container', './partials/aside.html', () => {
            window.setActiveLink('orders.html');
          })
        ]);
      }
    };

    // General methods
    const methods = {
      initHtmlElements: () => {
        htmlElements = {
          orderModal: document.getElementById('orderModal'),
          orderForm: document.getElementById('orderForm'),
          closeModalBtn: document.getElementById('closeModalBtn'),
          cancelOrderBtn: document.getElementById('cancelOrderBtn'),
          ordersTableBody: document.getElementById('ordersTableBody'),
          orderModalTitle: document.getElementById('orderModalTitle'),
          orderClient: document.getElementById('orderClient'),
          orderStatus: document.getElementById('orderStatus'),
          searchInput: document.getElementById('searchInput'),
          statusFilter: document.getElementById('statusFilter'),
          periodFilter: document.getElementById('periodFilter'),
          exportOrdersBtn: document.getElementById('exportOrdersBtn'),
          paginationContainer: document.getElementById('paginationContainer'),
          paginationInfo: document.getElementById('paginationInfo'),
          paginationButtons: document.getElementById('paginationButtons'),
        };
      },
      openModal: () => {
        if (htmlElements.orderModal) htmlElements.orderModal.classList.remove('hidden');
      },
      closeModal: () => {
        if (htmlElements.orderModal) htmlElements.orderModal.classList.add('hidden');
        if (htmlElements.orderForm) htmlElements.orderForm.reset();
        currentOrder = null;
      },
      loadInitialData: async () => {
        try {
          const [orders, clients] = await Promise.all([api.getOrders(), api.getClients()]);
          render.renderOrders(orders.orders || orders);
          render.renderClients(clients);
          
          // If pagination info is available
          if (orders.pagination) {
            render.renderPagination(orders.pagination);
          }
        } catch (error) {
          console.error("Failed to load initial data.", error);
          render.renderOrders([]); // Render empty state on error
        }
      },
      changePage: async (page) => {
        try {
          // Assuming the API supports pagination
          const response = await fetch(`http://localhost:3000/api/orders?page=${page}`);
          if (!response.ok) throw new Error('Could not fetch orders');
          const data = await response.json();
          render.renderOrders(data.orders);
          render.renderPagination(data.pagination);
        } catch (error) {
          console.error('Error changing page:', error);
        }
      },
      exportToCSV: () => {
        try {
          // Get all orders from the table
          const rows = document.querySelectorAll('#ordersTableBody tr');
          if (rows.length === 0) {
            alert('No hay datos para exportar');
            return;
          }
          
          // Create CSV header
          let csv = 'ID,Cliente,Fecha,Total,Estado\n';
          
          // Add each row
          rows.forEach(row => {
            const columns = row.querySelectorAll('td');
            if (columns.length >= 5) {
              const id = columns[0].textContent.trim();
              const client = columns[1].textContent.trim();
              const date = columns[2].textContent.trim();
              const total = columns[3].textContent.trim();
              const status = columns[4].textContent.trim();
              
              csv += `"${id}","${client}","${date}","${total}","${status}"\n`;
            }
          });
          
          // Create download link
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', 'pedidos.csv');
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error('Error exporting to CSV:', error);
          alert('Error al exportar datos');
        }
      },
      filterOrders: async () => {
        try {
          const searchTerm = htmlElements.searchInput ? htmlElements.searchInput.value : '';
          const status = htmlElements.statusFilter ? htmlElements.statusFilter.value : '';
          const period = htmlElements.periodFilter ? htmlElements.periodFilter.value : '';
          
          // Build query string
          let queryParams = [];
          if (searchTerm) queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
          if (status && status !== 'all') queryParams.push(`status=${encodeURIComponent(status)}`);
          if (period && period !== 'all') queryParams.push(`period=${encodeURIComponent(period)}`);
          
          const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
          
          // Fetch filtered orders
          const response = await fetch(`http://localhost:3000/api/orders${queryString}`);
          if (!response.ok) throw new Error('Could not fetch filtered orders');
          
          const data = await response.json();
          render.renderOrders(data.orders || data);
          
          // Update pagination if available
          if (data.pagination) {
            render.renderPagination(data.pagination);
          }
        } catch (error) {
          console.error('Error filtering orders:', error);
          alert('Error al filtrar pedidos');
        }
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
      handleCreateOrder: async (e) => {
        e.preventDefault();
      
        const formData = new FormData(htmlElements.orderForm);
      
        // Armar los datos del pedido
        const orderData = {
          clientId: formData.get('client'),
          status: formData.get('status'),
          items: [], // Aquí se agregarían los items del pedido
          shippingAddress: {
            address: formData.get('address'),
            city: formData.get('city'),
            postalCode: formData.get('postalCode'),
            country: formData.get('country')
          },
          notes: formData.get('notes')
        };
      
        try {
          await api.createOrder(orderData);
          alert('Pedido creado exitosamente');
          methods.closeModal();
          const orders = await api.getOrders(); // Actualiza lista
          render.renderOrders(orders.orders || orders);
          if (orders.pagination) {
            render.renderPagination(orders.pagination);
          }
        } catch (error) {
          alert('Error al crear pedido: ' + error.message);
          console.error(error);
        }
      },         
      handleUpdateOrder: async (e, orderId) => {
        e.preventDefault();
        const formData = new FormData(htmlElements.orderForm);
        
        const updatedData = {
          _id: orderId,
          clientId: formData.get('client'),
          status: formData.get('status'),
          shippingAddress: {
            address: formData.get('address'),
            city: formData.get('city'),
            postalCode: formData.get('postalCode'),
            country: formData.get('country')
          },
          notes: formData.get('notes')
        };
      
        try {
          await api.updateOrder(updatedData);
          alert('Pedido actualizado exitosamente');
          methods.closeModal();
          const orders = await api.getOrders();
          render.renderOrders(orders.orders || orders);
          if (orders.pagination) {
            render.renderPagination(orders.pagination);
          }
        } catch (error) {
          alert('Error al actualizar pedido: ' + error.message);
        }
      },      
      handleShowNewOrderModal: () => {
        currentOrder = null;
        if (htmlElements.orderModalTitle) htmlElements.orderModalTitle.textContent = 'Nuevo Pedido';
        if (htmlElements.orderForm) htmlElements.orderForm.reset();
        methods.openModal();
      },
      handleShowEditOrderModal: (order) => {
        currentOrder = order;
        if (htmlElements.orderModalTitle) htmlElements.orderModalTitle.textContent = 'Editar Pedido';
        if (htmlElements.orderForm) {
          htmlElements.orderForm.client.value = order.clientId;
          htmlElements.orderForm.status.value = order.status;
          
          // Fill shipping address if available
          if (order.shippingAddress) {
            htmlElements.orderForm.address.value = order.shippingAddress.address || '';
            htmlElements.orderForm.city.value = order.shippingAddress.city || '';
            htmlElements.orderForm.postalCode.value = order.shippingAddress.postalCode || '';
            htmlElements.orderForm.country.value = order.shippingAddress.country || '';
          }
          
          htmlElements.orderForm.notes.value = order.notes || '';
        }
        methods.openModal();
      },
      handleViewOrder: async (orderId) => {
        try {
          // Fetch order details
          const response = await fetch(`http://localhost:3000/api/orders/${orderId}`);
          if (!response.ok) throw new Error('Could not fetch order details');
          
          const order = await response.json();
          
          // Display order details in a modal or alert
          alert(`
            Pedido #${order._id.substring(0, 6)}\n
            Cliente: ${order.client ? order.client.name : 'N/A'}\n
            Fecha: ${new Date(order.createdAt).toLocaleDateString('es-ES')}\n
            Estado: ${order.status}\n
            Total: $${order.totalAmount.toFixed(2)}\n
            Dirección de envío: ${order.shippingAddress ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.country}` : 'N/A'}\n
            Notas: ${order.notes || 'N/A'}
          `);
        } catch (error) {
          console.error('Error viewing order:', error);
          alert('Error al ver detalles del pedido');
        }
      },
      handleDeleteOrder: async (orderId) => {
        const confirmed = await showConfirmDialog('¿Estás seguro de que deseas eliminar este pedido?', 'Esta acción no se puede deshacer.');
        
        if (!confirmed) return;
        
        try {
          await api.deleteOrder(orderId);
          showNotification('Pedido eliminado exitosamente');
          const orders = await api.getOrders();
          render.renderOrders(orders.orders || orders);
          if (orders.pagination) {
            render.renderPagination(orders.pagination);
          }
        } catch (error) {
          console.error('Error al eliminar pedido:', error);
          showNotification('Error al eliminar pedido', 'error');
        }
      },
      handleEventListeners: () => {
        // Search and filter event listeners
        if (htmlElements.searchInput) {
          htmlElements.searchInput.addEventListener('input', methods.filterOrders);
        }
        
        if (htmlElements.statusFilter) {
          htmlElements.statusFilter.addEventListener('change', methods.filterOrders);
        }
        
        if (htmlElements.periodFilter) {
          htmlElements.periodFilter.addEventListener('change', methods.filterOrders);
        }
        
        // Export button
        if (htmlElements.exportOrdersBtn) {
          htmlElements.exportOrdersBtn.addEventListener('click', methods.exportToCSV);
        }
        
        // Use event delegation for the dynamically loaded buttons
        document.body.addEventListener('click', (e) => {
          // New order button
          if (e.target.closest('#newOrderBtn')) {
            handlers.handleShowNewOrderModal();
          }
          
          // View button handler
          if (e.target.closest('.view-order-btn')) {
            const row = e.target.closest('tr');
            const orderId = row.dataset.orderId;
            handlers.handleViewOrder(orderId);
          }
          
          // Edit button handler
          if (e.target.closest('.edit-order-btn')) {
            const row = e.target.closest('tr');
            const orderId = row.dataset.orderId;
            
            // Extract order data from the row
            const clientName = row.querySelector('td:nth-child(2)').textContent;
            const statusText = row.querySelector('td:nth-child(5) span').textContent.trim();
            
            // Map status text back to API value
            let status = '';
            switch(statusText) {
              case 'Pendiente': status = 'pending'; break;
              case 'Procesando': status = 'processing'; break;
              case 'Enviado': status = 'shipped'; break;
              case 'Entregado': status = 'delivered'; break;
              case 'Cancelado': status = 'cancelled'; break;
              default: status = 'pending';
            }
            
            // Create a simplified order object for the modal
            const order = {
              _id: orderId,
              clientId: '', // This would need to be fetched from the server
              status: status,
              shippingAddress: {}
            };
            
            // Fetch complete order details before showing modal
            fetch(`http://localhost:3000/api/orders/${orderId}`)
              .then(response => response.json())
              .then(data => {
                handlers.handleShowEditOrderModal(data);
              })
              .catch(error => {
                console.error('Error fetching order details:', error);
                // Fallback to simplified order object
                handlers.handleShowEditOrderModal(order);
              });
          }
          
          // Delete button handler
          if (e.target.closest('.delete-order-btn')) {
            const row = e.target.closest('tr');
            const orderId = row.dataset.orderId;
            handlers.handleDeleteOrder(orderId);
          }
        });

        // Form submit handler - handles both create and update
        if (htmlElements.orderForm) {
          htmlElements.orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (currentOrder) {
              await handlers.handleUpdateOrder(e, currentOrder._id);
            } else {
              await handlers.handleCreateOrder(e);
            }
          });
        }
        
        if (htmlElements.closeModalBtn) htmlElements.closeModalBtn.addEventListener('click', methods.closeModal);
        if (htmlElements.cancelOrderBtn) htmlElements.cancelOrderBtn.addEventListener('click', methods.closeModal);
      },
    };

    return {
      init: methods.init,
    };
  })();

  // Start the application once the initial DOM is loaded
  document.addEventListener('DOMContentLoaded', App.init);
})();