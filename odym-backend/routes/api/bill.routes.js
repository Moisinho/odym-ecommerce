import { createBill, getBills, updateBill, deleteBill } from '../../services/bill.service.js';

async function billRoutes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    const bills = await getBills();
    reply.send(bills);
  });

  fastify.post('/', async (request, reply) => {
    try {
      const bill = await createBill(request.body);
      reply.status(201).send(bill);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      const billId = request.params.id;
      const data = request.body;

      if (!billId || !billId.match(/^[0-9a-fA-F]{24}$/)) {
        return reply.status(400).send({ error: 'Invalid bill ID format' });
      }

      const updatedBill = await updateBill(billId, data);

      if (!updatedBill) {
        return reply.status(404).send({ error: 'Bill not found' });
      }

      reply.send(updatedBill);
    } catch (error) {
      reply.status(400).send({ error: error.message });
    }
  });

  fastify.delete('/:id', async function (request, reply) {
    const billId = request.params.id;
    
    if (!billId || !billId.match(/^[0-9a-fA-F]{24}$/)) {
      reply.status(400).send({ 
        error: 'Invalid bill ID format',
        details: 'Bill ID must be a valid 24-character hexadecimal string'
      });
      return;
    }
    
    try {
      const deleted = await deleteBill(billId);
      if (!deleted) {
        reply.status(404).send({ error: 'Bill not found' });
        return;
      }
      
      reply.status(200).send({ 
        success: true,
        message: 'Bill deleted successfully',
        deletedId: billId 
      });
    } catch (error) {
      reply.status(500).send({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
}

export default billRoutes;