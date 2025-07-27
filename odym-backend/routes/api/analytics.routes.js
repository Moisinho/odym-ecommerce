import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Customer from '../../models/Customer.js';
import mongoose from 'mongoose';

async function analyticsRoutes(fastify, options) {
  // Dashboard statistics
  fastify.get('/dashboard-stats', async (request, reply) => {
    try {
      // Total sales amount
      const totalSalesResult = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const totalSales = totalSalesResult[0]?.total || 0;

      // Total orders count
      const totalOrders = await Order.countDocuments();

      // Total customers count
      const totalCustomers = await Customer.countDocuments();

      // Total products count
      const totalProducts = await Product.countDocuments();

      // Recent orders (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrders = await Order.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Sales growth (compare last 30 days vs previous 30 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const lastMonthSales = await Order.aggregate([
        { 
          $match: { 
            paymentStatus: 'paid',
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      
      const previousMonthSales = await Order.aggregate([
        { 
          $match: { 
            paymentStatus: 'paid',
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      const lastMonth = lastMonthSales[0]?.total || 0;
      const previousMonth = previousMonthSales[0]?.total || 0;
      const salesGrowth = previousMonth > 0 ? ((lastMonth - previousMonth) / previousMonth * 100) : 0;

      reply.send({
        success: true,
        stats: {
          totalSales,
          totalOrders,
          totalCustomers,
          totalProducts,
          recentOrders,
          salesGrowth: Math.round(salesGrowth * 100) / 100
        }
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Monthly sales data for chart
  fastify.get('/monthly-sales', async (request, reply) => {
    try {
      const { months = 6 } = request.query;
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

      const monthlySales = await Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: monthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];

      const formattedData = monthlySales.map(item => ({
        month: monthNames[item._id.month - 1],
        year: item._id.year,
        total: item.total,
        count: item.count
      }));

      reply.send({
        success: true,
        data: formattedData
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Sales by category
  fastify.get('/sales-by-category', async (request, reply) => {
    try {
      const salesByCategory = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'categories',
            localField: 'product.category',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category.name',
            total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            count: { $sum: '$items.quantity' }
          }
        },
        { $sort: { total: -1 } }
      ]);

      reply.send({
        success: true,
        data: salesByCategory
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Top selling products
  fastify.get('/top-products', async (request, reply) => {
    try {
      const { limit = 5 } = request.query;
      
      const topProducts = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            image: { $first: '$items.image' }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: parseInt(limit) }
      ]);

      reply.send({
        success: true,
        data: topProducts
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Recent orders for dashboard
  fastify.get('/recent-orders', async (request, reply) => {
    try {
      const { limit = 5 } = request.query;
      
      const recentOrders = await Order.find()
        .populate('userId', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .select('_id totalAmount status paymentStatus createdAt userId items');

      const formattedOrders = recentOrders.map(order => ({
        _id: order._id,
        customerName: order.userId?.fullName || 'Cliente Invitado',
        customerEmail: order.userId?.email || 'N/A',
        total: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        itemCount: order.items.length,
        date: order.createdAt
      }));

      reply.send({
        success: true,
        data: formattedOrders
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Low stock products alert
  fastify.get('/low-stock', async (request, reply) => {
    try {
      const { threshold = 10 } = request.query;
      
      const lowStockProducts = await Product.find({
        stock: { $lte: parseInt(threshold) }
      })
      .populate('category', 'name')
      .sort({ stock: 1 })
      .select('name stock category images');

      reply.send({
        success: true,
        data: lowStockProducts,
        count: lowStockProducts.length
      });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });
}

export default analyticsRoutes;