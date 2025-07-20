export default async (fastify) => {
  // Crear sesión de checkout
  fastify.post('/create-checkout', async (req, reply) => {
    const { items, customerEmail } = req.body; // [{ productId, quantity }]

    // 1. Verificar productos
    const products = await fastify.db.Product.find({
      _id: { $in: items.map(i => i.productId) }
    });

    // 2. Crear línea de items para Stripe
    const line_items = products.map(p => ({
      price: p.stripePriceId,
      quantity: items.find(i => i.productId === p._id.toString()).quantity
    }));

    // 3. Crear sesión en Stripe
    const session = await fastify.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success.html`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
      customer_email: customerEmail,
      metadata: { 
        cart: JSON.stringify(items) 
      }
    });

    return { url: session.url };
  });
};