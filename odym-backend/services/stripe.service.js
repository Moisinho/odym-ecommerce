import Stripe from 'stripe';
import { config } from 'dotenv';

config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

class StripeService {
  constructor(db) {
    this.stripe = stripe;
    this.db = db; // Requiere que le pases fastify.db cuando lo instancias
  }

  async createCheckoutSession({ items, customerEmail, userId, successUrl, cancelUrl }) {
    try {
      // 1. Validaciones básicas
      if (!items || !Array.isArray(items) || items.length === 0) {
        return { success: false, error: 'Items array is required' };
      }

      if (!customerEmail) {
        return { success: false, error: 'Customer email is required' };
      }

      // 2. Buscar productos en DB
      const productIds = items.map(i => i.productId);
      const products = await this.db.Product.find({
        _id: { $in: productIds }
      });

      if (products.length !== items.length) {
        return { success: false, error: 'Some products not found' };
      }

      // 3. Verificar stock
      const stockIssues = [];
      for (const item of items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (product && product.stock < item.quantity) {
          stockIssues.push({
            productId: item.productId,
            productName: product.name,
            requestedQuantity: item.quantity,
            availableStock: product.stock
          });
        }
      }

      if (stockIssues.length > 0) {
        return { success: false, error: 'Insufficient stock', stockIssues };
      }

      // 4. Formatear line_items para Stripe
      const line_items = [];
      let totalAmount = 0;

      for (const item of items) {
        const product = products.find(p => p._id.toString() === item.productId);
        if (product) {
          line_items.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: product.name,
                description: product.description || 'Producto ODYM'
              },
              unit_amount: Math.round(product.price * 100)
            },
            quantity: item.quantity
          });

          totalAmount += product.price * item.quantity;
        }
      }

      // 5. Crear sesión de Stripe
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: successUrl || `${process.env.FRONTEND_URL}/frontend/success-enhanced.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cancel`,
        customer_email: customerEmail,
        metadata: {
          userId: userId || 'guest',
          totalAmount: totalAmount.toString(),
          cart: JSON.stringify(items)
        }
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
        totalAmount
      };
    } catch (error) {
      console.error('Error creating Stripe session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSession(sessionId) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      return {
        success: true,
        session,
      };
    } catch (error) {
      console.error('Error retrieving session:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyPayment(sessionId) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid') {
        return {
          success: true,
          paymentIntent: session.payment_intent,
          customer: session.customer,
          metadata: session.metadata,
        };
      }
      
      return {
        success: false,
        error: 'Payment not completed',
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default StripeService;
