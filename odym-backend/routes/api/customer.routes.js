import { getCustomers, loginCustomer, registerCustomer, updateCustomer, deleteCustomer, checkUsername, checkEmail, isAdmin, verifyAdmin } from '../../services/customer.service.js';

export default async function customerRoutes(fastify, options) {
  fastify.get('/', getCustomers);
  fastify.post('/login', loginCustomer); 
  fastify.post('/register', registerCustomer);
  fastify.post('/', registerCustomer); // Agregar ruta POST para crear clientes desde admin
  fastify.put('/:id', updateCustomer);
  fastify.delete('/:id', deleteCustomer);
  fastify.get('/check-username/:username', checkUsername);
  fastify.get('/check-email/:email', checkEmail);
  
  // Ruta específica para registrar administradores
  fastify.post('/register-admin', async (request, reply) => {
    try {
      // Forzar el rol a admin
      request.body.role = 'admin';
      return await registerCustomer(request, reply);
    } catch (error) {
      reply.status(500).send({ error: 'Error al registrar administrador', details: error.message });
    }
  });
  
  // Ruta para verificar si un usuario es admin
  fastify.get('/is-admin/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const adminStatus = await isAdmin(id);
      reply.send({ isAdmin: adminStatus });
    } catch (error) {
      reply.status(500).send({ error: 'Error al verificar estado de admin', details: error.message });
    }
  });
}
