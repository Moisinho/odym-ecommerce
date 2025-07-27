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
      const existing = await Subscription.findOne({ subscriptionType: subData.subscriptionType });
      if (!existing) {
        await createSubscription(subData);
        console.log(`✅ Suscripción creada: ${subData.subscriptionType}`);
      }
    }
  } catch (error) {
    console.error('Error inicializando suscripciones por defecto:', error);
  }
};