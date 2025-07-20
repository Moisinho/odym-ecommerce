import Customer from '../models/Customer.js';

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
  const { email, password } = request.body;

  const customer = await Customer.findOne({ email });

  if (!customer) {
    return reply.status(404).send({ error: 'Cliente no encontrado' });
  }

  // Si aún no usas bcrypt, comparas directamente:
  if (customer.password !== password) {
    return reply.status(401).send({ error: 'Contraseña incorrecta' });
  }

  return {
    mensaje: 'Login exitoso',
    customer: {
      id: customer._id,
      nombre: customer.nombre,
      correo: customer.correo
    }
  };
}

export async function registerCustomer(request, reply) {
  try {
    const { fullName, username, email, password, subscription, phone, address } = request.body;

    // Verificar duplicados antes de crear
    const existingUsername = await Customer.findOne({ username });
    if (existingUsername) {
      return reply.status(400).send({ error: 'El nombre de usuario ya está en uso' });
    }

    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return reply.status(400).send({ error: 'El correo electrónico ya está registrado' });
    }

    const customer = await Customer.create({ 
      fullName, 
      username, 
      email, 
      password, 
      subscription, 
      phone, 
      address 
    });

    return reply.status(201).send({ 
      mensaje: 'Cliente registrado exitosamente', 
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email
      } 
    });
  } catch (error) {
    // Manejar errores de MongoDB
    if (error.code === 11000) {
      return reply.status(400).send({ error: 'El usuario o correo ya existe' });
    }
    throw error;
  }
}

export async function updateCustomer(request, reply) {
  const { id } = request.params;
  const { fullName, username, email, password, subscription, phone, address } = request.body;

  const customer = await Customer.findByIdAndUpdate(
    id, 
    { fullName, username, email, password, subscription, phone, address }, 
    { new: true }
  );

  return reply.status(200).send({ mensaje: 'Cliente actualizado exitosamente', customer });
}

export async function deleteCustomer(request, reply) {
  const { id } = request.params;
  await Customer.findByIdAndDelete(id);
  return reply.status(200).send({ mensaje: 'Cliente eliminado exitosamente' });
}
