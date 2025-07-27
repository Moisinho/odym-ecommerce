import { createDistributor, getDistributors, updateDistributor, deleteDistributor } from '../../services/distributor.service.js';

async function distributorRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    const distributors = await getDistributors();
    reply.send(distributors);
  });

  fastify.post('/', async (request, reply) => {
    try {
      const distributor = await createDistributor(request.body);
      reply.status(201).send(distributor);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      const distributorId = request.params.id;
      const data = request.body;

      if (!distributorId || !distributorId.match(/^[0-9a-fA-F]{24}$/)) {
        return reply.status(400).send({ error: 'Invalid distributor ID format' });
      }

      const updatedDistributor = await updateDistributor(distributorId, data);

      if (!updatedDistributor) {
        return reply.status(404).send({ error: 'Distributor not found' });
      }

      reply.send(updatedDistributor);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/:id', async function (request, reply) {
    const distributorId = request.params.id;
    
    if (!distributorId || !distributorId.match(/^[0-9a-fA-F]{24}$/)) {
      reply.status(400).send({ 
        error: 'Invalid distributor ID format',
        details: 'Distributor ID must be a valid 24-character hexadecimal string'
      });
      return;
    }
    
    try {
      const deleted = await deleteDistributor(distributorId);
      if (!deleted) {
        reply.status(404).send({ error: 'Distributor not found' });
        return;
      }
      
      reply.status(200).send({ 
        success: true,
        message: 'Distributor deleted successfully',
        deletedId: distributorId 
      });
    } catch (error) {
      reply.status(500).send({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
}

export default distributorRoutes;