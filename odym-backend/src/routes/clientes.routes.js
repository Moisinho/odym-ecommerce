import { loginCliente } from '../controllers/clientes.controller.js';

export default async function clientesRoutes(fastify, options) {
  fastify.post('/login', loginCliente); 
}
