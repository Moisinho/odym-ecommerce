import Product from '../../models/Product.js';
import mongoose from 'mongoose';

export default async (fastify) => {
    // Obtener productos por IDs
    fastify.post('/by-ids', async (req, reply) => {
        try {
            const { ids } = req.body;
            
            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: 'IDs de productos requeridos'
                });
            }
            
            // Validar que los IDs sean ObjectIds válidos
            const validIds = ids.filter(id => {
                return mongoose.Types.ObjectId.isValid(id);
            });
            
            if (validIds.length === 0) {
                return reply.status(400).send({
                    success: false,
                    error: 'IDs inválidos'
                });
            }
            
            // Buscar productos
            const products = await Product.find({
                _id: { $in: validIds }
            }).populate('category', 'name');
            return reply.send({
                success: true,
                products: products.map(product => ({
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    images: product.images || [],
                    category: product.category,
                    stock: product.stock,
                    description: product.description
                }))
            });
            
        } catch (error) {
            console.error('Error fetching products by IDs:', error);
            reply.status(500).send({
                success: false,
                error: 'Error al obtener productos'
            });
        }
    });
};
