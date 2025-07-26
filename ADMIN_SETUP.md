# Configuración de Usuarios Administradores - ODYM E-commerce

## Resumen de Cambios Implementados

Se ha implementado un sistema completo de autenticación para usuarios administradores que permite diferenciar entre usuarios normales y administradores.

### Cambios en el Backend

#### 1. Modelo de Customer actualizado
- **Archivo**: `odym-backend/models/Customer.js`
- **Cambio**: Se agregó el campo `role` con valores `['user', 'admin']` y valor por defecto `'user'`

#### 2. Servicio de Customer actualizado
- **Archivo**: `odym-backend/services/customer.service.js`
- **Cambios**:
  - Funciones de login y registro ahora incluyen el campo `role`
  - Nueva función `isAdmin(customerId)` para verificar permisos
  - Nueva función `verifyAdmin(customerId)` middleware para autenticación

#### 3. Rutas de Customer actualizadas
- **Archivo**: `odym-backend/routes/customer.routes.js`
- **Nuevas rutas**:
  - `POST /api/customers/register-admin` - Registrar usuario administrador
  - `GET /api/customers/is-admin/:id` - Verificar si un usuario es administrador

### Cambios en el Frontend

#### 1. Panel de Administración actualizado
- **Archivo**: `odym-frontend/admin/scripts.js`
- **Cambios**:
  - Integración con AuthService para autenticación consistente
  - Verificación de rol 'admin' antes de permitir acceso
  - Función de logout actualizada

#### 2. Nueva página de login para administradores
- **Archivo**: `odym-frontend/admin/login.html`
- **Características**:
  - Login específico para administradores
  - Verificación de rol antes de permitir acceso
  - Redirección automática al panel de administración

#### 3. AuthService actualizado
- **Archivo**: `odym-frontend/assets/js/auth-service.js`
- **Funcionalidad**: Ya maneja correctamente el almacenamiento del campo `role`

## Cómo Crear un Usuario Administrador

### Opción 1: Usando la API directamente

```bash
curl -X POST http://localhost:3000/api/customers/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "username": "admin",
    "email": "admin@odym.com",
    "password": "admin123",
    "phone": "+1234567890",
    "address": "Admin Office",
    "subscription": "ODYM Admin"
  }'
```

### Opción 2: Modificar un usuario existente en la base de datos

1. Conectarse a MongoDB
2. Ejecutar el siguiente comando:

```javascript
db.customers.updateOne(
  { email: "usuario@ejemplo.com" },
  { $set: { role: "admin" } }
)
```

### Opción 3: Crear directamente en la base de datos

```javascript
db.customers.insertOne({
  fullName: "Admin User",
  username: "admin",
  email: "admin@odym.com",
  password: "[hash_de_contraseña]",
  phone: "+1234567890",
  address: "Admin Office",
  subscription: "ODYM Admin",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Cómo Acceder al Panel de Administración

1. **URL de acceso**: `http://localhost:5500/odym-frontend/admin/login.html`
2. **Credenciales**: Usar las credenciales de un usuario con rol 'admin'
3. **Redirección automática**: Después del login exitoso, será redirigido al panel de administración

## Funcionalidades del Sistema de Autenticación

### Para Usuarios Normales
- Registro automático con rol 'user'
- Acceso a funcionalidades de compra y cuenta
- Sin acceso al panel de administración

### Para Usuarios Administradores
- Acceso completo al panel de administración
- Gestión de productos, categorías, órdenes y usuarios
- Login específico con verificación de permisos
- Funcionalidades de usuario normal también disponibles

## Verificación de Funcionamiento

### 1. Verificar que el backend esté ejecutándose
```bash
cd odym-backend
npm start
```

### 2. Verificar que el frontend esté ejecutándose
```bash
cd odym-frontend
# Usar Live Server o servidor web local en puerto 5500
```

### 3. Probar el sistema
1. Crear un usuario administrador usando una de las opciones anteriores
2. Acceder a `http://localhost:5500/odym-frontend/login.html`
3. Iniciar sesión con las credenciales del administrador
4. Verificar acceso al panel de administración

## Notas Importantes

- **Seguridad**: Las contraseñas se hashean usando SHA-256 con salt "ODYM_SALT_2024"
- **Consistencia**: El sistema usa AuthService para mantener consistencia en el manejo de autenticación
- **Roles**: Solo existen dos roles: 'user' (por defecto) y 'admin'
- **Compatibilidad**: Los usuarios existentes automáticamente tienen rol 'user'

## Solución de Problemas

### Error: "Acceso denegado. Se requieren permisos de administrador."
- Verificar que el usuario tenga rol 'admin' en la base de datos
- Verificar que el backend esté respondiendo correctamente

### Error: No se puede acceder al panel de administración
- Verificar que AuthService esté cargado correctamente
- Verificar que el usuario esté autenticado
- Limpiar localStorage y volver a iniciar sesión

### Error: "Error al verificar autenticación"
- Verificar que el backend esté ejecutándose en puerto 3000
- Verificar que las rutas de la API estén funcionando correctamente