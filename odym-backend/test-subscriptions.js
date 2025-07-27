import { connect } from './config/db.js';
import { initializeDefaultSubscriptions, getSubscriptions } from './services/subscription.service.js';

const MONGO_URI = 'mongodb://root:example@localhost:27017/odym';

const testSubscriptions = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await connect(MONGO_URI);
    console.log('✅ Conectado a la base de datos');

    console.log('🔄 Inicializando suscripciones por defecto...');
    await initializeDefaultSubscriptions();
    console.log('✅ Suscripciones inicializadas');

    console.log('🔄 Obteniendo suscripciones...');
    const subscriptions = await getSubscriptions();
    console.log('📋 Suscripciones encontradas:', subscriptions.length);
    
    subscriptions.forEach(sub => {
      console.log(`- ${sub.tipo_suscripcion}: $${sub.precio} (${sub.duracion})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testSubscriptions();