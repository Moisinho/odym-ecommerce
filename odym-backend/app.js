import mongoose from 'mongoose';
import Fastify from 'fastify';
import clientesRoutes from './routes/clientes.routes.js';
import { connect } from './db.js';

const PORT = 3000;
const MONGO_URI = 'mongodb://root:example@localhost:27017/';

const app = Fastify({ logger: true });

// Registro de rutas
app.register(clientesRoutes, { prefix: '/api/clientes' });

const start = async () => {
    try {
        await connect(MONGO_URI);
        await app.listen({ port: PORT });
        app.log.info(`Server is running on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
