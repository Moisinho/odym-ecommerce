import { obtenerClientes, loginCliente, registroCliente, editarCliente, eliminarCliente } from '../controllers/clientes.controller.js';

export default async function clientesRoutes(fastify, options) {
  fastify.get('/', obtenerClientes);
  fastify.post('/login', loginCliente); 
  fastify.post('/registro', registroCliente);
  fastify.put('/:id', editarCliente);
  fastify.delete('/:id', eliminarCliente);
}
