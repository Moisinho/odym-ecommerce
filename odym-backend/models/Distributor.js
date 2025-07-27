import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const distributorSchema = new mongoose.Schema({
  fullName: { type: String, required: true }, // nombre_completo
  username: { type: String, required: true, unique: true }, // nombre_usuario
  email: { type: String, required: true, unique: true }, // correo
  password: { type: String, required: true }, // contrasena
  phone: { type: String, required: true } // telefono
}, {
  timestamps: true
});

// Hash password before saving
distributorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
distributorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Distributor = mongoose.model('Distributor', distributorSchema);
export default Distributor;
