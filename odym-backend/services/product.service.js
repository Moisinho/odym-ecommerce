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
