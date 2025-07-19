import { createCategory, getCategories, updateCategory, deleteCategory } from '../../services/category.service.js';

async function categoryRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    console.log('GET /api/categories called');
    const categories = await getCategories();
    reply.send(categories);
  });

  fastify.post('/', async (request, reply) => {
    console.log('POST /api/categories called with body:', request.body);
    try {
      const category = await createCategory(request.body);
      reply.status(201).send(category);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      const updatedCategory = await updateCategory(request.params.id, request.body);
      if (!updatedCategory) {
        return reply.status(404).send({ error: 'Category not found' });
      }
      reply.send(updatedCategory);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/:id', async function (request, reply) {
    console.log('DELETE /api/categories/:id called with id:', request.params.id);
    try {
      const deleted = await deleteCategory(request.params.id);
      if (!deleted) {
        reply.status(404).send({ error: 'Category not found' });
        return;
      }
      reply.status(200).send({ message: 'Category deleted successfully' });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });
}

export default categoryRoutes;
