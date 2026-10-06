import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    // 1. Inicializar conexión a Base de Datos
    await connectDB();

    // 2. Levantar servidor Express
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 ControlAR Backend v1.0.0 activo`);
      console.log(`📡 Puerto: ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
      console.log(`👤 Desarrollador: Lucas`);
      console.log(`🏪 Negocio: Victoria Productos Artesanales`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

bootstrap();
