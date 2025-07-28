import {
    assignOrderToDelivery,
    getAvailableOrders,
    getDeliveredOrdersThisWeek,
    getDeliveryPersonOrders,
    getDeliveryStats,
    markOrderAsDelivered
} from '../../services/delivery.service.js';

async function deliveryRoutes(fastify, options) {
  // Get available orders for delivery (pending and processing)
  fastify.get('/available-orders', async (request, reply) => {
    try {
      const orders = await getAvailableOrders();
      reply.send(orders);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Get orders assigned to delivery person (in transit)
  fastify.get('/my-orders/:deliveryPersonId', async (request, reply) => {
    try {
      const { deliveryPersonId } = request.params;
      const orders = await getDeliveryPersonOrders(deliveryPersonId);
      reply.send(orders);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Get delivered orders this week
  fastify.get('/delivered-this-week/:deliveryPersonId', async (request, reply) => {
    try {
      const { deliveryPersonId } = request.params;
      const orders = await getDeliveredOrdersThisWeek(deliveryPersonId);
      reply.send(orders);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });

  // Assign order to delivery person
  fastify.post('/assign-order', async (request, reply) => {
    try {
      const { orderId, deliveryPersonId } = request.body;
      
      if (!orderId || !deliveryPersonId) {
        reply.status(400).send({ error: 'Order ID and Delivery Person ID are required' });
        return;
      }
      
      const order = await assignOrderToDelivery(orderId, deliveryPersonId);
      reply.send({
        success: true,
        message: 'Order assigned successfully',
        order
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Mark order as delivered
  fastify.put('/deliver-order', async (request, reply) => {
    try {
      const { orderId, deliveryPersonId } = request.body;
      
      if (!orderId || !deliveryPersonId) {
        reply.status(400).send({ error: 'Order ID and Delivery Person ID are required' });
        return;
      }
      
      const order = await markOrderAsDelivered(orderId, deliveryPersonId);
      reply.send({
        success: true,
        message: 'Order marked as delivered',
        order
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Get delivery statistics
  fastify.get('/stats/:deliveryPersonId', async (request, reply) => {
    try {
      const { deliveryPersonId } = request.params;
      const stats = await getDeliveryStats(deliveryPersonId);
      reply.send(stats);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });
}

export default deliveryRoutes;
