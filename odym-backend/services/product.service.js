import Product from '../models/Product.js';
import { Category } from '../models/Category.js';

// Crear producto (con categoría)
export const createProduct = async ({ name, description, price, categoryId, images }) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new Error('Categoría no existe');

  const product = new Product({ name, description, price, category: categoryId, images });
  return await product.save();
};

// Obtener todos los productos con categorías pobladas
export const getProducts = async () => {
  return await Product.find().populate('category');
};

// Actualizar producto
export const updateProduct = async (id, { name, description, price, categoryId }) => {
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (!category) throw new Error('Categoría no existe');
  }

  return await Product.findByIdAndUpdate(
    id,
    { name, description, price, category: categoryId },
    { new: true }
  ).populate('category');
};

// Eliminar producto
export const deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};
