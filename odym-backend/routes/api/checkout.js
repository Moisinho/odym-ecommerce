import Stripe from 'stripe';
import { config } from 'dotenv';

config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

async function checkoutRoutes(fastify, options) {
  // Crear sesión de checkout con Stripe
  fastify.post('/create-checkout-session', async (request, reply) => {
    try {
      const { items, customerEmail, userId } = request.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.status(400).send({ error: 'Items array is required' });
      }

      if (!customerEmail) {
        return reply.status(400).send({ error: 'Customer email is required' });
      }

      // Buscar productos en la base de datos
      const productIds = items.map(i => i.productId);
      const products = await fastify.db.Product.find({
        _id: { $in: productIds }
      });

      if (products.length !== items.length) {
        return reply.status(400).send({ error: 'Some products not found' });
      }

      // Validar stock
      const stockIssues = [];
      for (const item of items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (product && product.stock < item.quantity) {
          stockIssues.push({
            productId: item.productId,
            productName: product.name,
            requestedQuantity: item.quantity,
            availableStock: product.stock
          });
        }
      }

      if (stockIssues.length > 0) {
        return reply.status(400).send({ 
          error: 'Insufficient stock for some items',
          stockIssues 
        });
      }

      // Crear items para Stripe
      const line_items = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (product) {
          const stripeItem = {
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.name,
                description: product.description || 'Producto de ODYM',
              },
              unit_amount: Math.round(product.price * 100),
            },
            quantity: item.quantity,
          };
          line_items.push(stripeItem);
          totalAmount += product.price * item.quantity;
        }
      }

      // Crear sesión en Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5500'}/odym-frontend/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5500'}/odym-frontend/cancel.html`,
        customer_email: customerEmail,
        metadata: { 
          cart: JSON.stringify(items),
          userId: userId || 'guest',
          totalAmount: totalAmount.toString(),
        }
      });

      reply.send({
        success: true,
        sessionId: session.id,
        url: session.url,
        totalAmount,
      });

    } catch (error) {
      console.error('❌ Checkout error:', error);
      reply.status(500).send({
        error: 'Error creating checkout session',
        message: error.message,
      });
    }
  });

  // Obtener detalles de una sesión
  fastify.get('/session/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params;
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      reply.send({
        success: true,
        session: {
          id: session.id,
          payment_status: session.payment_status,
          customer_email: session.customer_email,
          amount_total: session.amount_total,
          metadata: session.metadata,
        }
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Webhook para manejar eventos de Stripe
  fastify.post('/webhook', async (request, reply) => {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return reply.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session, fastify);
        break;
      default:
    }

    reply.send({ received: true });
  });

  // Endpoint para verificar y crear orden desde el frontend
  fastify.post('/verify-session', async (request, reply) => {
    try {
      const { sessionId } = request.body;
      
      if (!sessionId) {
        return reply.status(400).send({ error: 'Session ID is required' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid') {
        // Check if order already exists
        const existingOrder = await fastify.db.Order.findOne({ paymentIntentId: session.payment_intent });
        
        if (existingOrder) {
          return reply.send({ 
            success: true, 
            order: existingOrder,
            alreadyProcessed: true 
          });
        }

        // Create new order
        const order = await handleCheckoutSessionCompleted(session, fastify);
        
        reply.send({ 
          success: true, 
          order,
          alreadyProcessed: false 
        });
      } else {
        reply.status(400).send({ error: 'Payment not completed' });
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      reply.status(500).send({ error: error.message });
    }
  });
}

// Función para manejar la creación de órdenes
async function handleCheckoutSessionCompleted(session, fastify) {
  try {
    const metadata = session.metadata;
    const items = JSON.parse(metadata.cart || '[]');
    const userId = metadata.userId || 'guest';
    const totalAmount = parseFloat(metadata.totalAmount || 0);

    // Get product details
    const productIds = items.map(item => item.productId);
    const products = await fastify.db.Product.find({
      _id: { $in: productIds }
    });

    // Build order items
    const orderItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        productId: item.productId,
        name: product?.name || 'Producto no encontrado',
        price: product?.price || 0,
        quantity: item.quantity,
        image: product?.images?.[0] || ''
      };
    });

    // Always use user data from database for shipping address
    let shippingAddress = {
      firstName: 'Cliente',
      lastName: '',
      email: session.customer_email || '',
      phone: '',
      address: '',
      city: 'Ciudad de Panamá',
      postalCode: '0000',
      country: 'Panama'
    };
    
    if (userId !== 'guest') {
      try {
        const user = await fastify.db.Customer.findById(userId);
        
        if (user) {
          shippingAddress = {
            firstName: user.fullName.split(' ')[0] || user.fullName,
            lastName: user.fullName.split(' ').slice(1).join(' ') || '',
            email: user.email,
            phone: user.phone || 'No disponible',
            address: user.address || 'Dirección no especificada',
            city: 'Ciudad de Panamá',
            postalCode: '0000',
            country: 'Panama'
          };
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    
    const order = new fastify.db.Order({
      userId: userId === 'guest' ? null : userId,
      items: orderItems,
      totalAmount: totalAmount,
      status: 'processing',
      paymentStatus: 'paid',
      paymentIntentId: session.payment_intent,
      shippingAddress: shippingAddress
    });

    await order.save();
    
    // Update product stock
    for (const item of orderItems) {
      await fastify.db.Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }
    return order;

  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
}

export default checkoutRoutes;
