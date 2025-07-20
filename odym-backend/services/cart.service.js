import User from '../models/User.js';
import Product from '../models/Product.js';

// Get user's cart
export const getCart = async (userId) => {
  try {
    const user = await User.findById(userId).populate('cart.productId');
    if (!user) throw new Error('User not found');
    
    return user.cart.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.images?.[0] || '',
      quantity: item.quantity,
      stock: item.productId.stock
    }));
  } catch (error) {
    throw new Error('Error fetching cart: ' + error.message);
  }
};

// Add item to cart
export const addToCart = async (userId, productId, quantity = 1) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock < quantity) throw new Error('Insufficient stock');

    const existingItem = user.cart.find(item => 
      item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ productId, quantity });
    }

    await user.save();
    return await getCart(userId);
  } catch (error) {
    throw new Error('Error adding to cart: ' + error.message);
  }
};

// Update cart item quantity
export const updateCartItem = async (userId, productId, quantity) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const cartItem = user.cart.find(item => 
      item.productId.toString() === productId
    );
    
    if (!cartItem) throw new Error('Item not found in cart');

    if (quantity <= 0) {
      return await removeFromCart(userId, productId);
    }

    const product = await Product.findById(productId);
    if (product.stock < quantity) throw new Error('Insufficient stock');

    cartItem.quantity = quantity;
    await user.save();
    
    return await getCart(userId);
  } catch (error) {
    throw new Error('Error updating cart: ' + error.message);
  }
};

// Remove item from cart
export const removeFromCart = async (userId, productId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.cart = user.cart.filter(item => 
      item.productId.toString() !== productId
    );
    
    await user.save();
    return await getCart(userId);
  } catch (error) {
    throw new Error('Error removing from cart: ' + error.message);
  }
};

// Clear cart
export const clearCart = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.cart = [];
    await user.save();
    return [];
  } catch (error) {
    throw new Error('Error clearing cart: ' + error.message);
  }
};

// Get cart total
export const getCartTotal = async (userId) => {
  try {
    const cart = await getCart(userId);
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  } catch (error) {
    throw new Error('Error calculating cart total: ' + error.message);
  }
};
