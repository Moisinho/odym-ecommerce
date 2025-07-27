import {
  createOrder,
  createOrderFromItems,
  createPaymentIntent,
  getAllOrders,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  updatePaymentStatus
} from '../../services/order.service.js';

async function orderRoutes(fastify, options) {
  
  // Crear orden desde el carrito
  fastify.post('/create', async (request, reply) => {
    try {
      const { userId, shippingAddress } = request.body;
      
      if (!userId || !shippingAddress) {
        return reply.status(400).send({ 
          error: 'userId and shippingAddress are required' 
        });
      }

      const order = await createOrder(userId, shippingAddress);
      reply.send({ 
        success: true, 
        order,
        message: 'Order created successfully' 
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Obtener orden por ID
  fastify.get('/:orderId', async (request, reply) => {
    try {
      const { orderId } = request.params;
      const order = await getOrderById(orderId);
      reply.send({ success: true, order });
    } catch (error) {
      reply.status(404).send({ error: error.message });
    }
  });

  // Obtener órdenes de un usuario
  fastify.get('/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params;
      const orders = await getUserOrders(userId);
      reply.send({ 
        success: true, 
        orders,
        count: orders.length 
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Actualizar estado de orden
  fastify.patch('/:orderId/status', async (request, reply) => {
    try {
      const { orderId } = request.params;
      const { status } = request.body;
      
      if (!status) {
        return reply.status(400).send({ error: 'Status is required' });
      }

      const order = await updateOrderStatus(orderId, status);
      reply.send({ 
        success: true, 
        order,
        message: 'Order status updated successfully' 
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Actualizar estado de pago
  fastify.patch('/:orderId/payment-status', async (request, reply) => {
    try {
      const { orderId } = request.params;
      const { paymentStatus, paymentIntentId } = request.body;
      
      if (!paymentStatus) {
        return reply.status(400).send({ error: 'Payment status is required' });
      }

      const order = await updatePaymentStatus(orderId, paymentStatus, paymentIntentId);
      reply.send({ 
        success: true, 
        order,
        message: 'Payment status updated successfully' 
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Crear payment intent para una orden
  fastify.post('/:orderId/payment-intent', async (request, reply) => {
    try {
      const { orderId } = request.params;
      const paymentIntent = await createPaymentIntent(orderId);
      reply.send({ 
        success: true, 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Obtener todas las órdenes (admin)
  fastify.get('/', async (request, reply) => {
    try {
      const { page = 1, limit = 10 } = request.query;
      const result = await getAllOrders(parseInt(page), parseInt(limit));
      reply.send({ 
        success: true, 
        ...result 
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Crear orden desde carrito del frontend (localStorage)
  fastify.post('/from-cart', async (request, reply) => {
    try {
      const { items, shippingAddress } = request.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.status(400).send({ error: 'Items array is required' });
      }

      if (!shippingAddress) {
        return reply.status(400).send({ error: 'Shipping address is required' });
      }

      // Usuario quemado para testing (reemplazar con autenticación real más tarde)
      const hardcodedUserId = '507f1f77bcf86cd799439011';
      
      // Crear usuario temporal si no existe
      let user = await fastify.db.User.findById(hardcodedUserId);
      if (!user) {
        user = new fastify.db.User({
          _id: hardcodedUserId,
          name: 'Usuario Temporal',
          email: 'temp@example.com',
          password: 'temppassword',
          cart: []
        });
        await user.save();
      }

      const order = await createOrderFromItems(hardcodedUserId, items, shippingAddress);
      reply.send({ 
        success: true, 
        order,
        message: 'Order created successfully from cart' 
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Crear orden rápida con usuario quemado (para testing)
  fastify.post('/quick-order', async (request, reply) => {
    try {
      const { items, shippingAddress } = request.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.status(400).send({ error: 'Items array is required' });
      }

      if (!shippingAddress) {
        return reply.status(400).send({ error: 'Shipping address is required' });
      }

      // Usuario quemado para testing (reemplazar con autenticación real más tarde)
      const hardcodedUserId = '507f1f77bcf86cd799439011'; // ID de ejemplo
      
      // Crear usuario temporal si no existe
      let user = await fastify.db.User.findById(hardcodedUserId);
      if (!user) {
        user = new fastify.db.User({
          _id: hardcodedUserId,
          name: 'Usuario Temporal',
          email: 'temp@example.com',
          password: 'temppassword',
          cart: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        });
        await user.save();
      } else {
        // Actualizar carrito del usuario
        user.cart = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        await user.save();
      }

      const order = await createOrder(hardcodedUserId, shippingAddress);
      reply.send({ 
        success: true, 
        order,
        message: 'Quick order created successfully' 
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Delete order (admin)
  fastify.delete('/:id', async (request, reply) => {
    const orderId = request.params.id;
    
    // Validate ObjectId format
    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      reply.status(400).send({ 
        error: 'Invalid order ID format',
        details: 'Order ID must be a valid 24-character hexadecimal string'
      });
      return;
    }
    
    try {
      const deleted = await deleteOrder(orderId);
      if (!deleted) {
        reply.status(404).send({ error: 'Order not found' });
        return;
      }
      
      reply.status(200).send({ 
        success: true,
        message: 'Order deleted successfully',
        deletedId: orderId 
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      reply.status(500).send({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
}

export default orderRoutes;
