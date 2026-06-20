/**
 * diagnose-cache.js — Verifica CUÁNDO se subieron las fotos sin caché
 * 
 * Esto nos dirá si las fotos sin caché se subieron ANTES o DESPUÉS
 * de que implementáramos el cacheControl en el código.
 */

const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const STORAGE_BUCKET = 'natec-39a7a.firebasestorage.app';

const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

// Las 43 fotos que estaban sin caché
const FILES_WITHOUT_CACHE = [
  'products/1096.webp', 'products/1288.webp', 'products/1406.webp',
  'products/1618.webp', 'products/1776.webp', 'products/1843.webp',
  'products/2121.webp', 'products/2122.webp', 'products/2124.webp',
  'products/2125.webp', 'products/2328.webp', 'products/2395.webp',
  'products/2402.webp', 'products/2443.webp', 'products/3043.webp',
  'products/3088.webp', 'products/3122.webp', 'products/3144.webp',
  'products/3148.webp', 'products/3246.webp', 'products/3593.webp',
  'products/3594.webp', 'products/3595.webp', 'products/3596.webp',
  'products/3604.webp', 'products/3605.webp', 'products/3607.webp',
  'products/4044.webp', 'products/4100.webp', 'products/581.webp',
  'products/K-16SD.webp', 'products/K-16USB.webp', 'products/K-32SD.webp',
  'products/K-32USB.webp', 'products/K-4SD.webp', 'products/K-64USB.webp',
  'products/K-8SD.webp', 'products/K-8USB.webp',
  'products/VIDRIOS AP.webp', 'products/VIDRIOS MI.webp',
  'products/VIDRIOS SM.webp', 'products/VIDRIOS VR.webp', 'products/VIDRIOS.webp'
];

// Algunas fotos que SÍ tenían caché (para comparar)
const FILES_WITH_CACHE = [
  'products/3540.webp', 'products/3541.webp', 'products/3542.webp',
  'products/3543.webp', 'products/3530.webp', 'products/3539.webp',
  'products/3475.webp', 'products/3474.webp', 'products/3466.webp'
];

async function main() {
  console.log('\n🔬 NaTec — Diagnóstico de fechas de subida');
  console.log('═'.repeat(75));

  console.log('\n⚠️  ARCHIVOS QUE NO TENÍAN CACHÉ (ya corregidos):');
  console.log('─'.repeat(75));
  console.log('Archivo'.padEnd(30) + 'Fecha de subida'.padEnd(25) + 'Cache actual');
  console.log('─'.repeat(75));

  for (const fileName of FILES_WITHOUT_CACHE) {
    try {
      const file = bucket.file(fileName);
      const [metadata] = await file.getMetadata();
      const created = new Date(metadata.timeCreated).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
      const cache = metadata.cacheControl || '(vacío)';
      console.log(fileName.replace('products/', '').padEnd(30) + created.padEnd(25) + cache);
    } catch (err) {
      console.log(fileName.replace('products/', '').padEnd(30) + 'ERROR: ' + err.message);
    }
  }

  console.log('\n\n✅ ARCHIVOS QUE SÍ TENÍAN CACHÉ (para comparar fechas):');
  console.log('─'.repeat(75));
  console.log('Archivo'.padEnd(30) + 'Fecha de subida'.padEnd(25) + 'Cache actual');
  console.log('─'.repeat(75));

  for (const fileName of FILES_WITH_CACHE) {
    try {
      const file = bucket.file(fileName);
      const [metadata] = await file.getMetadata();
      const created = new Date(metadata.timeCreated).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
      const cache = metadata.cacheControl || '(vacío)';
      console.log(fileName.replace('products/', '').padEnd(30) + created.padEnd(25) + cache);
    } catch (err) {
      console.log(fileName.replace('products/', '').padEnd(30) + 'ERROR: ' + err.message);
    }
  }

  console.log('\n' + '═'.repeat(75));
  console.log('Compara las fechas arriba para ver si las fotos sin caché se subieron');
  console.log('ANTES o DESPUÉS de que se implementó el cacheControl en el código.\n');

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
