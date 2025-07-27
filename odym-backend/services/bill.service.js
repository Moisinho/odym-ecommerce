import Bill from '../models/Bill.js';

export const createBill = async (billData) => {
  const bill = new Bill(billData);
  return await bill.save();
};

export const getBills = async () => {
  return await Bill.find()
    .populate('customerId', 'fullName email')
    .populate('orderId', 'orderNumber status')
    .sort({ createdAt: -1 });
};

export const updateBill = async (id, billData) => {
  return await Bill.findByIdAndUpdate(id, billData, { new: true })
    .populate('customerId', 'fullName email')
    .populate('orderId', 'orderNumber status');
};

export const deleteBill = async (id) => {
  return await Bill.findByIdAndDelete(id);
};