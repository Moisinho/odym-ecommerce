import {
  changeCustomerPassword,
  checkEmail,
  checkUsername,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  getDeliveryPersonnel,
  isAdmin,
  loginCustomer,
  registerCustomer,
  updateCustomer,
  updateCustomerProfile
} from '../../services/customer.service.js';

export default async function customerRoutes(fastify, options) {
  fastify.get('/', getCustomers);
  fastify.post('/login', loginCustomer); 
  fastify.post('/register', registerCustomer);
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

  // Get customer profile by ID
  fastify.get('/profile/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const customer = await getCustomerById(id);
      reply.send({ success: true, customer });
    } catch (error) {
      reply.status(404).send({ error: error.message });
    }
  });

  // Update customer profile
  fastify.put('/profile/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const customer = await updateCustomerProfile(id, request.body);
      reply.send({ 
        success: true, 
        customer,
        message: 'Profile updated successfully' 
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Change password
  fastify.put('/change-password/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { currentPassword, newPassword } = request.body;
      
      if (!currentPassword || !newPassword) {
        return reply.status(400).send({ error: 'Current password and new password are required' });
      }
      
      const result = await changeCustomerPassword(id, currentPassword, newPassword);
      reply.send({ success: true, ...result });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Get delivery personnel
  fastify.get('/delivery-personnel', async (request, reply) => {
    try {
      const personnel = await getDeliveryPersonnel();
      reply.send({ success: true, personnel });
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Ruta específica para registrar repartidores
  fastify.post('/register-delivery', async (request, reply) => {
    try {
      // Forzar el rol a delivery
      request.body.role = 'delivery';
      return await registerCustomer(request, reply);
    } catch (error) {
      reply.status(500).send({ error: 'Error al registrar repartidor', details: error.message });
    }
  });
}
