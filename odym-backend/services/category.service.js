import Category from '../models/Category.js';

export const createCategory = async ({ name, description }) => {
  const category = new Category({ name, description });
  return await category.save();
};

export const getCategories = async () => {
  return await Category.find();
};

export const updateCategory = async (id, { name, description }) => {
  return await Category.findByIdAndUpdate(id, { name, description }, { new: true });
};

export const deleteCategory = async (id) => {
  return await Category.findByIdAndDelete(id);
};
