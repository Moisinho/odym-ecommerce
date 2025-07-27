// Dashboard data management
class DashboardManager {
    constructor() {
        this.apiBase = 'http://localhost:3000/api';
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            await this.loadDashboardStats();
            await this.loadRecentOrders();
            await this.loadTopProducts();
            await this.setupCharts();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Error al cargar los datos del dashboard');
        }
    }

    async loadDashboardStats() {
        try {
            const response = await fetch(`${this.apiBase}/analytics/dashboard-stats`);
            const data = await response.json();
            
            if (data.success) {
                this.updateStatsCards(data.stats);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    updateStatsCards(stats) {
        // Update total sales
        const salesElement = document.querySelector('[data-stat="total-sales"]');
        if (salesElement) {
            salesElement.textContent = `$${stats.totalSales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
        }

        // Update total orders
        const ordersElement = document.querySelector('[data-stat="total-orders"]');
        if (ordersElement) {
            ordersElement.textContent = stats.totalOrders.toLocaleString();
        }

        // Update total customers
        const customersElement = document.querySelector('[data-stat="total-customers"]');
        if (customersElement) {
            customersElement.textContent = stats.totalCustomers.toLocaleString();
        }

        // Update total products
        const productsElement = document.querySelector('[data-stat="total-products"]');
        if (productsElement) {
            productsElement.textContent = stats.totalProducts.toLocaleString();
        }

        // Update sales growth
        const growthElement = document.querySelector('[data-stat="sales-growth"]');
        if (growthElement) {
            const isPositive = stats.salesGrowth >= 0;
            growthElement.innerHTML = `
                <i class="fas fa-arrow-${isPositive ? 'up' : 'down'} mr-1"></i> 
                ${Math.abs(stats.salesGrowth).toFixed(1)}% desde el mes pasado
            `;
            growthElement.className = `text-sm mt-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`;
        }
    }

    async loadRecentOrders() {
        try {
            const response = await fetch(`${this.apiBase}/analytics/recent-orders?limit=5`);
            const data = await response.json();
            
            if (data.success) {
                this.updateRecentOrdersTable(data.data);
            }
        } catch (error) {
            console.error('Error loading recent orders:', error);
        }
    }

    updateRecentOrdersTable(orders) {
        const tableBody = document.querySelector('#recent-orders-table tbody');
        if (!tableBody) return;

        tableBody.innerHTML = orders.map(order => {
            const statusClass = this.getStatusClass(order.status);
            const paymentStatusClass = this.getPaymentStatusClass(order.paymentStatus);
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">#${order._id.slice(-6)}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${order.customerName}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">$${order.total.toFixed(2)}</td>
                    <td class="px-4 py-3">
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                            ${this.translateStatus(order.status)}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentStatusClass}">
                            ${this.translatePaymentStatus(order.paymentStatus)}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">${new Date(order.date).toLocaleDateString('es-ES')}</td>
                </tr>
            `;
        }).join('');
    }

    async loadTopProducts() {
        try {
            const response = await fetch(`${this.apiBase}/analytics/top-products?limit=5`);
            const data = await response.json();
            
            if (data.success) {
                this.updateTopProductsList(data.data);
            }
        } catch (error) {
            console.error('Error loading top products:', error);
        }
    }

    updateTopProductsList(products) {
        const container = document.querySelector('#top-products-list');
        if (!container) return;

        container.innerHTML = products.map((product, index) => `
            <div class="flex items-center justify-between py-3 ${index < products.length - 1 ? 'border-b border-gray-200' : ''}">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                        ${product.image ? 
                            `<img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover rounded-lg">` :
                            `<i class="fas fa-box text-gray-400"></i>`
                        }
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900">${product.name}</p>
                        <p class="text-xs text-gray-500">${product.totalSold} vendidos</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-gray-900">$${product.revenue.toFixed(2)}</p>
                    <p class="text-xs text-gray-500">ingresos</p>
                </div>
            </div>
        `).join('');
    }

    async setupCharts() {
        await this.setupSalesChart();
        await this.setupCategoryChart();
    }

    async setupSalesChart() {
        try {
            const response = await fetch(`${this.apiBase}/analytics/monthly-sales?months=6`);
            const data = await response.json();
            
            if (data.success) {
                const ctx = document.getElementById('salesChart');
                if (ctx) {
                    this.charts.sales = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: data.data.map(item => `${item.month} ${item.year}`),
                            datasets: [{
                                label: 'Ventas ($)',
                                data: data.data.map(item => item.total),
                                borderColor: '#f97316',
                                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4
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
                                        callback: function(value) {
                                            return '$' + value.toLocaleString();
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error setting up sales chart:', error);
        }
    }

    async setupCategoryChart() {
        try {
            const response = await fetch(`${this.apiBase}/analytics/sales-by-category`);
            const data = await response.json();
            
            if (data.success) {
                const ctx = document.getElementById('categoryChart');
                if (ctx) {
                    const colors = [
                        '#f97316', '#3b82f6', '#10b981', '#f59e0b', 
                        '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'
                    ];
                    
                    this.charts.category = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: data.data.map(item => item._id),
                            datasets: [{
                                data: data.data.map(item => item.total),
                                backgroundColor: colors.slice(0, data.data.length),
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        padding: 20,
                                        usePointStyle: true
                                    }
                                }
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error setting up category chart:', error);
        }
    }

    getStatusClass(status) {
        const statusClasses = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'processing': 'bg-blue-100 text-blue-800',
            'shipped': 'bg-purple-100 text-purple-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }

    getPaymentStatusClass(status) {
        const statusClasses = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'paid': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800',
            'refunded': 'bg-gray-100 text-gray-800'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-800';
    }

    translateStatus(status) {
        const translations = {
            'pending': 'Pendiente',
            'processing': 'Procesando',
            'shipped': 'Enviado',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        };
        return translations[status] || status;
    }

    translatePaymentStatus(status) {
        const translations = {
            'pending': 'Pendiente',
            'paid': 'Pagado',
            'failed': 'Fallido',
            'refunded': 'Reembolsado'
        };
        return translations[status] || status;
    }

    showError(message) {
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Method to refresh all dashboard data
    async refresh() {
        await this.init();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardManager = new DashboardManager();
});