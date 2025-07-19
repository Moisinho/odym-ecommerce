import { createProduct, deleteProduct, getProducts, updateProduct } from '../../services/product.service.js';
import { uploadImage } from '../../services/imgbb.service.js';

async function productRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    console.log('GET /api/products called');
    const products = await getProducts();
    reply.send(products);
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
    console.log('DELETE /api/products/:id called with id:', request.params.id);
    try {
      const deleted = await deleteProduct(request.params.id);
      if (!deleted) {
        reply.status(404).send({ error: 'Product not found' });
        return;
      }
      reply.status(200).send({ message: 'Product deleted successfully' });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });
}

export default productRoutes;
