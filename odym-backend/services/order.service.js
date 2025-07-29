import User from '../models/User.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import stripe from './stripe.service.js';

// Create order from cart
export const createOrder = async (userId, shippingAddress) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Note: Customer model doesn't have cart, so this function needs to be used with createOrderFromItems
    throw new Error('Use createOrderFromItems for cart-based orders');
  } catch (error) {
    throw new Error('Error creating order: ' + error.message);
  }
};

// Create order from frontend cart items (localStorage)
export const createOrderFromItems = async (userId, items, shippingAddress) => {
  try {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Get user information
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Always use user's address for shipping
    shippingAddress = {
      firstName: user.name.split(' ')[0] || user.name,
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone || 'No disponible',
      address: user.address || 'Dirección no especificada',
      city: 'Ciudad de Panamá',
      postalCode: '0000',
      country: 'Panama'
    };

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of items) {
      const product = await Product.findById(cartItem.productId);
      if (!product) throw new Error(`Product ${cartItem.productId} not found`);
      if (product.stock < cartItem.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.images?.[0] || ''
      });

      totalAmount += product.price * cartItem.quantity;
    }

    // Add shipping cost
    const shipping = 99.99;
    totalAmount += shipping;

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      shippingAddress
    });

    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    return order;
  } catch (error) {
    throw new Error('Error creating order: ' + error.message);
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone address')
      .populate('items.productId', 'name images');
    
    if (!order) throw new Error('Order not found');
    return order;
  } catch (error) {
    throw new Error('Error fetching order: ' + error.message);
  }
};

// Get user orders
export const getUserOrders = async (userId) => {
  try {
    const orders = await Order.find({ userId })
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 });
    
    // Enrich orders with current user data from User model
    const user = await User.findById(userId);
    const enrichedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Update shipping address with current user data if available
      if (user) {
        orderObj.shippingAddress = {
          ...orderObj.shippingAddress,
          firstName: user.name.split(' ')[0] || user.name,
          lastName: user.name.split(' ').slice(1).join(' ') || '',
          email: user.email,
          phone: user.phone || 'No disponible',
          address: user.address || 'Dirección no especificada',
          city: orderObj.shippingAddress?.city || 'Ciudad de Panamá',
          postalCode: orderObj.shippingAddress?.postalCode || '0000',
          country: orderObj.shippingAddress?.country || 'Panama'
        };
      }
      
      return orderObj;
    });
    
    return enrichedOrders;
  } catch (error) {
    throw new Error('Error fetching user orders: ' + error.message);
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!order) throw new Error('Order not found');
    return order;
  } catch (error) {
    throw new Error('Error updating order status: ' + error.message);
  }
};

// Update payment status
export const updatePaymentStatus = async (orderId, paymentStatus, paymentIntentId = null) => {
  try {
    const updateData = { 
      paymentStatus, 
      updatedAt: new Date() 
    };
    
    if (paymentIntentId) {
      updateData.paymentIntentId = paymentIntentId;
    }
    
    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );
    
    if (!order) throw new Error('Order not found');
    return order;
  } catch (error) {
    throw new Error('Error updating payment status: ' + error.message);
  }
};

// Create Stripe payment intent for order
// Create premium box order (called after subscription purchase)
export const createPremiumBoxOrder = async (userId, products, paymentIntentId = null) => {
  try {
    // Idempotencia: evitar duplicados por mismo usuario + paymentIntent
    const existing = await Order.findOne({
      userId,
      orderType: 'premium_box',
      ...(paymentIntentId ? { paymentIntentId: paymentIntentId + '_premium_box' } : {})
    });
    if (existing) return existing;

    if (!products || products.length === 0) throw new Error('No products supplied for premium box');
    if (!products || products.length === 0) throw new Error('No products supplied for premium box');

    // Build items array with price 0 (incluido en suscripción)
    const items = products.map(p => ({
      productId: p._id,
      name: `📦 Caja Premium - ${p.name}`,
      price: 0,
      quantity: 1,
      image: p.images?.[0] || ''
    }));

    // Get user and shipping address
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const shippingAddress = {
      firstName: user.name?.split(' ')[0] || user.fullName?.split(' ')[0] || 'Cliente',
      lastName: user.name?.split(' ').slice(1).join(' ') || user.fullName?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      city: 'Ciudad de Panamá',
      postalCode: '0000',
      country: 'Panama'
    };

    const order = new Order({
      userId,
      items,
      totalAmount: 0,
      status: 'processing',
      paymentStatus: 'paid',
      paymentIntentId: paymentIntentId ? paymentIntentId + '_premium_box' : undefined,
      shippingAddress,
      orderType: 'premium_box'
    });

    await order.save();

    // Decrement stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -1 } });
    }

    return order;
  } catch (err) {
    throw new Error('Error creating premium box order: ' + err.message);
  }
};

export const createPaymentIntent = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: orderId.toString()
      }
    });
    
    // Update order with payment intent ID
    await Order.findByIdAndUpdate(orderId, {
      paymentIntentId: paymentIntent.id
    });
    
    return paymentIntent;
  } catch (error) {
    throw new Error('Error creating payment intent: ' + error.message);
  }
};

// Create order from Stripe session
export const createOrderFromStripeSession = async (session) => {
  try {
    const { metadata } = session;
    const items = JSON.parse(metadata.cart);
    const userId = metadata.userId !== 'guest' ? metadata.userId : null;

    // Get product details
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Prepare order items
    const orderItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images?.[0] || ''
      };
    });

    // Create basic shipping address from session
    const shippingAddress = {
      firstName: session.customer_details?.name?.split(' ')[0] || 'Customer',
      lastName: session.customer_details?.name?.split(' ').slice(1).join(' ') || '',
      email: session.customer_email,
      phone: session.customer_details?.phone || '',
      address: session.customer_details?.address?.line1 || '',
      city: session.customer_details?.address?.city || '',
      postalCode: session.customer_details?.address?.postal_code || '',
      country: session.customer_details?.address?.country || 'US'
    };

    const order = new Order({
      userId,
      items: orderItems,
      totalAmount: session.amount_total / 100, // Convert from cents
      shippingAddress,
      status: 'processing',
      paymentStatus: 'paid',
      paymentIntentId: session.payment_intent
    });

    await order.save();

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      userId: userId || order._id, // Use order ID if guest
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      amount: session.amount_total / 100,
      currency: session.currency,
      status: 'succeeded',
      customerEmail: session.customer_email,
      billingDetails: {
        name: session.customer_details?.name,
        email: session.customer_email,
        phone: session.customer_details?.phone,
        address: session.customer_details?.address
      },
      processedAt: new Date()
    });

    await payment.save();

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    return { order, payment };
  } catch (error) {
    throw new Error('Error creating order from Stripe session: ' + error.message);
  }
};

// Get order with payment details
export const getOrderWithPayment = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate('userId', 'name email phone address')
      .populate('items.productId', 'name price images');
    
    if (!order) {
      throw new Error('Order not found');
    }

    const payment = await Payment.findOne({ orderId });
    
    return { order, payment };
  } catch (error) {
    throw new Error('Error fetching order with payment: ' + error.message);
  }
};

// Get all orders (admin)
export const getAllOrders = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const orders = await Order.find()
      .populate('userId', 'name email phone address')
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments();
    
    return {
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        showingFrom: skip + 1,
        showingTo: Math.min(skip + limit, total)
      }
    };
  } catch (error) {
    throw new Error('Error fetching orders: ' + error.message);
  }
};

// Cancel order (user can only cancel pending/processing orders)
export const cancelOrder = async (orderId, userId) => {
  try {
    const order = await Order.findOne({
      _id: orderId,
      userId: userId,
      status: { $in: ['pending', 'processing'] }
    });
    
    if (!order) {
      throw new Error('Order not found or cannot be cancelled');
    }
    
    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }
    
    // Update order status to cancelled
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        status: 'cancelled',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email phone address')
     .populate('items.productId', 'name images');
    
    return updatedOrder;
  } catch (error) {
    throw new Error('Error cancelling order: ' + error.message);
  }
};

// Delete order (admin)
export const deleteOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return null;
    }
    
    // Restore product stock before deleting order
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: item.quantity } }
      );
    }
    
    // Delete associated payment if exists
    await Payment.findOneAndDelete({ orderId });
    
    // Delete the order
    const result = await Order.findByIdAndDelete(orderId);
    return result;
  } catch (error) {
    throw new Error('Error deleting order: ' + error.message);
  }
};
