import { loadHeaderFooter, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadHeaderFooter();
  
  // Login Form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) throw new Error('Credenciales incorrectas');
        
        const { token, user } = await response.json();
        
        // Guardar en localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        showToast(`Bienvenido, ${user.name}`);
        window.location.href = '/';
      } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Error al iniciar sesión', 'error');
      }
    });
  }
  
  // Register Form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const firstName = document.getElementById('first-name').value;
      const lastName = document.getElementById('last-name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      if (password !== confirmPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: `${firstName} ${lastName}`,
            email, 
            password 
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error en registro');
        }
        
        const { token, user } = await response.json();
        
        // Guardar en localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        showToast(`Cuenta creada exitosamente. Bienvenido, ${user.name}`);
        window.location.href = '/';
      } catch (error) {
        console.error('Register error:', error);
        showToast(error.message || 'Error al registrarse', 'error');
      }
    });
  }
});