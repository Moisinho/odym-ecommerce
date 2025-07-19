export default async (fastify) => {
  // Example payment API route
  fastify.get('/status', async () => {
    return { status: 'Payment API route is working' };
  });
};
