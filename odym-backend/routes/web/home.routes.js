export default async (fastify) => {
  // Example home web route
  fastify.get('/', async () => {
    return { status: 'Home web route is working' };
  });
};
