import Distributor from '../models/Distributor.js';

export const createDistributor = async (distributorData) => {
  const distributor = new Distributor(distributorData);
  const savedDistributor = await distributor.save();
  return await Distributor.findById(savedDistributor._id).select('-password');
};

export const getDistributors = async () => {
  return await Distributor.find().select('-password').sort({ createdAt: -1 });
};

export const updateDistributor = async (id, distributorData) => {
  // If password is provided and not empty, update it (model will hash it)
  if (distributorData.password && distributorData.password.trim() !== '') {
    const distributor = await Distributor.findById(id);
    if (!distributor) return null;
    
    distributor.fullName = distributorData.fullName;
    distributor.username = distributorData.username;
    distributor.email = distributorData.email;
    distributor.phone = distributorData.phone;
    distributor.password = distributorData.password; // This will trigger the pre-save hook
    
    const updatedDistributor = await distributor.save();
    return await Distributor.findById(updatedDistributor._id).select('-password');
  } else {
    // Update without password
    const updateData = {
      fullName: distributorData.fullName,
      username: distributorData.username,
      email: distributorData.email,
      phone: distributorData.phone
    };
    return await Distributor.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  }
};

export const deleteDistributor = async (id) => {
  return await Distributor.findByIdAndDelete(id);
};