import Cliente from '../../models/Cliente.js';

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
