import { changeCustomerPassword,
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

export default async function userRoutes(fastify, options) {
  // Basic user operations
  fastify.get('/', getCustomers);
  fastify.post('/login', loginCustomer);
  fastify.post('/register', registerCustomer);
  fastify.put('/:id', updateCustomer);
  fastify.delete('/:id', deleteCustomer);

  // Validation endpoints
  fastify.get('/check-username/:username', checkUsername);
  fastify.get('/check-email/:email', checkEmail);

  // Admin registration (internal use only - requires special token)
  fastify.post('/register-admin', async (request, reply) => {
    try {
      const { adminToken } = request.body;

      // Verify admin token (you should use a secure token)
      if (adminToken !== process.env.ADMIN_CREATION_TOKEN) {
        return reply.status(403).send({ error: 'Token de administrador inválido' });
      }

      // Force admin role and bypass restrictions
      request.body.role = 'admin';
      request.body.bypassRestrictions = true;
      return await registerCustomer(request, reply);
    } catch (error) {
      reply.status(500).send({ error: 'Error al registrar administrador', details: error.message });
    }
  });

  // Admin panel user creation (allows specific roles)
  fastify.post('/admin-create', async (request, reply) => {
    try {
      // This endpoint is for admin panel use - should be protected by admin authentication
      // For now, we'll allow it but in production you should verify admin session

      request.body.bypassRestrictions = true; // Allow admin panel to set any role
      return await registerCustomer(request, reply);
    } catch (error) {
      reply.status(500).send({ error: 'Error al crear usuario desde admin panel', details: error.message });
    }
  });

  // Admin verification
  fastify.get('/verify-admin/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const adminStatus = await isAdmin(id);
      reply.send({ isAdmin: adminStatus });
    } catch (error) {
      reply.status(500).send({ error: 'Error verifying admin status', details: error.message });
    }
  });

  // Get user profile by ID
  fastify.get('/profile/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const user = await getCustomerById(id);
      reply.send({ success: true, user });
    } catch (error) {
      reply.status(404).send({ error: error.message });
    }
  });

  // Update user profile
  fastify.put('/profile/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const user = await updateCustomerProfile(id, request.body);

      reply.send({
        success: true,
        user,
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

  // Register delivery personnel (internal use only - requires special token)
  fastify.post('/register-delivery', async (request, reply) => {
    try {
      const { adminToken } = request.body;

      // Verify admin token
      if (adminToken !== process.env.ADMIN_CREATION_TOKEN) {
        return reply.status(403).send({ error: 'Token de administrador inválido' });
      }

      // Force delivery role and bypass restrictions
      request.body.role = 'delivery';
      request.body.bypassRestrictions = true;
      return await registerCustomer(request, reply);
    } catch (error) {
      reply.status(500).send({ error: 'Error al registrar repartidor', details: error.message });
    }
  });

  // Admin panel update user (allows role changes)
  fastify.put('/admin-update/:id', async (request, reply) => {
    try {
      // This endpoint is for admin panel use - should be protected by admin authentication
      request.body.bypassRestrictions = true; // Allow admin panel to set any role
      return await updateCustomer(request, reply);
    } catch (error) {
      reply.status(500).send({ error: 'Error al actualizar usuario desde admin panel', details: error.message });
    }
  });

  // Get delivery personnel
  fastify.get('/delivery', async (request, reply) => {
    try {
      const deliveryPersonnel = await getDeliveryPersonnel();
      reply.send({ success: true, deliveryPersonnel });
    } catch (error) {
      reply.status(500).send({ error: 'Error fetching delivery personnel', details: error.message });
    }
  });
}