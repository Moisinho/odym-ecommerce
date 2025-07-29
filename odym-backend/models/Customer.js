import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: String, required: true, default: 'User' },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'admin', 'delivery'],
    default: 'user'
  },
  // Campos para suscripción premium
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'inactive'
  },
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String }
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
