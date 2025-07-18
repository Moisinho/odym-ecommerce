import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
  nombre_completo: { type: String, required: true },
  nombre_usuario: { type: String, required: true, unique: true },
  correo: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  suscripcion: { type: String, required: true },
  telefono: { type: String, required: true},
  direccion: { type: String, required: true},
});

const Cliente = mongoose.model('Cliente', clienteSchema);
export default Cliente;
