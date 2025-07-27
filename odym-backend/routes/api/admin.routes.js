import { createAdmin, getAdmins, updateAdmin, deleteAdmin } from '../../services/admin.service.js';

async function adminRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    const admins = await getAdmins();
    reply.send(admins);
  });

  fastify.post('/', async (request, reply) => {
    try {
      const admin = await createAdmin(request.body);
      reply.status(201).send(admin);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      const adminId = request.params.id;
      const data = request.body;

      if (!adminId || !adminId.match(/^[0-9a-fA-F]{24}$/)) {
        return reply.status(400).send({ error: 'Invalid admin ID format' });
      }

      const updatedAdmin = await updateAdmin(adminId, data);

      if (!updatedAdmin) {
        return reply.status(404).send({ error: 'Admin not found' });
      }

      reply.send(updatedAdmin);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/:id', async function (request, reply) {
    const adminId = request.params.id;

    if (!adminId || !adminId.match(/^[0-9a-fA-F]{24}$/)) {
      reply.status(400).send({
        error: 'Invalid admin ID format',
        details: 'Admin ID must be a valid 24-character hexadecimal string'
      });
      return;
    }

    try {
      const deleted = await deleteAdmin(adminId);
      if (!deleted) {
        reply.status(404).send({ error: 'Admin not found' });
        return;
      }

      reply.status(200).send({
        success: true,
        message: 'Admin deleted successfully',
        deletedId: adminId
      });
    } catch (error) {
      reply.status(500).send({
        error: 'Internal server error',
        details: error.message
      });
    }
  });
}

export default adminRoutes;