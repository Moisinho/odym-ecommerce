import { createSubscription, getSubscriptions, updateSubscription, deleteSubscription } from '../../services/subscription.service.js';

async function subscriptionRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    try {
      console.log('📡 GET /api/subscriptions - Obteniendo suscripciones...');
      const subscriptions = await getSubscriptions();
      console.log(`📤 Enviando ${subscriptions.length} suscripciones`);
      reply.send(subscriptions);
    } catch (error) {
      console.error('❌ Error en GET /api/subscriptions:', error);
      reply.status(500).send({ error: error.message });
    }
  });

  fastify.post('/', async (request, reply) => {
    try {
      const subscription = await createSubscription(request.body);
      reply.status(201).send(subscription);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      const subscriptionId = request.params.id;
      const data = request.body;

      if (!subscriptionId || !subscriptionId.match(/^[0-9a-fA-F]{24}$/)) {
        return reply.status(400).send({ error: 'Invalid subscription ID format' });
      }

      const updatedSubscription = await updateSubscription(subscriptionId, data);

      if (!updatedSubscription) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }

      reply.send(updatedSubscription);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/:id', async function (request, reply) {
    const subscriptionId = request.params.id;
    
    if (!subscriptionId || !subscriptionId.match(/^[0-9a-fA-F]{24}$/)) {
      reply.status(400).send({ 
        error: 'Invalid subscription ID format',
        details: 'Subscription ID must be a valid 24-character hexadecimal string'
      });
      return;
    }
    
    try {
      const deleted = await deleteSubscription(subscriptionId);
      if (!deleted) {
        reply.status(404).send({ error: 'Subscription not found' });
        return;
      }
      
      reply.status(200).send({ 
        success: true,
        message: 'Subscription deleted successfully',
        deletedId: subscriptionId 
      });
    } catch (error) {
      reply.status(500).send({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
}

export default subscriptionRoutes;