// Dashboard functionality for ODYM Admin
(() => {
    const Dashboard = {
        charts: {},

        init() {
            this.loadDashboardData();
            this.initializeCharts();
            this.setupEventListeners();
        },

        async loadDashboardData() {
            try {
                // Load statistics
                await this.loadStatistics();
                await this.loadRecentOrders();
                await this.loadTopProducts();
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        },

        async loadStatistics() {
            try {
                const response = await fetch(`${API_BASE_URL}/analytics/dashboard-stats`);
                if (response.ok) {
                    const stats = await response.json();
                    this.updateStatistics(stats);
                }
            } catch (error) {
                console.error('Error loading statistics:', error);
                // Set default values
                this.updateStatistics({
                    totalSales: 0,
                    totalOrders: 0,
                    totalCustomers: 0,
                    totalProducts: 0
                });
            }
        },

        updateStatistics(stats) {
            const elements = {
                totalSales: document.querySelector('[data-stat="total-sales"]'),
                totalOrders: document.querySelector('[data-stat="total-orders"]'),
                totalCustomers: document.querySelector('[data-stat="total-customers"]'),
                totalProducts: document.querySelector('[data-stat="total-products"]')
            };

            if (elements.totalSales) elements.totalSales.textContent = `$${stats.totalSales?.toFixed(2) || '0.00'}`;
            if (elements.totalOrders) elements.totalOrders.textContent = stats.totalOrders || '0';
            if (elements.totalCustomers) elements.totalCustomers.textContent = stats.totalCustomers || '0';
            if (elements.totalProducts) elements.totalProducts.textContent = stats.totalProducts || '0';
        },

        async loadRecentOrders() {
            try {
                const response = await fetch(`${API_BASE_URL}/orders?limit=5`);
                if (response.ok) {
                    const orders = await response.json();
                    this.updateRecentOrdersTable(orders.orders || []);
                } else {
                    this.updateRecentOrdersTable([]);
                }
            } catch (error) {
                console.error('Error loading recent orders:', error);
                this.updateRecentOrdersTable([]);
            }
        },

        updateRecentOrdersTable(orders) {
            const tbody = document.querySelector('#recent-orders-table tbody');
            if (!tbody) return;

            if (orders.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                            <i class="fas fa-inbox mr-2"></i>
                            No hay pedidos recientes
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = orders.map(order => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">#${order._id?.slice(-6) || 'N/A'}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">${order.customerName || 'Cliente'}</td>
                    <td class="px-4 py-3 text-sm text-gray-900">$${order.total?.toFixed(2) || '0.00'}</td>
                    <td class="px-4 py-3 text-sm">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusColor(order.status)}">
                            ${order.status || 'Pendiente'}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${this.getPaymentColor(order.paymentStatus)}">
                            ${order.paymentStatus || 'Pendiente'}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">${this.formatDate(order.createdAt)}</td>
                </tr>
            `).join('');
        },

        async loadTopProducts() {
            try {
                const response = await fetch(`${API_BASE_URL}/analytics/top-products?limit=5`);
                if (response.ok) {
                    const products = await response.json();
                    this.updateTopProductsList(products.products || []);
                } else {
                    this.updateTopProductsList([]);
                }
            } catch (error) {
                console.error('Error loading top products:', error);
                this.updateTopProductsList([]);
            }
        },

        updateTopProductsList(products) {
            const container = document.getElementById('top-products-list');
            if (!container) return;

            if (products.length === 0) {
                container.innerHTML = `
                    <div class="flex items-center justify-center py-8 text-gray-500">
                        <i class="fas fa-box-open mr-2"></i>
                        No hay datos de productos
                    </div>
                `;
                return;
            }

            container.innerHTML = products.map((product, index) => `
                <div class="flex items-center justify-between py-3 ${index < products.length - 1 ? 'border-b border-gray-200' : ''}">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-box text-gray-500"></i>
                        </div>
                        <div>
                            <p class="font-medium text-sm text-gray-900">${product.name || 'Producto'}</p>
                            <p class="text-xs text-gray-500">${product.sales || 0} ventas</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-medium text-sm text-gray-900">$${product.price?.toFixed(2) || '0.00'}</p>
                    </div>
                </div>
            `).join('');
        },

        initializeCharts() {
            this.initSalesChart();
            this.initCategoryChart();
        },

        initSalesChart() {
            const ctx = document.getElementById('salesChart');
            if (!ctx) return;

            this.charts.sales = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Ventas ($)',
                        data: [1200, 1900, 3000, 5000, 2000, 3000],
                        borderColor: '#d97706',
                        backgroundColor: 'rgba(217, 119, 6, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return '$' + value;
                                }
                            }
                        }
                    }
                }
            });
        },

        initCategoryChart() {
            const ctx = document.getElementById('categoryChart');
            if (!ctx) return;

            this.charts.category = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Proteínas', 'Suplementos', 'Accesorios', 'Ropa'],
                    datasets: [{
                        data: [40, 30, 20, 10],
                        backgroundColor: [
                            '#d97706',
                            '#059669',
                            '#7c3aed',
                            '#dc2626'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },

        setupEventListeners() {
            // Sidebar toggle
            const sidebarToggle = document.getElementById('sidebarToggle');
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', this.toggleSidebar);
            }
        },

        toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('hidden');
            }
        },

        getStatusColor(status) {
            const colors = {
                'completed': 'bg-green-100 text-green-800',
                'pending': 'bg-yellow-100 text-yellow-800',
                'cancelled': 'bg-red-100 text-red-800',
                'processing': 'bg-blue-100 text-blue-800'
            };
            return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
        },

        getPaymentColor(status) {
            const colors = {
                'paid': 'bg-green-100 text-green-800',
                'pending': 'bg-yellow-100 text-yellow-800',
                'failed': 'bg-red-100 text-red-800'
            };
            return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    };

    // Initialize dashboard when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Dashboard.init());
    } else {
        Dashboard.init();
    }

    // Make Dashboard globally accessible
    window.Dashboard = Dashboard;
})();