export default async (fastify) => {
  // Example auth route
  fastify.get('/status', async () => {
    return { status: 'Auth API is working' };
  });
};
