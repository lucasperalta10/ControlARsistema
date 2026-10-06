import { connectDB, query } from '../config/db.js';
import bcrypt from 'bcryptjs';

async function fixHashes() {
  await connectDB();
  const hash = bcrypt.hashSync('1234', 10);
  await query('UPDATE usuarios SET pin_hash = ? WHERE dni IN ("99999999", "12345678")', [hash]);
  console.log('✅ Hashes de PIN 1234 actualizados exitosamente en la base de datos.');
  process.exit(0);
}

fixHashes();
