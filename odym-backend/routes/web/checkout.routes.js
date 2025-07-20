export default async (fastify) => {
  // Example checkout web route
  fastify.get('/checkout/status', async () => {
    return { status: 'Checkout web route is working' };
  });
};
