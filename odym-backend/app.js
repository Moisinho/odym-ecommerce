import { config } from 'dotenv';
import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from './config/db.js';
import categoryRoutes from './routes/api/category.routes.js';
import checkoutRoutes from './routes/api/checkout.js';
import customerRoutes from './routes/api/customer.routes.js';
import userRoutes from './routes/api/user.routes.js';

import analyticsRoutes from './routes/api/analytics.routes.js';
import cartRoutes from './routes/api/cart.routes.js';
import deliveryRoutes from './routes/api/delivery.routes.js';
import orderRoutes from './routes/api/order.routes.js';
import paymentRoutes from './routes/api/payment.routes.js';
import productRoutes from './routes/api/product.routes.js';
import productsByIdsRoutes from './routes/api/products-by-ids.js';

// New CRUD routes
import adminRoutes from './routes/api/admin.routes.js';
import billRoutes from './routes/api/bill.routes.js';
import distributorRoutes from './routes/api/distributor.routes.js';
import subscriptionRoutes from './routes/api/subscription.routes.js';
import { initializeDefaultSubscriptions } from './services/subscription.service.js';

import cors from '@fastify/cors';

// Import models for database decoration
import Category from './models/Category.js';
import Order from './models/Order.js';
import Payment from './models/Payment.js';
import Product from './models/Product.js';
import User from './models/User.js';
import Admin from './models/Admin.js';
import Bill from './models/Bill.js';
import Distributor from './models/Distributor.js';
import Subscription from './models/Subscription.js';

config(); // Load environment variables from .env file

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017/odym?authSource=admin';

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
  Payment,
  Category,
  Admin,
  Bill,
  Distributor,
  Subscription
});

// Register API routes
app.register(productRoutes, { prefix: '/api/products' });
app.register(categoryRoutes, { prefix: '/api/categories' });
app.register(cartRoutes, { prefix: '/api/cart' });
app.register(customerRoutes, { prefix: '/api/customers' });
app.register(userRoutes, { prefix: '/api/users' });
app.register(orderRoutes, { prefix: '/api/orders' });
app.register(checkoutRoutes, { prefix: '/api/checkout' });
app.register(paymentRoutes, { prefix: '/api/payment' });
app.register(productsByIdsRoutes, { prefix: '/api/products-by-ids' });
app.register(analyticsRoutes, { prefix: '/api/analytics' });

// Register new CRUD routes
app.register(adminRoutes, { prefix: '/api/admins' });
app.register(billRoutes, { prefix: '/api/bills' });
app.register(distributorRoutes, { prefix: '/api/distributors' });
app.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
app.register(deliveryRoutes, { prefix: '/api/delivery' });

// Serve static files (frontend assets)
app.register(import('@fastify/static'), {
    root: path.join(__dirname, '../odym-frontend'),
    prefix: '/static/',
});




app.setNotFoundHandler((request, reply) => {
    reply.sendFile('index.html');
});

const start = async () => {
    try {
        await connect(MONGO_URI);
        
        // Inicializar suscripciones por defecto
        await initializeDefaultSubscriptions();
        
        await app.listen({ port: PORT });
        app.log.info(`Server is running on port ${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
