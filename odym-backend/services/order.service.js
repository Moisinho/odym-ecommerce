import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create order from cart
export const createOrder = async (userId, shippingAddress) => {
  try {
    const user = await User.findById(userId).populate('cart.productId');
    if (!user) throw new Error('User not found');
    if (user.cart.length === 0) throw new Error('Cart is empty');

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of user.cart) {
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

    // Clear cart
    user.cart = [];
    await user.save();

    return order;
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
      .populate('userId', 'name email')
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
    
    return orders;
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

// Get all orders (admin)
export const getAllOrders = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('items.productId', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments();
    
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error('Error fetching orders: ' + error.message);
  }
};
