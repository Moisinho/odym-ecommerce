import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

export const createAdmin = async ({ fullName, username, email, password }) => {
  const admin = new Admin({ 
    fullName, 
    username, 
    email, 
    password 
  });
  return await admin.save();
};

export const getAdmins = async () => {
  return await Admin.find().select('-password');
};

export const updateAdmin = async (id, { fullName, username, email, password }) => {
  // If password is provided and not empty, update it (model will hash it)
  if (password && password.trim() !== '') {
    const admin = await Admin.findById(id);
    if (!admin) return null;
    
    admin.fullName = fullName;
    admin.username = username;
    admin.email = email;
    admin.password = password; // This will trigger the pre-save hook
    
    const updatedAdmin = await admin.save();
    return await Admin.findById(updatedAdmin._id).select('-password');
  } else {
    // Update without password
    const updateData = { fullName, username, email };
    return await Admin.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  }
};

export const deleteAdmin = async (id) => {
  return await Admin.findByIdAndDelete(id);
};