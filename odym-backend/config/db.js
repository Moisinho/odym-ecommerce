import mongoose from 'mongoose';

export const connect = async (uri) => {
  try {
    console.log('🔄 Intentando conectar a MongoDB...');
    console.log('📡 URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('✅ Conectado a MongoDB exitosamente');
    
    // Log database name
    console.log('🗄️ Base de datos:', mongoose.connection.db.databaseName);
    
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    throw error;
  }
};