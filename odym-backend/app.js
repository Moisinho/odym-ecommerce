import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { connect } from './config/db.js';
import categoryRoutes from './routes/api/category.routes.js';
import customerRoutes from './routes/api/customer.routes.js';
import checkoutRoutes from './routes/api/checkout.js';
import paymentRoutes from './routes/api/payment.routes.js';
import productRoutes from './routes/api/product.routes.js';
import cartRoutes from './routes/api/cart.routes.js';
import orderRoutes from './routes/api/order.routes.js';
import productsByIdsRoutes from './routes/api/products-by-ids.js';

import cors from '@fastify/cors';

// Import models for database decoration
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Category from './models/Category.js';

config(); // Load environment variables from .env file

const PORT = process.env.PORT || 3000;
const MONGO_URI = 'mongodb://root:example@localhost:27017/';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import stripe from './services/stripe.service.js';

const app = Fastify({ logger: true });

// Register CORS plugin with comprehensive configuration
app.register(cors, {
  origin: function (origin, callback) {
    // Allow all origins in development
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-HTTP-Method-Override'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
});

// Add global CORS headers middleware
app.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  reply.header('Access-Control-Allow-Credentials', 'true');
});

// Handle OPTIONS requests globally
app.addHook('onRequest', async (request, reply) => {
  if (request.method === 'OPTIONS') {
    reply.code(200).send();
  }
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

// Decorate Fastify instance with Stripe and database models
app.decorate('stripe', stripe);
app.decorate('db', {
  User,
  Product,
  Order,
  Category
});

// Register API routes
app.register(productRoutes, { prefix: '/api/products' });
app.register(categoryRoutes, { prefix: '/api/categories' });
app.register(cartRoutes, { prefix: '/api/cart' });
app.register(customerRoutes, { prefix: '/api/customers' });
app.register(orderRoutes, { prefix: '/api/orders' });
app.register(checkoutRoutes, { prefix: '/api/checkout' });
app.register(paymentRoutes, { prefix: '/api/payment' });
app.register(productsByIdsRoutes, { prefix: '/api/products-by-ids' });

// Serve static files (frontend assets)
app.register(import('@fastify/static'), {
    root: path.join(__dirname, '../odym-frontend'),
    prefix: '/static/',
});




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
