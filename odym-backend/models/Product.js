import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stripePriceId: { type: String }, // ID en Stripe
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
  },
  images: [{ type: String }], // URLs de imágenes
  stock: { type: Number, default: 0, min: 0 } // Stock disponible
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

export default mongoose.model('Product', productSchema);
