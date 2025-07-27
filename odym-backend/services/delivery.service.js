import Order from '../models/Order.js';
import User from '../models/User.js';

// Get orders available for delivery (pending and processing)
export const getAvailableOrders = async () => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'processing'] },
      deliveryPersonId: null
    })
      .populate('userId', 'name email')
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 });
    
    // Enrich orders with customer data from Customer model
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      // Try to find customer data using email from shippingAddress or userId
      const email = orderObj.shippingAddress?.email || orderObj.userId?.email;
      if (email) {
        try {
          const Customer = (await import('../models/Customer.js')).default;
          const customer = await Customer.findOne({ email: email });
          if (customer) {
            // Add customer data to the order
            orderObj.customerData = {
              fullName: customer.fullName,
              phone: customer.phone,
              address: customer.address,
              email: customer.email
            };
          }
        } catch (err) {
          console.log('Error fetching customer data:', err);
        }
      }
      
      return orderObj;
    }));
    
    return enrichedOrders;
  } catch (error) {
    throw new Error('Error fetching available orders: ' + error.message);
  }
};

// Get orders assigned to a delivery person (shipped status)
export const getDeliveryPersonOrders = async (deliveryPersonId) => {
  try {
    const orders = await Order.find({
      deliveryPersonId,
      status: 'shipped'
    })
      .populate('userId', 'name email')
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 });
    
    // Enrich orders with customer data from Customer model
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      // Try to find customer data using email from shippingAddress or userId
      const email = orderObj.shippingAddress?.email || orderObj.userId?.email;
      if (email) {
        try {
          const Customer = (await import('../models/Customer.js')).default;
          const customer = await Customer.findOne({ email: email });
          if (customer) {
            // Add customer data to the order
            orderObj.customerData = {
              fullName: customer.fullName,
              phone: customer.phone,
              address: customer.address,
              email: customer.email
            };
          }
        } catch (err) {
          console.log('Error fetching customer data:', err);
        }
      }
      
      return orderObj;
    }));
    
    return enrichedOrders;
  } catch (error) {
    throw new Error('Error fetching delivery person orders: ' + error.message);
  }
};

// Get delivered orders by delivery person for current week
export const getDeliveredOrdersThisWeek = async (deliveryPersonId) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const orders = await Order.find({
      deliveryPersonId,
      status: 'delivered',
      updatedAt: { $gte: startOfWeek, $lte: endOfWeek }
    })
      .populate('userId', 'name email')
      .populate('items.productId', 'name images')
      .sort({ updatedAt: -1 });
    
    // Enrich orders with customer data from Customer model
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      // Try to find customer data using email from shippingAddress or userId
      const email = orderObj.shippingAddress?.email || orderObj.userId?.email;
      if (email) {
        try {
          const Customer = (await import('../models/Customer.js')).default;
          const customer = await Customer.findOne({ email: email });
          if (customer) {
            // Add customer data to the order
            orderObj.customerData = {
              fullName: customer.fullName,
              phone: customer.phone,
              address: customer.address,
              email: customer.email
            };
          }
        } catch (err) {
          console.log('Error fetching customer data:', err);
        }
      }
      
      return orderObj;
    }));
    
    return enrichedOrders;
  } catch (error) {
    throw new Error('Error fetching delivered orders: ' + error.message);
  }
};

// Assign order to delivery person and change status to shipped
export const assignOrderToDelivery = async (orderId, deliveryPersonId) => {
  try {
    // Verify delivery person exists and has correct role
    const deliveryPerson = await User.findById(deliveryPersonId);
    if (!deliveryPerson || deliveryPerson.role !== 'delivery') {
      throw new Error('ID de repartidor invalido');
    }
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        deliveryPersonId,
        status: 'shipped',
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('items.productId', 'name images');
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  } catch (error) {
    throw new Error('Error assigning order: ' + error.message);
  }
};

// Mark order as delivered
export const markOrderAsDelivered = async (orderId, deliveryPersonId) => {
  try {
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPersonId,
        status: 'shipped'
      },
      {
        status: 'delivered',
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('items.productId', 'name images');
    
    if (!order) {
      throw new Error('Order not found or not assigned to this delivery person');
    }
    
    return order;
  } catch (error) {
    throw new Error('Error marking order as delivered: ' + error.message);
  }
};

// Get delivery statistics for a delivery person
export const getDeliveryStats = async (deliveryPersonId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const [
      availableOrders,
      inTransitOrders, 
      deliveredToday,
      deliveredThisWeek
    ] = await Promise.all([
      // Órdenes disponibles para asignar (sin repartidor asignado)
      Order.countDocuments({
        status: { $in: ['pending', 'processing'] },
        deliveryPersonId: null
      }),
      
      // Órdenes en tránsito asignadas a este repartidor
      Order.countDocuments({
        deliveryPersonId,
        status: 'shipped'
      }),
      
      // Órdenes entregadas hoy por este repartidor
      Order.countDocuments({
        deliveryPersonId,
        status: 'delivered',
        updatedAt: { $gte: today, $lt: tomorrow }
      }),
      
      // Órdenes entregadas esta semana por este repartidor
      Order.countDocuments({
        deliveryPersonId,
        status: 'delivered',
        updatedAt: { $gte: startOfWeek, $lte: endOfWeek }
      })
    ]);
    
    return {
      availableOrders,
      inTransitOrders,
      deliveredToday,
      deliveredThisWeek
    };
  } catch (error) {
    throw new Error('Error fetching delivery stats: ' + error.message);
  }
};
