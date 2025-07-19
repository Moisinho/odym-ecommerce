document.getElementById('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const cart = JSON.parse(localStorage.getItem('cart') || []);
  const email = document.getElementById('email').value;

  try {
    // 1. Crear sesión de checkout en backend
    const response = await fetch('/api/checkout/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: cart,
        customerEmail: email 
      })
    });

    const { url } = await response.json();

    // 2. Redirigir a Stripe
    window.location.href = url;
  } catch (error) {
    console.error('Checkout error:', error);
    showToast('Error al procesar el pago', 'error');
  }
});