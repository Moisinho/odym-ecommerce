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
    const categoryId = request.params.id;
    console.log('DELETE /api/categories/:id called with id:', categoryId);
    
    // Validate ObjectId format
    if (!categoryId || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', categoryId);
      reply.status(400).send({ 
        error: 'Invalid category ID format',
        details: 'Category ID must be a valid 24-character hexadecimal string'
      });
      return;
    }
    
    try {
      const deleted = await deleteCategory(categoryId);
      if (!deleted) {
        console.log('Category not found:', categoryId);
        reply.status(404).send({ error: 'Category not found' });
        return;
      }
      
      console.log('Category deleted successfully:', categoryId);
      reply.status(200).send({ 
        success: true,
        message: 'Category deleted successfully',
        deletedId: categoryId 
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      reply.status(500).send({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
}

export default categoryRoutes;
