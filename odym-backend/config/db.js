import mongoose from 'mongoose';

export const connect = async (uri) => {
  await mongoose.connect(uri);
  console.log('✅ Conectado a MongoDB');
};