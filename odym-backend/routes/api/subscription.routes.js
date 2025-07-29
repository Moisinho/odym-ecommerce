import { 
  createSubscription, 
  getSubscriptions, 
  updateSubscription, 
  deleteSubscription,
  activatePremiumSubscription,
  isPremiumUser,
  getPremiumBoxProducts
} from '../../services/subscription.service.js';
import StripeService from '../../services/stripe.service.js';

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

  // Ruta para crear sesión de pago de suscripción premium
  fastify.post('/premium/checkout', async (request, reply) => {
    try {
      const { customerEmail, userId } = request.body;
      
      if (!customerEmail) {
        return reply.status(400).send({ error: 'Customer email is required' });
      }

      const stripeService = new StripeService(fastify.db);
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5500/odym-frontend';
      const result = await stripeService.createSubscriptionCheckoutSession({
        customerEmail,
        userId,
        successUrl: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
        cancelUrl: `${baseUrl}/cancel.html`
      });

      if (result.success) {
        reply.send({
          success: true,
          sessionId: result.sessionId,
          url: result.url
        });
      } else {
        reply.status(400).send({ error: result.error });
      }
    } catch (error) {
      console.error('Error creating premium subscription checkout:', error);
      reply.status(500).send({ error: error.message });
    }
  });

  // Ruta para verificar estado de suscripción premium
  fastify.get('/premium/status/:userId', async (request, reply) => {
    try {
      const { userId } = request.params;
      const isPremium = await isPremiumUser(userId);
      
      reply.send({
        success: true,
        isPremium,
        subscriptionType: isPremium ? 'God' : 'User'
      });
    } catch (error) {
      console.error('Error checking premium status:', error);
      reply.status(500).send({ error: error.message });
    }
  });

  // Ruta para activar suscripción premium después del pago
  fastify.post('/premium/activate', async (request, reply) => {
    try {
      const { userId, sessionId } = request.body;
      
      if (!userId || !sessionId) {
        return reply.status(400).send({ error: 'User ID and session ID are required' });
      }

      // Verificar el pago con Stripe
      const stripeService = new StripeService(fastify.db);
      const paymentResult = await stripeService.verifyPayment(sessionId);
      
      if (!paymentResult.success) {
        return reply.status(400).send({ error: 'Payment verification failed' });
      }

      // Activar suscripción premium
      const updatedCustomer = await activatePremiumSubscription(userId);
      
      // Crear orden para la caja de productos
      const boxProducts = await getPremiumBoxProducts();
      let boxOrder = null;
      if (boxProducts.length > 0) {
        const { createPremiumBoxOrder } = await import('../../services/order.service.js');
        boxOrder = await createPremiumBoxOrder(userId, boxProducts, paymentResult.paymentIntentId);
        console.log('📦 Caja premium creada (endpoint activate):', boxOrder._id);
      }

      reply.send({
        success: true,
        message: 'Premium subscription activated successfully',
        customer: updatedCustomer,
        boxProducts: boxProducts.length,
        boxOrder
      });
    } catch (error) {
      console.error('Error activating premium subscription:', error);
      reply.status(500).send({ error: error.message });
    }
  });

  // Ruta para obtener productos de la caja premium
  fastify.get('/premium/box-products', async (request, reply) => {
    try {
      const products = await getPremiumBoxProducts();
      reply.send({
        success: true,
        products
      });
    } catch (error) {
      console.error('Error getting premium box products:', error);
      reply.status(500).send({ error: error.message });
    }
  });
}

export default subscriptionRoutes;