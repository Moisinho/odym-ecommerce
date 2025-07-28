(() => {
  const DeliveryPanel = (() => {
    const API_URL = "http://localhost:3000/api";
    let currentUser = null;

    const elements = {
      deliveryPersonName: document.getElementById("deliveryPersonName"),
      logoutBtn: document.getElementById("logoutBtn"),
      availableCount: document.getElementById("availableCount"),
      inTransitCount: document.getElementById("inTransitCount"),
      deliveredTodayCount: document.getElementById("deliveredTodayCount"),
      weeklyCount: document.getElementById("weeklyCount"),
      availableOrdersList: document.getElementById("availableOrdersList"),
      myOrdersList: document.getElementById("myOrdersList"),
      deliveredOrdersList: document.getElementById("deliveredOrdersList"),
      loadingModal: document.getElementById("loadingModal"),
      tabButtons: document.querySelectorAll(".tab-button"),
      tabContents: document.querySelectorAll(".tab-content"),
    };

    const methods = {
      init: () => {
        console.log("🚚 Inicializando panel de repartidor...");

        // Check authentication
        if (!window.AuthService || !window.AuthService.isAuthenticated()) {
          console.log("❌ Usuario no autenticado");
          window.location.href = "/odym-frontend/auth/login.html";
          return;
        }

        currentUser = window.AuthService.getUser();

        // Check if user is delivery personnel
        if (!methods.isDeliveryPerson(currentUser)) {
          console.log("❌ Usuario no es repartidor");
          alert("Acceso denegado. Se requieren permisos de repartidor.");
          window.location.href = "/odym-frontend";
          return;
        }

        console.log("✅ Repartidor autenticado:", currentUser.fullName);

        // Initialize UI
        methods.setupUI();
        methods.setupEventListeners();
        methods.loadDashboardData();
      },

      isDeliveryPerson: (user) => {
        if (!user) return false;
        return user.role === "delivery" || user.type === "delivery";
      },

      setupUI: () => {
        elements.deliveryPersonName.textContent =
          currentUser.fullName || currentUser.username || "Repartidor";
      },

      setupEventListeners: () => {
        // Logout button
        elements.logoutBtn.addEventListener("click", () => {
          if (window.AuthService) {
            window.AuthService.logout();
          }
        });

        // Tab switching
        elements.tabButtons.forEach((button) => {
          button.addEventListener("click", (e) => {
            const tabId = e.target.id;
            methods.switchTab(tabId);
          });
        });
      },

      switchTab: (tabId) => {
        // Remove active class from all tabs
        elements.tabButtons.forEach((btn) => {
          btn.classList.remove(
            "active",
            "border-orange-500",
            "text-orange-600"
          );
          btn.classList.add("border-transparent", "text-gray-500");
        });

        // Hide all tab contents
        elements.tabContents.forEach((content) => {
          content.classList.add("hidden");
        });

        // Activate selected tab
        const activeButton = document.getElementById(tabId);
        activeButton.classList.add(
          "active",
          "border-orange-500",
          "text-orange-600"
        );
        activeButton.classList.remove("border-transparent", "text-gray-500");

        // Show corresponding content
        let contentId;
        switch (tabId) {
          case "availableTab":
            contentId = "availableContent";
            methods.loadAvailableOrders();
            break;
          case "myOrdersTab":
            contentId = "myOrdersContent";
            methods.loadMyOrders();
            break;
          case "deliveredTab":
            contentId = "deliveredContent";
            methods.loadDeliveredOrders();
            break;
        }

        if (contentId) {
          document.getElementById(contentId).classList.remove("hidden");
        }
      },

      showLoading: () => {
        elements.loadingModal.classList.remove("hidden");
      },

      hideLoading: () => {
        elements.loadingModal.classList.add("hidden");
      },

      loadDashboardData: async () => {
        try {
          methods.showLoading();

          // Load stats
          await methods.loadStats();

          // Load initial tab content (available orders)
          await methods.loadAvailableOrders();
        } catch (error) {
          console.error("Error loading dashboard data:", error);
          methods.showError("Error al cargar los datos del dashboard");
        } finally {
          methods.hideLoading();
        }
      },

      loadStats: async () => {
        try {
          const response = await fetch(
            `${API_URL}/delivery/stats/${currentUser._id}`
          );
          const data = await response.json();

          if (response.ok) {
            elements.availableCount.textContent = data.availableOrders || 0;
            elements.inTransitCount.textContent = data.inTransitOrders || 0;
            elements.deliveredTodayCount.textContent = data.deliveredToday || 0;
            elements.weeklyCount.textContent = data.deliveredThisWeek || 0;
          }
        } catch (error) {
          console.error("Error loading stats:", error);
        }
      },

      loadAvailableOrders: async () => {
        try {
          const response = await fetch(`${API_URL}/delivery/available-orders`);
          const orders = await response.json();

          if (response.ok) {
            methods.renderAvailableOrders(orders);
          } else {
            throw new Error(
              orders.error || "Error al cargar órdenes disponibles"
            );
          }
        } catch (error) {
          console.error("Error loading available orders:", error);
          elements.availableOrdersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
              <p>Error al cargar las órdenes disponibles</p>
            </div>
          `;
        }
      },

      loadMyOrders: async () => {
        try {
          const response = await fetch(
            `${API_URL}/delivery/my-orders/${currentUser._id}`
          );
          const orders = await response.json();

          if (response.ok) {
            methods.renderMyOrders(orders);
          } else {
            throw new Error(orders.error || "Error al cargar mis órdenes");
          }
        } catch (error) {
          console.error("Error loading my orders:", error);
          elements.myOrdersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
              <p>Error al cargar tus órdenes</p>
            </div>
          `;
        }
      },

      loadDeliveredOrders: async () => {
        try {
          const response = await fetch(
            `${API_URL}/delivery/delivered-this-week/${currentUser._id}`
          );
          const orders = await response.json();

          if (response.ok) {
            methods.renderDeliveredOrders(orders);
          } else {
            throw new Error(
              orders.error || "Error al cargar órdenes entregadas"
            );
          }
        } catch (error) {
          console.error("Error loading delivered orders:", error);
          elements.deliveredOrdersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-exclamation-triangle text-3xl mb-4"></i>
              <p>Error al cargar las órdenes entregadas</p>
            </div>
          `;
        }
      },

      // Helper function to get customer info with fallbacks
      getCustomerInfo: (order) => {
        // Prioritize customerData from backend, then fallback to other sources
        return {
          name:
            order.customerData?.fullName ||
            order.userId?.fullName ||
            order.shippingAddress?.firstName +
              " " +
              order.shippingAddress?.lastName ||
            "N/A",
          email:
            order.customerData?.email ||
            order.userId?.email ||
            order.shippingAddress?.email ||
            "N/A",
          phone:
            order.customerData?.phone ||
            order.userId?.phone ||
            order.shippingAddress?.phone ||
            "No disponible",
          address:
            order.customerData?.address ||
            order.userId?.address ||
            order.shippingAddress?.address ||
            "Dirección no disponible",
        };
      },

      renderAvailableOrders: (orders) => {
        if (!orders || orders.length === 0) {
          elements.availableOrdersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-inbox text-3xl mb-4"></i>
              <p>No hay órdenes disponibles para entrega</p>
            </div>
          `;
          return;
        }

        elements.availableOrdersList.innerHTML = orders
          .map((order) => {
            const customer = methods.getCustomerInfo(order);
            return `
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-300">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="font-semibold text-gray-900">Orden #${order._id.slice(
                  -8
                )}</h4>
                <p class="text-sm text-gray-600">Cliente: ${customer.name}</p>
                <p class="text-sm text-gray-600">Email: ${customer.email}</p>
                <p class="text-sm text-gray-600">Teléfono: ${customer.phone}</p>
                <p class="text-sm text-gray-600">Total: $${
                  order.totalAmount?.toFixed(2) || "0.00"
                }</p>
              </div>
              <span class="px-2 py-1 text-xs font-medium rounded-full ${methods.getStatusBadgeClass(
                order.status
              )}">
                ${methods.getStatusText(order.status)}
              </span>
            </div>
            
            <div class="mb-3">
              <p class="text-sm font-medium text-gray-700 mb-1">Dirección de entrega:</p>
              <p class="text-sm text-gray-600">${customer.address}</p>
              <p class="text-sm text-gray-600">
                ${order.shippingAddress?.city || "Ciudad de Panamá"}, ${
              order.shippingAddress?.country || "Panama"
            }
              </p>
            </div>

            <div class="mb-3">
              <p class="text-sm font-medium text-gray-700 mb-1">Productos:</p>
              <div class="text-sm text-gray-600">
                ${
                  order.items
                    ?.map(
                      (item) => `
                  <div class="flex justify-between">
                    <span>${item.productId?.name || "Producto"} x${
                        item.quantity
                      }</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                `
                    )
                    .join("") || "Sin productos"
                }
              </div>
            </div>

            <div class="flex justify-end">
              <button onclick="DeliveryPanel.assignOrder('${order._id}')" 
                      class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm transition duration-300">
                <i class="fas fa-truck mr-2"></i>Asignar a mi ruta
              </button>
            </div>
          </div>
        `;
          })
          .join("");
      },

      renderMyOrders: (orders) => {
        if (!orders || orders.length === 0) {
          elements.myOrdersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-truck text-3xl mb-4"></i>
              <p>No tienes órdenes asignadas actualmente</p>
            </div>
          `;
          return;
        }

        elements.myOrdersList.innerHTML = orders
          .map((order) => {
            const customer = methods.getCustomerInfo(order);
            return `
          <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-300">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="font-semibold text-gray-900">Orden #${order._id.slice(
                  -8
                )}</h4>
                <p class="text-sm text-gray-600">Cliente: ${customer.name}</p>
                <p class="text-sm text-gray-600">Email: ${customer.email}</p>
                <p class="text-sm text-gray-600">Teléfono: ${customer.phone}</p>
                <p class="text-sm text-gray-600">Total: $${
                  order.totalAmount?.toFixed(2) || "0.00"
                }</p>
              </div>
              <span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                En Tránsito
              </span>
            </div>
            
            <div class="mb-3">
              <p class="text-sm font-medium text-gray-700 mb-1">Dirección de entrega:</p>
              <p class="text-sm text-gray-600">${customer.address}</p>
              <p class="text-sm text-gray-600">
                ${order.shippingAddress?.city || "Ciudad de Panamá"}, ${
              order.shippingAddress?.country || "Panama"
            }
              </p>
            </div>

            <div class="flex justify-end space-x-2">
              <button onclick="DeliveryPanel.markAsDelivered('${order._id}')" 
                      class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition duration-300">
                <i class="fas fa-check mr-2"></i>Marcar como Entregada
              </button>
            </div>
          </div>
        `;
          })
          .join("");
      },

      renderDeliveredOrders: (orders) => {
        if (!orders || orders.length === 0) {
          elements.deliveredOrdersList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-check-circle text-3xl mb-4"></i>
              <p>No has entregado órdenes esta semana</p>
            </div>
          `;
          return;
        }

        elements.deliveredOrdersList.innerHTML = orders
          .map((order) => {
            const customer = methods.getCustomerInfo(order);
            return `
          <div class="border border-gray-200 rounded-lg p-4 bg-green-50">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h4 class="font-semibold text-gray-900">Orden #${order._id.slice(
                  -8
                )}</h4>
                <p class="text-sm text-gray-600">Cliente: ${customer.name}</p>
                <p class="text-sm text-gray-600">Email: ${customer.email}</p>
                <p class="text-sm text-gray-600">Teléfono: ${customer.phone}</p>
                <p class="text-sm text-gray-600">Total: $${
                  order.totalAmount?.toFixed(2) || "0.00"
                }</p>
                <p class="text-sm text-gray-600">Entregada: ${new Date(
                  order.updatedAt
                ).toLocaleDateString()}</p>
              </div>
              <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Entregada
              </span>
            </div>
            
            <div class="mb-3">
              <p class="text-sm font-medium text-gray-700 mb-1">Dirección de entrega:</p>
              <p class="text-sm text-gray-600">${customer.address}</p>
              <p class="text-sm text-gray-600">
                ${order.shippingAddress?.city || "Ciudad de Panamá"}, ${
              order.shippingAddress?.country || "Panama"
            }
              </p>
            </div>
          </div>
        `;
          })
          .join("");
      },

      getStatusBadgeClass: (status) => {
        switch (status) {
          case "pending":
            return "bg-yellow-100 text-yellow-800";
          case "processing":
            return "bg-blue-100 text-blue-800";
          case "in_transit":
            return "bg-purple-100 text-purple-800";
          case "delivered":
            return "bg-green-100 text-green-800";
          case "cancelled":
            return "bg-red-100 text-red-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      },

      getStatusText: (status) => {
        switch (status) {
          case "pending":
            return "Pendiente";
          case "processing":
            return "Procesando";
          case "in_transit":
            return "En Tránsito";
          case "delivered":
            return "Entregada";
          case "cancelled":
            return "Cancelada";
          default:
            return status;
        }
      },

      assignOrder: async (orderId) => {
        try {
          methods.showLoading();

          const response = await fetch(`${API_URL}/delivery/assign-order`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: orderId,
              deliveryPersonId: currentUser._id,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            methods.showSuccess("Orden asignada exitosamente");
            // Refresh data
            await methods.loadStats();
            await methods.loadAvailableOrders();
          } else {
            throw new Error(data.error || "Error al asignar la orden");
          }
        } catch (error) {
          console.error("Error assigning order:", error);
          methods.showError(error.message);
        } finally {
          methods.hideLoading();
        }
      },

      markAsDelivered: async (orderId) => {
        if (!confirm("¿Estás seguro de que esta orden ha sido entregada?")) {
          return;
        }

        try {
          methods.showLoading();

          const response = await fetch(`${API_URL}/delivery/deliver-order`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: orderId,
              deliveryPersonId: currentUser._id,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            methods.showSuccess("Orden marcada como entregada");
            // Refresh data
            await methods.loadStats();
            await methods.loadMyOrders();
          } else {
            throw new Error(
              data.error || "Error al marcar la orden como entregada"
            );
          }
        } catch (error) {
          console.error("Error marking order as delivered:", error);
          methods.showError(error.message);
        } finally {
          methods.hideLoading();
        }
      },

      showSuccess: (message) => {
        // Simple success notification
        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
        notification.innerHTML = `<i class="fas fa-check mr-2"></i>${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 3000);
      },

      showError: (message) => {
        // Simple error notification
        const notification = document.createElement("div");
        notification.className =
          "fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
        notification.innerHTML = `<i class="fas fa-exclamation-triangle mr-2"></i>${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 5000);
      },
    };

    return {
      init: methods.init,
      assignOrder: methods.assignOrder,
      markAsDelivered: methods.markAsDelivered,
    };
  })();

  // Make DeliveryPanel globally accessible
  window.DeliveryPanel = DeliveryPanel;

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    DeliveryPanel.init();
  });
})();
