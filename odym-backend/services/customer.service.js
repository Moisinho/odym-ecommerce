import Customer from '../models/Customer.js';
import crypto from 'crypto';

// Función para hashear contraseñas
const hashPassword = (password) => {
  // Usar el mismo salt que en el frontend
  const hash = crypto.createHash('sha256');
  hash.update(password + "ODYM_SALT_2024");
  return hash.digest('hex');
};

export async function getCustomers(request, reply) {
  const customers = await Customer.find();
  return reply.status(200).send({ customers });
}

export async function checkUsername(request, reply) {
  const { username } = request.params;
  const existingUser = await Customer.findOne({ username });
  return reply.status(200).send({ exists: !!existingUser });
}

export async function checkEmail(request, reply) {
  const { email } = request.params;
  const existingUser = await Customer.findOne({ email });
  return reply.status(200).send({ exists: !!existingUser });
}

export async function loginCustomer(request, reply) {
  const { identifier, password } = request.body;

  // Buscar por email o username
  const customer = await Customer.findOne({
    $or: [
      { email: identifier },
      { username: identifier }
    ]
  });

  if (!customer) {
    return reply.status(404).send({ error: 'Usuario no encontrado' });
  }

  // Hashear la contraseña proporcionada y comparar
  const hashedPassword = hashPassword(password);
  if (customer.password !== hashedPassword) {
    return reply.status(401).send({ error: 'Contraseña incorrecta' });
  }

  return {
    mensaje: 'Login exitoso',
    customer: {
      id: customer._id,
      fullName: customer.fullName,
      username: customer.username,
      email: customer.email,
      subscription: customer.subscription,
      role: customer.role
    }
  };
}

export async function registerCustomer(request, reply) {
  try {
    const { fullName, username, email, password, subscription, phone, address, role } = request.body;

    // Verificar duplicados antes de crear
    const existingUsername = await Customer.findOne({ username });
    if (existingUsername) {
      return reply.status(400).send({ error: 'El nombre de usuario ya está en uso' });
    }

    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return reply.status(400).send({ error: 'El correo electrónico ya está registrado' });
    }

    // Hashear la contraseña antes de guardar
    const hashedPassword = hashPassword(password);

    const customer = await Customer.create({ 
      fullName, 
      username, 
      email, 
      password: hashedPassword,
      subscription: subscription || 'ODYM User',
      phone, 
      address,
      role: role || 'user'
    });

    return reply.status(201).send({ 
      mensaje: 'Cliente registrado exitosamente', 
      customer: {
        id: customer._id.toString(),
        fullName: customer.fullName,
        username: customer.username,
        email: customer.email,
        subscription: customer.subscription,
        role: customer.role
      } 
    });
  } catch (error) {
    console.error('Error completo:', error);
    if (error.code === 11000) {
      return reply.status(400).send({ error: 'El usuario o correo ya existe' });
    }
    return reply.status(500).send({ 
      error: 'Error interno del servidor al registrar usuario',
      details: error.message
    });
  }
}

export async function updateCustomer(request, reply) {
  const { id } = request.params;
  const { fullName, username, email, password, subscription, phone, address, role } = request.body;

  const customer = await Customer.findByIdAndUpdate(
    id, 
    { fullName, username, email, password, subscription, phone, address, role }, 
    { new: true }
  );

  return reply.status(200).send({ mensaje: 'Cliente actualizado exitosamente', customer });
}

export async function deleteCustomer(request, reply) {
  const { id } = request.params;
  await Customer.findByIdAndDelete(id);
  return reply.status(200).send({ mensaje: 'Cliente eliminado exitosamente' });
}

// Función para verificar si un usuario es admin
export async function isAdmin(customerId) {
  try {
    const customer = await Customer.findById(customerId);
    return customer && customer.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Middleware para verificar autenticación de admin
export async function verifyAdmin(request, reply) {
  const { customerId } = request.body;
  
  if (!customerId) {
    return reply.status(401).send({ error: 'ID de usuario requerido' });
  }
  
  const adminStatus = await isAdmin(customerId);
  if (!adminStatus) {
    return reply.status(403).send({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  
  return true;
}
