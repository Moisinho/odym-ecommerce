import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripeSessionId: {
    type: String,
    required: true
  },
  stripePaymentIntentId: {
    type: String
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank_transfer'],
    default: 'card'
  },
  customerEmail: {
    type: String,
    required: true
  },
  billingDetails: {
    name: String,
    email: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postal_code: String,
      country: String
    }
  },
  metadata: {
    type: Map,
    of: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  failureReason: String,
  processedAt: Date,
  refundedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ stripeSessionId: 1 }, { unique: true });
paymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for payment status display
paymentSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Pendiente',
    processing: 'Procesando',
    succeeded: 'Exitoso',
    failed: 'Fallido',
    canceled: 'Cancelado',
    refunded: 'Reembolsado'
  };
  return statusMap[this.status] || this.status;
});

// Method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function() {
  return this.status === 'succeeded' && this.refundAmount < this.amount;
};

// Method to get remaining refundable amount
paymentSchema.methods.getRefundableAmount = function() {
  if (this.status !== 'succeeded') return 0;
  return this.amount - this.refundAmount;
};

// Static method to find payments by order
paymentSchema.statics.findByOrder = function(orderId) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

// Static method to find payments by user
paymentSchema.statics.findByUser = function(userId, limit = 10) {
  return this.find({ userId })
    .populate('orderId')
    .sort({ createdAt: -1 })
    .limit(limit);
};

export default mongoose.model('Payment', paymentSchema);
