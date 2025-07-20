// products-api.js
async function loadProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products')

    const products = await response.json();
    return products;
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

export default loadProducts;