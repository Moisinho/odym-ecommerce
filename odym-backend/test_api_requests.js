import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testCategoryEndpoints() {
  try {
    // Test POST /categories
    const newCategory = { name: 'Test Category', description: 'Category for testing' };
    const postResponse = await axios.post(`${BASE_URL}/categories`, newCategory);
    console.log('POST /categories response:', postResponse.data);

    // Test GET /categories
    const getResponse = await axios.get(`${BASE_URL}/categories`);
    console.log('GET /categories response:', getResponse.data);

    return postResponse.data._id; // Return created category ID for product test
  } catch (error) {
    console.error('Error testing category endpoints:', error.response ? error.response.data : error.message);
  }
}

async function testProductEndpoints(categoryId) {
  try {
    // Test POST /products
    const newProduct = {
      name: 'Test Product',
      description: 'Product for testing',
      price: 10.99,
      categoryId: categoryId
    };
    const postResponse = await axios.post(`${BASE_URL}/products`, newProduct);
    console.log('POST /products response:', postResponse.data);

    // Test GET /products
    const getResponse = await axios.get(`${BASE_URL}/products`);
    console.log('GET /products response:', getResponse.data);
  } catch (error) {
    console.error('Error testing product endpoints:', error.response ? error.response.data : error.message);
  }
}

async function runTests() {
  const categoryId = await testCategoryEndpoints();
  if (categoryId) {
    await testProductEndpoints(categoryId);
  } else {
    console.error('Skipping product tests due to category creation failure.');
  }
}

runTests();
