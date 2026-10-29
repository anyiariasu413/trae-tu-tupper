# Trae tu Tupper · UDB

Plataforma web para incentivar el uso de recipientes reutilizables en las cafeterías (chalets) de la Universidad Don Bosco, campus Soyapango. Cada vez que alguien compra con su propio tupper, la cafetería aplica un descuento y el sistema registra el envase de poliestireno evitado.

Proyecto académico de la materia Gestión Ambiental, 2026.

## Qué incluye

| Rol | Funciones |
|---|---|
| Público (sin sesión) | Contador de impacto acumulado, explicación del sistema, datos de concientización con fuentes y guía de evaluación con cuentas de prueba |
| Cliente | Registro con carné y correo institucional, carné virtual con QR (imprimible), impacto personal, logros por usos (27 y 37 usos según la literatura), historial |
| Empleado | Registro por QR (cámara) o carné escrito, cálculo del descuento según las reglas de su cafetería, contador de ventas sin tupper, registros del día con opción de anular |
| Dueña | Configuración del descuento (porcentaje o monto fijo, compra mínima, tope diario, pausar), panel de métricas de su cafetería, gestión de empleados |
| Administración | Panel consolidado de las 3 cafeterías, tasa de adopción, comparativa, simulador de proyección de impacto y balance económico, gestión de cafeterías y usuarios, restauración de datos de demostración |

## Cuentas de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
| Administración | admin@udb.edu.sv | Admin2026! |
| Dueña (Chalet Central) | duena.central@udb.edu.sv | Duena2026! |
| Empleado (Chalet Central) | empleado.central@udb.edu.sv | Empleado2026! |
| Cliente | HM250117 o hm250117@alumno.udb.edu.sv | Cliente2026! |

También existen `duena.ingenieria@`, `duena.ciencias@`, `empleado.ingenieria@`, `empleado.ciencias@` y `empleado2.central@` (mismas contraseñas por rol) y unos 600 clientes simulados con la contraseña `Cliente2026!`.

## Tecnologías

- **Frontend:** React + Vite, React Router, Recharts (gráficas), html5-qrcode (lector QR), qrcode.react (carné virtual), CSS propio.
- **Backend:** Node.js + Express.
- **Datos:** archivo JSON (`server/data/db.json`) leído en memoria y escrito al disco de forma atómica.
- **Seguridad:** contraseñas cifradas con bcrypt, sesiones con JWT (12 h), validación de rol en cada petición del servidor, límite de intentos de inicio de sesión.

Los datos de demostración se generan relativos a la fecha actual (8 semanas hasta hoy), así los paneles siempre muestran actividad reciente. Si el archivo `db.json` no existe, el servidor lo crea al arrancar.

## Ejecutar en tu computadora

Requiere Node.js 20 o superior.

```bash
npm install
npm run build      # instala y compila el frontend
npm start          # http://localhost:3001
```

Para desarrollar con recarga automática, en dos terminales:

```bash
npm run dev:server   # API en http://localhost:3001
npm run dev:client   # app en http://localhost:5173
```

`npm run reset` vuelve a generar los datos de demostración.

## Publicar en Render (gratis)

1. Sube esta carpeta a un repositorio nuevo de GitHub (el `.gitignore` ya excluye `node_modules` y los datos).
2. Entra a [render.com](https://render.com) con tu cuenta de GitHub.
3. Elige **New → Blueprint** y selecciona el repositorio. Render lee `render.yaml` y crea el servicio con su `JWT_SECRET`.
4. Espera a que termine el despliegue (3 a 5 minutos) y abre la URL `https://trae-tu-tupper-xxxx.onrender.com`.

Si prefieres no usar Blueprint: **New → Web Service**, con *Build command* `npm install && npm run build`, *Start command* `npm start`, plan *Free*, y agrega la variable de entorno `JWT_SECRET` con cualquier texto largo.

### Mantenerla despierta

El plan gratuito de Render duerme el servicio tras 15 minutos sin visitas y la primera carga tarda cerca de un minuto. Para evitarlo:

1. Crea una cuenta gratuita en [uptimerobot.com](https://uptimerobot.com).
2. **Add New Monitor → HTTP(s)**, URL `https://TU-APP.onrender.com/api/health`, intervalo de 5 minutos.

El disco del plan gratuito no es permanente: si Render reinicia el servicio, los datos vuelven a la semilla de demostración. Para la evaluación no es un problema, y la administración tiene un botón para restaurar los datos cuando se necesite.

### Plan B sin internet externo

Ejecuta `npm start` en tu laptop y conecta los otros dispositivos a la misma red. Abre `http://IP-DE-TU-LAPTOP:3001`. La cámara del celular solo funciona en páginas seguras (HTTPS o localhost), así que en este modo usa “Escribir carné”.

## Supuestos de cálculo

Definidos en `server/config.js`:

- 15.5 g de poliestireno por envase.
- 0.0031 kg CO₂e por gramo de poliestireno.
- Población objetivo: 15,000 personas.
- Umbral ambiental de un reutilizable: 37 usos (Snyder y Park, 2024).
- Punto de compensación de carbono: 27 usos (Huang et al., 2026).

## Fase 2: lector IoT

El lector ESP32 + módulo QR enviaría el carné leído a la misma API que usa la app (`POST /api/registros`). Toda la lógica de descuentos ya vive en el servidor, así que el dispositivo solo necesita una credencial propia y conexión Wi-Fi.

## Estructura

```
server/
  index.js      rutas de la API y servidor del frontend
  auth.js       JWT, roles y límite de intentos
  reglas.js     cálculo y validación de descuentos
  metricas.js   indicadores y agregaciones
  seed.js       generador de datos de demostración
  db.js         persistencia en JSON
  config.js     constantes ambientales y zona horaria
client/src/
  pages/        vistas por rol (empleado, duena, admin, cliente)
  components/   interfaz compartida, gráficas, escáner
```
