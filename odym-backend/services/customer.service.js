import User from '../models/User.js';

// Get all customers
export const getCustomers = async (request, reply) => {
  try {
    console.log('🔄 Obteniendo usuarios de la colección users...');
    const customers = await User.find().select('-password');
    console.log(`📊 Total usuarios encontrados: ${customers.length}`);
    console.log('👥 Usuarios por rol:', customers.map(c => `${c.name} (${c.role})`));
    
    // Return in the format expected by frontend
    reply.send({ customers });
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    reply.status(500).send({ error: 'Error fetching customers', details: error.message });
  }
};

// Login customer
export const loginCustomer = async (request, reply) => {
  try {
    const { identifier, password } = request.body;
    
    // Find customer by email or username
    const customer = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });
    
    if (!customer) {
      return reply.status(401).send({ error: 'Credenciales inválidas' });
    }
    
    // Check password using the User model's comparePassword method
    const isPasswordValid = await customer.comparePassword(password);
    if (!isPasswordValid) {
      return reply.status(401).send({ error: "Credenciales inválidas" });
    }
    
    // Remove password from response and ensure phone/address fields exist
    const customerResponse = customer.toObject();
    delete customerResponse.password;
    
    // Ensure phone and address fields exist (for backward compatibility)
    if (!customerResponse.phone) {
      customerResponse.phone = '';
    }
    if (!customerResponse.address) {
      customerResponse.address = '';
    }
    
    reply.send({ 
      success: true, 
      customer: customerResponse,
      user: customerResponse,
      message: 'Login successful' 
    });
  } catch (error) {
    reply.status(500).send({ error: 'Error during login', details: error.message });
  }
};

// Register customer
export const registerCustomer = async (request, reply) => {
  try {
    const { fullName, name, username, email, password, phone, address, subscription = '', role = 'user', bypassRestrictions = false } = request.body;
    
    // Use fullName as name if name is not provided (for compatibility)
    const userName = name || fullName;
    const userUsername = username || userName;
    
    // Security measure: Force role to 'user' for public registration (unless bypassed)
    const userRole = (!bypassRestrictions && (role === 'admin' || role === 'delivery')) ? 'user' : role;
    
    // Check if customer already exists
    const existingCustomer = await User.findOne({
      $or: [{ email }, { username: userUsername }]
    });
    
    if (existingCustomer) {
      return reply.status(400).send({ error: 'Customer already exists' });
    }
    
    // Create customer (User model handles password hashing automatically)
    const customer = new User({
      name: userName,
      username: userUsername,
      email,
      password,
      phone: phone || '',
      address: address || '',
      subscription: subscription || (userRole === 'user' ? 'ODYM User' : ''),
      role: userRole
    });
    
    await customer.save();
    
    // Remove password from response
    const customerResponse = customer.toObject();
    delete customerResponse.password;
    
    reply.status(201).send({ 
      success: true, 
      customer: customerResponse,
      user: customerResponse,
      message: 'Customer registered successfully' 
    });
  } catch (error) {
    reply.status(500).send({ error: 'Error registering customer', details: error.message });
  }
};

// Update customer
export const updateCustomer = async (request, reply) => {
  try {
    const { id } = request.params;
    const { fullName, username, email, password, subscription, phone, address, role, bypassRestrictions = false } = request.body;

    // Verificar duplicados antes de actualizar (excluyendo el usuario actual)
    if (username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: id } });
      if (existingUsername) {
        return reply.status(400).send({ error: 'El nombre de usuario ya está en uso' });
      }
    }

    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return reply.status(400).send({ error: 'El correo electrónico ya está registrado' });
      }
    }

    // Preparar datos de actualización
    // Force role to 'user' for public updates (unless bypassed)
    const userRole = (!bypassRestrictions && (role === 'admin' || role === 'delivery')) ? 'user' : (role || 'user');
    
    const updateData = {
      name: fullName,
      username: username || fullName,
      email,
      subscription: subscription || 'ODYM User',
      phone,
      address,
      role: userRole
    };

    // Solo hashear y actualizar contraseña si se proporciona una nueva
    if (password && password.trim() !== '') {
      updateData.password = password; // User model will hash automatically
    }

    const customer = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true }
    ).select('-password');

    if (!customer) {
      return reply.status(404).send({ error: 'Cliente no encontrado' });
    }

    return reply.status(200).send({ 
      mensaje: 'Cliente actualizado exitosamente', 
      customer: {
        id: customer._id.toString(),
        fullName: customer.name,
        username: customer.name,
        email: customer.email,
        subscription: customer.subscription,
        phone: customer.phone,
        address: customer.address,
        role: customer.role
      }
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    if (error.code === 11000) {
      return reply.status(400).send({ error: 'El usuario o correo ya existe' });
    }
    return reply.status(500).send({ 
      error: 'Error interno del servidor al actualizar usuario',
      details: error.message
    });
  }
};

// Delete customer
export const deleteCustomer = async (request, reply) => {
  try {
    const { id } = request.params;
    
    const customer = await User.findByIdAndDelete(id);
    
    if (!customer) {
      return reply.status(404).send({ error: 'Customer not found' });
    }
    
    reply.send({ 
      success: true, 
      message: 'Customer deleted successfully' 
    });
  } catch (error) {
    reply.status(500).send({ error: 'Error deleting customer', details: error.message });
  }
};

// Check username availability
export const checkUsername = async (request, reply) => {
  try {
    const { username } = request.params;
    const customer = await User.findOne({ username });
    reply.send({ available: !customer });
  } catch (error) {
    reply.status(500).send({ error: 'Error checking username', details: error.message });
  }
};

// Check email availability
export const checkEmail = async (request, reply) => {
  try {
    const { email } = request.params;
    const customer = await User.findOne({ email });
    reply.send({ available: !customer });
  } catch (error) {
    reply.status(500).send({ error: 'Error checking email', details: error.message });
  }
};

// Check if user is admin
export const isAdmin = async (customerId) => {
  try {
    const customer = await User.findById(customerId);
    return customer && customer.role === 'admin';
  } catch (error) {
    return false;
  }
};

// Verify admin (middleware-like function)
export const verifyAdmin = async (request, reply) => {
  try {
    const { id } = request.params;
    const adminStatus = await isAdmin(id);
    
    if (!adminStatus) {
      return reply.status(403).send({ error: 'Access denied. Admin privileges required.' });
    }
    
    reply.send({ isAdmin: true });
  } catch (error) {
    reply.status(500).send({ error: 'Error verifying admin status', details: error.message });
  }
};

// Get customer by ID
export const getCustomerById = async (customerId) => {
  try {
    const customer = await User.findById(customerId).select('-password');
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Ensure phone and address fields exist (for backward compatibility)
    const customerObj = customer.toObject();
    if (!customerObj.phone) {
      customerObj.phone = '';
    }
    if (!customerObj.address) {
      customerObj.address = '';
    }
    
    return customerObj;
  } catch (error) {
    throw new Error('Error fetching customer: ' + error.message);
  }
};

// Update customer profile
export const updateCustomerProfile = async (customerId, updateData) => {
  try {
    const allowedUpdates = ['name', 'email', 'phone', 'address'];
    const updates = {};
    
    // Filter only allowed updates
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Check if email is being updated and if it's already taken
    if (updates.email) {
      const existingCustomer = await User.findOne({ 
        email: updates.email, 
        _id: { $ne: customerId } 
      });
      if (existingCustomer) {
        throw new Error('Email already in use');
      }
    }
    
    const customer = await User.findByIdAndUpdate(
      customerId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    return customer;
  } catch (error) {
    throw new Error('Error updating customer profile: ' + error.message);
  }
};

// Change customer password
export const changeCustomerPassword = async (customerId, currentPassword, newPassword) => {
  try {
    const customer = await User.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    // Verify current password using User model's comparePassword method
    const isCurrentPasswordValid = await customer.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password (User model will hash it automatically)
    customer.password = newPassword;
    await customer.save();
    
    return { message: 'Password updated successfully' };
  } catch (error) {
    throw new Error('Error changing password: ' + error.message);
  }
};

// Get all customers (admin)
export const getAllCustomers = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const customers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    return {
      customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        showingFrom: skip + 1,
        showingTo: Math.min(skip + limit, total)
      }
    };
  } catch (error) {
    throw new Error('Error fetching customers: ' + error.message);
  }
};

// Get delivery personnel
export const getDeliveryPersonnel = async () => {
  try {
    const deliveryPersonnel = await User.find({ role: 'delivery' })
      .select('-password')
      .sort({ name: 1 });
    
    return deliveryPersonnel;
  } catch (error) {
    throw new Error('Error fetching delivery personnel: ' + error.message);
  }
};
