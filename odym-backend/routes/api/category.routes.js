import { createCategory, getCategories, updateCategory, deleteCategory } from '../../services/category.service.js';

async function categoryRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    const categories = await getCategories();
    reply.send(categories);
  });

  fastify.post('/', async (request, reply) => {
    try {
      const category = await createCategory(request.body);
      reply.status(201).send(category);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      const categoryId = request.params.id;
      const data = request.body;

      if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
        return reply.status(400).send({ error: 'Invalid category ID format' });
      }

      const updatedCategory = await updateCategory(categoryId, data);

      if (!updatedCategory) {
        return reply.status(404).send({ error: 'Category not found' });
      }

      reply.send(updatedCategory);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/:id', async function (request, reply) {
    const categoryId = request.params.id;
    
    // Validate ObjectId format
    if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      reply.status(400).send({ 
        error: 'Invalid category ID format',
        details: 'Category ID must be a valid 24-character hexadecimal string'
      });
      return;
    }
    
    try {
      const deleted = await deleteCategory(categoryId);
      if (!deleted) {
        reply.status(404).send({ error: 'Category not found' });
        return;
      }
      
      reply.status(200).send({ 
        success: true,
        message: 'Category deleted successfully',
        deletedId: categoryId 
      });
    } catch (error) {
      reply.status(500).send({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
}

export default categoryRoutes;
