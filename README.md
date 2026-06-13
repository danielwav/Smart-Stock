# SmartStock 

Aplicación web de comercio electrónico para bodegas de barrio (Tambo+) con recojo en tienda, autenticación con Google, recuperación de contraseña y edición de avatar.

## Stack

- **Framework**: Next.js 16.2.9 (App Router + Turbopack)
- **Lenguaje**: TypeScript
- **Base de datos**: MySQL vía Prisma 7.8.0
- **Estilos**: Tailwind CSS v4 + Lucide icons
- **Email**: Resend
- **Mapa**: Leaflet + OpenStreetMap + Overpass API (Tambo reales)

## Requisitos

- Node.js 20+
- MySQL 8+ corriendo localmente o en Railway
- npm

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/danielwav/Smart-Stock.git
cd Smart-Stock

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (ver sección variables)

# 4. Sincronizar esquema de BD
npx prisma db push

# 5. (Opcional) Poblar BD con datos de demo
node prisma/seed.js

# 6. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión MySQL (`mysql://user:pass@host:3306/db`) |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth |
| `NEXT_PUBLIC_BASE_URL` | URL base de la app (`http://localhost:3000` en local) |
| `RESEND_API_KEY` | API key de Resend para envío de correos |
| `RESEND_FROM_EMAIL` | Remitente de correos (`onboarding@resend.dev` por defecto) |

### Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crear proyecto → "Credentials" → "OAuth 2.0 Client ID" (tipo **Web application**)
3. **Authorized redirect URIs**: `http://localhost:3000/api/auth/google/callback`
4. **Authorized JavaScript origins**: `http://localhost:3000`
5. Copiar Client ID y Client Secret al `.env`

### Resend (recuperación de contraseña)

1. Registrarse en [resend.com](https://resend.com)
2. Ir a "API Keys" y crear una nueva
3. Copiar la API key al `.env` como `RESEND_API_KEY`
4. El remitente `onboarding@resend.dev` funciona sin verificar dominio

## Despliegue en Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

### Pasos

1. Conectar el repositorio de GitHub
2. Agregar **MySQL** como add-on (Railway provee la URL automáticamente)
3. Configurar las variables de entorno en Railway Dashboard:

   | Variable | Cómo obtenerla |
   |---|---|
   | `DATABASE_URL` | La genera Railway automáticamente al agregar MySQL |
   | `GOOGLE_CLIENT_ID` | Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
   | `NEXT_PUBLIC_BASE_URL` | `https://{tu-app}.railway.app` |
   | `RESEND_API_KEY` | Resend Dashboard |

4. Agregar Redirect URI en Google Cloud:
   - `https://{tu-app}.railway.app/api/auth/google/callback`
5. Railway ejecuta automáticamente:
   - `npx prisma generate` (postinstall)
   - `npm run build`
   - `npx prisma db push && next start` (start)

### Datos de demo

Para poblar la BD con productos y un usuario de prueba:

```bash
railway run node prisma/seed.js
```

Usuario demo: `alex.rivera@example.com` / `demo123`

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Landing page |
| `/login` | Login / Registro con Google OAuth |
| `/store` | Tienda con categorías (Bebidas, Promos, Combos) |
| `/cart` | Carrito de compras y pago |
| `/location` | Selección de ubicación y Tambos cercanos |
| `/profile` | Perfil y Mis Pedidos |
| `/forgot-password` | Recuperación de contraseña |
| `/reset-password` | Restablecer contraseña |

## Funcionalidades

- **Google OAuth real**: Inicio de sesión con cuenta de Google
- **Recuperación de contraseña**: Envío de correo vía Resend
- **Tambos dinámicos**: Búsqueda de tiendas reales vía Overpass API según la zona del mapa
- **Avatar personalizado**: Editor con recorte, rotación y volteo (estilo Discord)
- **Recojo en tienda**: Estados Pendiente → Preparando → Listo → Recogido
- **Historial de pedidos**: Seguimiento desde el perfil del usuario
- **Stock en tiempo real**: Productos con stock limitado y badge "Últimas existencias"
