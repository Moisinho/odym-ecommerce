import Subscription from '../models/Subscription.js';

export const createSubscription = async (subscriptionData) => {
  const subscription = new Subscription(subscriptionData);
  return await subscription.save();
};

export const getSubscriptions = async () => {
  try {
    console.log('🔍 Buscando suscripciones en la base de datos...');
    const subscriptions = await Subscription.find().sort({ createdAt: -1 });
    console.log(`📊 Encontradas ${subscriptions.length} suscripciones`);
    return subscriptions;
  } catch (error) {
    console.error('❌ Error al obtener suscripciones:', error);
    throw error;
  }
};

export const updateSubscription = async (id, subscriptionData) => {
  return await Subscription.findByIdAndUpdate(id, subscriptionData, { new: true });
};

export const deleteSubscription = async (id) => {
  return await Subscription.findByIdAndDelete(id);
};

// Función para inicializar suscripciones por defecto
export const initializeDefaultSubscriptions = async () => {
  try {
    console.log('🔄 Inicializando suscripciones por defecto...');
    
    const defaultSubscriptions = [
      {
        subscriptionType: 'User',
        description: 'Suscripción gratuita para usuarios regulares con acceso básico a la plataforma',
        price: 0,
        duration: 'infinite'
      },
      {
        subscriptionType: 'God',
        description: 'Suscripción premium con 30% de descuento en todos los productos y caja de productos incluida',
        price: 30,
        duration: '1 month'
      }
    ];

    for (const subData of defaultSubscriptions) {
      try {
        const existing = await Subscription.findOne({ subscriptionType: subData.subscriptionType });
        if (!existing) {
          await createSubscription(subData);
          console.log(`✅ Suscripción creada: ${subData.subscriptionType}`);
        } else {
          console.log(`ℹ️ Suscripción ya existe: ${subData.subscriptionType}`);
        }
      } catch (subError) {
        if (subError.code === 11000) {
          console.log(`⚠️ Suscripción ${subData.subscriptionType} ya existe (clave duplicada)`);
        } else {
          console.error(`❌ Error creando suscripción ${subData.subscriptionType}:`, subError.message);
        }
      }
    }
    
    console.log('✅ Inicialización de suscripciones completada');
  } catch (error) {
    console.error('❌ Error inicializando suscripciones por defecto:', error.message);
  }
};

// Función para activar suscripción premium
export const activatePremiumSubscription = async (customerId) => {
  try {
    const Customer = (await import('../models/Customer.js')).default;
    const User = (await import('../models/User.js')).default;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 mes de duración

    const updateFields = {
      subscription: 'God',
      subscriptionStatus: 'active',
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate
    };

    // Actualizar documento en la colección Customer (si existe)
    let updatedDoc = null;
    if (await Customer.exists({ _id: customerId })) {
      updatedDoc = await Customer.findByIdAndUpdate(customerId, updateFields, { new: true });
    }

    // Asegurarse también de actualizar la colección principal User
    if (await User.exists({ _id: customerId })) {
      updatedDoc = await User.findByIdAndUpdate(customerId, updateFields, { new: true });
    }

    console.log(`✅ Suscripción premium activada para usuario: ${customerId}`);
    return updatedDoc;
  } catch (error) {
    console.error('❌ Error activando suscripción premium:', error);
    throw error;
  }
};

// Función para verificar si un usuario tiene suscripción premium activa
export const isPremiumUser = async (customerId) => {

  try {
    const Customer = (await import('../models/Customer.js')).default;
    const mongoose = (await import('mongoose')).default;

    let customer = null;
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      customer = await Customer.findById(customerId);
    }
    // Si no se encontró por ID, intenta buscar por email
    if (!customer) {
      customer = await Customer.findOne({ email: customerId });
    }
    // Si no existe en la colección Customer, intenta buscar en User
    if (!customer) {
      const User = (await import('../models/User.js')).default;
      customer = await User.findById(customerId);
      if (!customer) return false;
    }
    
    const now = new Date();
    // Para compatibilidad con diferentes modelos, realizamos las comprobaciones de forma flexible
    console.log('🧐 Verificando premium para', customer.email || customerId, 'suscripción:', customer.subscription);
    let isPremium = ['God', 'ODYM God'].includes(customer.subscription);

    if (customer.subscriptionStatus) {
      isPremium = isPremium && customer.subscriptionStatus === 'active';
    }

    if (customer.subscriptionEndDate instanceof Date) {
      isPremium = isPremium && customer.subscriptionEndDate > now;
    }

    return isPremium;
  } catch (error) {
    console.error('❌ Error verificando suscripción premium:', error);
    return false;
  }
};

// Función para aplicar descuento premium (30%)
export const applyPremiumDiscount = (price) => {
  return price * 0.7; // 30% de descuento
};

// Función para obtener productos para la caja premium
export const getPremiumBoxProducts = async () => {
  try {
    const Product = (await import('../models/Product.js')).default;
    
    // Necesitamos obtener los _id de las categorías "suplementos" y "accesorios"
    const Category = (await import('../models/Category.js')).default;
    const categories = await Category.find({ name: { $in: [/suplementos/i, /accesorios/i] } }, '_id');
    const categoryIds = categories.map(c => c._id);

    // Obtener 2 productos aleatorios de cada categoría
    const products = [];

    for (const cat of categories) {
      const randomTwo = await Product.aggregate([
        { $match: { category: cat._id, stock: { $gt: 0 } } },
        { $sample: { size: 2 } }
      ]);
      products.push(...randomTwo);
    }

    // Si no obtuvimos 4 productos, rellenar con otros aleatorios con stock > 0
    if (products.length < 4) {
      const needed = 4 - products.length;
      const extra = await Product.aggregate([
        { $match: { stock: { $gt: 0 }, _id: { $nin: products.map(p => p._id) } } },
        { $sample: { size: needed } }
      ]);
      products.push(...extra);
    }

    return products;
  } catch (error) {
    console.error('❌ Error obteniendo productos para caja premium:', error);
    throw error;
  }
};