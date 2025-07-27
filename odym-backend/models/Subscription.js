import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  subscriptionType: { 
    type: String, 
    required: true,
    enum: ['God', 'User'],
    unique: true
  },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { 
    type: String, 
    required: true,
    enum: ['1 month', 'infinite']
  }
}, {
  timestamps: true
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
