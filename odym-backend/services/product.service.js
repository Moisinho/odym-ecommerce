import Product from '../models/Product.js';
import Category from '../models/Category.js';

// Crear producto (con categoría y stock)
export const createProduct = async ({ name, description, price, categoryId, images, stock = 0 }) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new Error('Categoría no existe');

  const product = new Product({ 
    name, 
    description, 
    price, 
    category: categoryId, 
    images, 
    stock: Math.max(0, stock) // Asegurar que el stock no sea negativo
  });
  return await product.save();
};

// Obtener todos los productos con categorías pobladas
export const getProducts = async () => {
  return await Product.find().populate('category');
};

// Obtener producto por ID
export const getProductById = async (productId) => {
  try {
    const product = await Product.findById(productId).populate('category');
    
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new Error('Invalid product ID format');
    }
    throw new Error('Error fetching product: ' + error.message);
  }
};

// Actualizar producto (incluyendo stock)
export const updateProduct = async (id, { name, description, price, categoryId, stock }) => {
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) throw new Error('Categoría no existe');
  }

  return await Product.findByIdAndUpdate(
    id,
    { 
      name, 
      description, 
      price, 
      category: categoryId,
      stock: stock !== undefined ? Math.max(0, stock) : undefined
    },
    { new: true }
  ).populate('category');
};

// Actualizar stock de producto
export const updateProductStock = async (id, quantity) => {
  const product = await Product.findById(id);
  if (!product) throw new Error('Producto no encontrado');
  
  const newStock = Math.max(0, product.stock + quantity);
  return await Product.findByIdAndUpdate(
    id,
    { stock: newStock },
    { new: true }
  ).populate('category');
};

// Verificar disponibilidad de stock
export const checkStockAvailability = async (id, requestedQuantity) => {
  const product = await Product.findById(id);
  if (!product) throw new Error('Producto no encontrado');
  
  return {
    available: product.stock >= requestedQuantity,
    currentStock: product.stock
  };
};

// Eliminar producto
export const deleteProduct = async (id) => {
  try {
    // First check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return null;
    }
    
    // Check if product is referenced in any orders (optional constraint)
    // For now, we'll allow deletion even if referenced
    
    const result = await Product.findByIdAndDelete(id);
    return result;
  } catch (error) {
    throw error;
  }
};

// Obtener productos con stock disponible
export const getProductsWithStock = async () => {
  return await Product.find({ stock: { $gt: 0 } }).populate('category');
};

// Get most purchased products
export const getMostPurchasedProducts = async (limit = 4) => {
  try {
    const Order = (await import('../models/Order.js')).default;
    
    // Aggregate orders to find most purchased products
    const mostPurchased = await Order.aggregate([
      // Match only completed orders
      { $match: { status: { $in: ['delivered', 'processing', 'shipped'] } } },
      
      // Unwind items array to work with individual products
      { $unwind: '$items' },
      
      // Group by product ID and sum quantities
      {
        $group: {
          _id: '$items.productId',
          totalQuantity: { $sum: '$items.quantity' },
          totalOrders: { $sum: 1 }
        }
      },
      
      // Sort by total quantity descending
      { $sort: { totalQuantity: -1 } },
      
      // Limit to specified number
      { $limit: limit }
    ]);
    
    // Get product details for the most purchased products
    const productIds = mostPurchased.map(item => item._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('category', 'name');
    
    // Sort products according to purchase frequency
    const sortedProducts = mostPurchased.map(item => {
      const product = products.find(p => p._id.toString() === item._id.toString());
      if (product) {
        return {
          ...product.toObject(),
          purchaseStats: {
            totalQuantity: item.totalQuantity,
            totalOrders: item.totalOrders
          }
        };
      }
      return null;
    }).filter(Boolean);
    
    // If we don't have enough most purchased products, fill with random products
    if (sortedProducts.length < limit) {
      const remainingCount = limit - sortedProducts.length;
      const usedIds = sortedProducts.map(p => p._id);
      
      const additionalProducts = await Product.find({ 
        _id: { $nin: usedIds } 
      })
        .populate('category', 'name')
        .limit(remainingCount)
        .sort({ createdAt: -1 });
      
      sortedProducts.push(...additionalProducts);
    }
    
    return sortedProducts;
  } catch (error) {
    throw new Error('Error fetching most purchased products: ' + error.message);
  }
};
