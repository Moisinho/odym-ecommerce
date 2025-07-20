import { getProducts } from '../../services/product.service.js';

async function cartRoutes(fastify, options) {
  // Obtener productos del carrito
  fastify.post('/items', async (request, reply) => {
    try {
      const { items } = request.body;
      if (!items || !Array.isArray(items)) {
        return reply.status(400).send({ error: 'Invalid items format' });
      }

      const products = await getProducts();
      const cartItems = items.map(item => {
        const product = products.find(p => p._id === item.productId);
        if (!product) return null;
        
        return {
          ...product.toObject(),
          quantity: item.quantity,
          subtotal: product.price * item.quantity
        };
      }).filter(Boolean);

      const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

      reply.send({
        items: cartItems,
        total,
        itemCount: cartItems.length
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Verificar disponibilidad de stock para carrito
  fastify.post('/check-stock', async (request, reply) => {
    try {
      const { items } = request.body;
      if (!items || !Array.isArray(items)) {
        return reply.status(400).send({ error: 'Invalid items format' });
      }

      const products = await getProducts();
      const stockIssues = [];

      for (const item of items) {
        const product = products.find(p => p._id === item.productId);
        if (!product) {
          stockIssues.push({ productId: item.productId, error: 'Product not found' });
          continue;
        }

        if (product.stock < item.quantity) {
          stockIssues.push({
            productId: item.productId,
            productName: product.name,
            requestedQuantity: item.quantity,
            availableStock: product.stock,
            error: 'Insufficient stock'
          });
        }
      }

      reply.send({
        valid: stockIssues.length === 0,
        issues: stockIssues
      });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  // Actualizar stock después de compra
  fastify.post('/update-stock', async (request, reply) => {
    try {
      const { items } = request.body;
      if (!items || !Array.isArray(items)) {
        return reply.status(400).send({ error: 'Invalid items format' });
      }

      const products = await getProducts();
      const results = [];

      for (const item of items) {
        const product = products.find(p => p._id === item.productId);
        if (!product) {
          results.push({ productId: item.productId, error: 'Product not found' });
          continue;
        }

        if (product.stock < item.quantity) {
          results.push({
            productId: item.productId,
            error: 'Insufficient stock',
            available: product.stock
          });
          continue;
        }

        // Actualizar stock
        const newStock = product.stock - item.quantity;
        await fastify.db.Product.findByIdAndUpdate(item.productId, { stock: newStock });
        
        results.push({
          productId: item.productId,
          newStock,
          success: true
        });
      }

      reply.send({ results });
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });
}

export default cartRoutes;
