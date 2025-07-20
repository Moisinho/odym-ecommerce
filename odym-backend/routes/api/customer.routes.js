import { getCustomers, loginCustomer, registerCustomer, updateCustomer, deleteCustomer, checkUsername, checkEmail } from '../../services/customer.service.js';

export default async function customerRoutes(fastify, options) {
  fastify.get('/', getCustomers);
  fastify.post('/login', loginCustomer); 
  fastify.post('/register', registerCustomer);
  fastify.put('/:id', updateCustomer);
  fastify.delete('/:id', deleteCustomer);
  fastify.get('/check-username/:username', checkUsername);
  fastify.get('/check-email/:email', checkEmail);
}
