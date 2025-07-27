import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
