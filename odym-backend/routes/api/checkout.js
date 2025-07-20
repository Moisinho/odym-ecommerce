async function checkoutRoutes(fastify, options) {
  
  // Crear sesión de checkout con Stripe
  fastify.post('/create-checkout-session', async (request, reply) => {
    try {
      const { items, customerEmail, userId } = request.body; // [{ productId, quantity }]

      if (!items || !Array.isArray(items) || items.length === 0) {
        return reply.status(400).send({ error: 'Items array is required' });
      }

      if (!customerEmail) {
        return reply.status(400).send({ error: 'Customer email is required' });
      }

      // 1. Verificar productos y obtener información
      const productIds = items.map(i => i.productId);
      const products = await fastify.db.Product.find({
        _id: { $in: productIds }
      });

      if (products.length !== items.length) {
        return reply.status(400).send({ error: 'Some products not found' });
      }

      // 2. Verificar stock
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

      // 3. Crear línea de items para Stripe
      const line_items = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (product) {
          // Si el producto tiene stripePriceId, usarlo; si no, crear precio dinámico
          if (product.stripePriceId) {
            line_items.push({
              price: product.stripePriceId,
              quantity: item.quantity
            });
          } else {
            line_items.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: product.name,
                  images: product.images || [],
                  description: product.description || ''
                },
                unit_amount: Math.round(product.price * 100) // Convert to cents
              },
              quantity: item.quantity
            });
          }
          totalAmount += product.price * item.quantity;
        }
      }

      // 4. Crear sesión en Stripe
      const session = await fastify.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel.html`,
        customer_email: customerEmail,
        metadata: { 
          cart: JSON.stringify(items),
          userId: userId || 'guest',
          totalAmount: totalAmount.toString()
        }
      });

      reply.send({ 
        success: true,
        sessionId: session.id,
        url: session.url,
        totalAmount 
      });

    } catch (error) {
      console.error('Checkout error:', error);
      reply.status(500).send({ error: 'Error creating checkout session: ' + error.message });
    }
  });

  // Verificar sesión de checkout
  fastify.get('/session/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params;
      const session = await fastify.stripe.checkout.sessions.retrieve(sessionId);
      
      reply.send({
        success: true,
        session: {
          id: session.id,
          payment_status: session.payment_status,
          customer_email: session.customer_email,
          amount_total: session.amount_total,
          metadata: session.metadata
        }
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Webhook para manejar eventos de Stripe
  fastify.post('/webhook', async (request, reply) => {
    try {
      const sig = request.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        event = fastify.stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
      } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return reply.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Manejar el evento
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          console.log('Payment successful for session:', session.id);
          
          // Aquí puedes actualizar el estado de la orden
          if (session.metadata && session.metadata.cart) {
            const items = JSON.parse(session.metadata.cart);
            const userId = session.metadata.userId;
            
            // Actualizar stock de productos
            for (const item of items) {
              await fastify.db.Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }
              );
            }
            
            console.log('Stock updated for completed purchase');
          }
          break;
          
        case 'payment_intent.payment_failed':
          console.log('Payment failed:', event.data.object);
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      reply.send({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      reply.status(400).send({ error: error.message });
    }
  });
}

export default checkoutRoutes;
