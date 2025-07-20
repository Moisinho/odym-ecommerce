import Product from '../models/Product.js';
import { Category } from '../models/Category.js';

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
  return await Product.findByIdAndDelete(id);
};

// Obtener productos con stock disponible
export const getProductsWithStock = async () => {
  return await Product.find({ stock: { $gt: 0 } }).populate('category');
};
