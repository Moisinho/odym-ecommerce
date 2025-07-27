import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  
});

const Bill = mongoose.model('Bill', billSchema);
export default Bill;
