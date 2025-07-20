import Cliente from '../models/Cliente.js';

export async function obtenerClientes(request, reply) {
  const clientes = await Cliente.find();
  return reply.status(200).send({ clientes });
}

export async function loginCliente(request, reply) {
  const { correo, contrasena } = request.body;

  const cliente = await Cliente.findOne({ correo });

  if (!cliente) {
    return reply.status(404).send({ error: 'Cliente no encontrado' });
  }

  // Si aún no usas bcrypt, comparas directamente:
  if (cliente.contrasena !== contrasena) {
    return reply.status(401).send({ error: 'Contraseña incorrecta' });
  }

  return {
    mensaje: 'Login exitoso',
    cliente: {
      id: cliente._id,
      nombre: cliente.nombre,
      correo: cliente.correo
    }
  };
}

export async function registroCliente(request, reply) {
  const { nombre_completo, nombre_usuario, correo, contrasena, suscripcion, telefono, direccion } = request.body;

  const cliente = await Cliente.create({ nombre_completo, nombre_usuario, correo, contrasena, suscripcion, telefono, direccion });

  return reply.status(201).send({ mensaje: 'Cliente registrado exitosamente', cliente });
}

export async function editarCliente(request, reply) {
  const { id } = request.params;
  const { nombre_completo, nombre_usuario, correo, contrasena, suscripcion, telefono, direccion } = request.body;

  const cliente = await Cliente.findByIdAndUpdate(id, { nombre_completo, nombre_usuario, correo, contrasena, suscripcion, telefono, direccion }, { new: true });

  return reply.status(200).send({ mensaje: 'Cliente actualizado exitosamente', cliente });
}

export async function eliminarCliente(request, reply) {
  const { id } = request.params;
  await Cliente.findByIdAndDelete(id);
  return reply.status(200).send({ mensaje: 'Cliente eliminado exitosamente' });
}
