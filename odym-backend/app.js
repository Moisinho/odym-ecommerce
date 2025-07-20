import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { connect } from './config/db.js';
import authRoutes from './routes/api/auth.routes.js';
import categoryRoutes from './routes/api/category.routes.js';
import checkoutRoutes from './routes/api/checkout.js';
import paymentRoutes from './routes/api/payment.routes.js';
import productRoutes from './routes/api/product.routes.js';
import checkoutWebRoutes from './routes/web/checkout.routes.js';
import homeRoutes from './routes/web/home.routes.js';
import customerRoutes from './routes/api/customer.routes.js';

import cors from '@fastify/cors';

config(); // Load environment variables from .env file

const PORT = process.env.PORT;
const MONGO_URI = 'mongodb://root:example@localhost:27017/';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import stripe from './services/stripe.service.js';

const app = Fastify({ logger: true });

// Register CORS plugin with proper configuration
app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
});

// Register content type parser for JSON
app.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body);
    done(null, json);
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

// Decorate Fastify instance with Stripe
app.decorate('stripe', stripe);

// Register API routes
app.register(customerRoutes, { prefix: '/api/customers' });
app.register(productRoutes, { prefix: '/api/products' });
app.register(categoryRoutes, { prefix: '/api/categories' });

// Serve static files (frontend assets)
app.register(import('@fastify/static'), {
    root: path.join(__dirname, '../odym-frontend'),
    prefix: '/static/',
});

// Register web routes
app.register(homeRoutes, { prefix: '/' });
app.register(checkoutWebRoutes, { prefix: '/checkout' });

app.setNotFoundHandler((request, reply) => {
    console.log(`NotFoundHandler called for ${request.method} ${request.url}`);
    reply.sendFile('index.html');
});

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
