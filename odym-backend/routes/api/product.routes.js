import { 
  createProduct, 
  deleteProduct, 
  getProducts, 
  getProductById,
  updateProduct, 
  updateProductStock, 
  checkStockAvailability,
  getProductsWithStock 
} from '../../services/product.service.js';
import { uploadImage } from '../../services/imgbb.service.js';

async function productRoutes(fastify, options) {
  // Obtener todos los productos
  fastify.get('/', async (request, reply) => {
    console.log('GET /api/products called');
    const products = await getProducts();
    reply.send(products);
  });

  // Obtener productos con stock disponible
  fastify.get('/available', async (request, reply) => {
    console.log('GET /api/products/available called');
    const products = await getProductsWithStock();
    reply.send(products);
  });

  // Obtener producto por ID (MOVIDO AQUÍ PARA EVITAR CONFLICTOS)
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    console.log('GET /api/products/:id called with id:', id);
    
    // Validate ObjectId format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', id);
      reply.status(400).send({ 
        error: 'Invalid product ID format',
        details: 'Product ID must be a valid 24-character hexadecimal string'
      });
      return;
    }
    
    try {
      const product = await getProductById(id);
      console.log('Product found:', product.name);
      reply.send(product);
    } catch (error) {
      console.error('Error getting product:', error);
      if (error.message.includes('Product not found')) {
        reply.status(404).send({ error: 'Product not found' });
      } else {
        reply.status(500).send({ error: error.message });
      }
    }
  });

  // Verificar disponibilidad de stock
  fastify.get('/:id/check-stock', async (request, reply) => {
    const { id } = request.params;
    const { quantity } = request.query;
    
    try {
      const result = await checkStockAvailability(id, parseInt(quantity) || 1);
      reply.send(result);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Actualizar stock de producto
  fastify.put('/:id/stock', async (request, reply) => {
    const { id } = request.params;
    const { quantity } = request.body;
    
    try {
      const product = await updateProductStock(id, quantity);
      reply.send(product);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.post('/', async (request, reply) => {
    console.log('POST /api/products called with body:', request.body);
    try {
      // Process images: upload base64 images to imgBB, keep existing URLs as is
      if (request.body.images && Array.isArray(request.body.images)) {
        const processedUrls = [];
        for (const image of request.body.images) {
          if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
            // Existing URL, keep as is
            processedUrls.push(image);
          } else {
            // Assume base64 image, upload to imgBB
            const url = await uploadImage(image);
            processedUrls.push(url);
          }
        }
        request.body.images = processedUrls;
      }
      const product = await createProduct(request.body);
      reply.status(201).send(product);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      // Upload images to imgBB and replace with URLs before saving
      if (request.body.images && Array.isArray(request.body.images)) {
        const uploadedUrls = [];
        for (const base64Image of request.body.images) {
          const url = await uploadImage(base64Image);
          uploadedUrls.push(url);
        }
        request.body.images = uploadedUrls;
      }
      const updatedProduct = await updateProduct(request.params.id, request.body);
      if (!updatedProduct) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      reply.send(updatedProduct);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/:id', async function (request, reply) {
    const productId = request.params.id;
    console.log('DELETE /api/products/:id called with id:', productId);
    
    // Validate ObjectId format
    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid ObjectId format:', productId);
      reply.status(400).send({ 
        error: 'Invalid product ID format',
        details: 'Product ID must be a valid 24-character hexadecimal string'
      });
      return;
    }
    
    try {
      const deleted = await deleteProduct(productId);
      if (!deleted) {
        console.log('Product not found:', productId);
        reply.status(404).send({ error: 'Product not found' });
        return;
      }
      
      console.log('Product deleted successfully:', productId);
      reply.status(200).send({ 
        success: true,
        message: 'Product deleted successfully',
        deletedId: productId 
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      reply.status(500).send({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });

}

export default productRoutes;
