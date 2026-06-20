/**
 * update-storage-cache.js — Script de Caché Masivo NaTec
 *
 * Aplica Cache-Control: public, max-age=31536000 (1 año) a TODAS las imágenes
 * en Firebase Storage (products/, banners/, y cualquier otra carpeta).
 *
 * DIAGNÓSTICO: Primero muestra cuáles archivos NO tienen caché configurado
 * antes de actualizar, para que puedas ver exactamente el problema.
 *
 * Solo actualiza los que necesitan ser actualizados (ahorra operaciones).
 *
 * CÓMO USARLO:
 * 1. Asegúrate de tener serviceAccountKey.json en la raíz del proyecto.
 * 2. npm install firebase-admin --save-dev (si no lo tienes)
 * 3. node scripts/update-storage-cache.js
 */

const admin = require('firebase-admin');
const path = require('path');

// ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');
const STORAGE_BUCKET = 'natec-39a7a.firebasestorage.app';
const TARGET_CACHE_CONTROL = 'public, max-age=31536000';
const BATCH_SIZE = 10;
// ───────────────────────────────────────────────────────────────────────────

// Verificar credenciales
let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch (e) {
  console.error('\n❌ ERROR: No se encontró el archivo serviceAccountKey.json');
  console.error('   Ruta esperada:', SERVICE_ACCOUNT_PATH);
  console.error('\n📋 Ve a Firebase Console → Configuración del proyecto → Cuentas de servicio');
  console.error('   → "Generar nueva clave privada" → guardar como serviceAccountKey.json\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

async function main() {
  console.log('\n🗂️  NaTec — Diagnóstico y Corrección de Caché en Firebase Storage');
  console.log('═'.repeat(65));
  console.log(`   Bucket: ${STORAGE_BUCKET}`);
  console.log(`   Cache-Control objetivo: ${TARGET_CACHE_CONTROL}`);
  console.log('═'.repeat(65));

  // 1. Listar TODOS los archivos del bucket
  console.log('\n⏳ Listando todos los archivos en Storage...');
  const [allFiles] = await bucket.getFiles();

  if (allFiles.length === 0) {
    console.log('⚠️  No se encontraron archivos en el Storage.');
    process.exit(0);
  }

  console.log(`\n📦 Total de archivos en Storage: ${allFiles.length}\n`);

  // 2. Fase de DIAGNÓSTICO — revisar metadata de cada archivo
  console.log('🔍 FASE 1: DIAGNÓSTICO — Revisando metadatos de caché...\n');

  const needsUpdate = [];
  const alreadyOk = [];
  const errors = [];

  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (file) => {
        try {
          const [metadata] = await file.getMetadata();
          const currentCache = metadata.cacheControl || '';
          return { file, name: file.name, currentCache, error: null };
        } catch (err) {
          return { file, name: file.name, currentCache: '', error: err.message };
        }
      })
    );

    for (const result of results) {
      if (result.error) {
        errors.push(result);
      } else if (result.currentCache === TARGET_CACHE_CONTROL) {
        alreadyOk.push(result);
      } else {
        needsUpdate.push(result);
      }
    }
  }

  // Mostrar diagnóstico
  console.log('─'.repeat(65));
  console.log(`   ✅ Con caché correcto: ${alreadyOk.length}`);
  console.log(`   ⚠️  SIN caché (necesitan actualización): ${needsUpdate.length}`);
  console.log(`   ❌ Errores al leer: ${errors.length}`);
  console.log('─'.repeat(65));

  if (needsUpdate.length > 0) {
    console.log('\n📋 Archivos SIN caché (estos causan descargas repetidas):');
    for (const item of needsUpdate) {
      const current = item.currentCache || '(vacío)';
      console.log(`   ⚠️  ${item.name}  →  cacheControl: ${current}`);
    }
  }

  if (alreadyOk.length > 0) {
    console.log('\n✅ Archivos que YA tienen caché correcto:');
    for (const item of alreadyOk) {
      console.log(`   ✓  ${item.name}`);
    }
  }

  // 3. Fase de CORRECCIÓN — aplicar caché a los que faltan
  if (needsUpdate.length === 0) {
    console.log('\n🎉 ¡Todos los archivos ya tienen el caché correcto! No hay nada que actualizar.\n');
    process.exit(0);
  }

  console.log(`\n🔧 FASE 2: CORRECCIÓN — Aplicando caché a ${needsUpdate.length} archivos...\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < needsUpdate.length; i += BATCH_SIZE) {
    const batch = needsUpdate.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (item) => {
        try {
          await item.file.setMetadata({ cacheControl: TARGET_CACHE_CONTROL });
          return { success: true, name: item.name };
        } catch (err) {
          return { success: false, name: item.name, error: err.message };
        }
      })
    );

    for (const result of results) {
      if (result.success) {
        updated++;
        console.log(`  ✅ ${result.name}`);
      } else {
        failed++;
        console.log(`  ❌ ${result.name} — ${result.error}`);
      }
    }

    if (i + BATCH_SIZE < needsUpdate.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '═'.repeat(65));
  console.log(`   📊 RESULTADO FINAL`);
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ⏭️  Ya tenían caché: ${alreadyOk.length}`);
  console.log(`   ❌ Fallidos: ${failed}`);
  console.log('═'.repeat(65));

  if (updated > 0) {
    console.log('\n🎉 ¡Listo! Las imágenes actualizadas ahora se cachearán por 1 año.');
    console.log('   Los navegadores NO volverán a descargar esas imágenes.');
    console.log('   Esto reducirá las operaciones Class B a casi cero.\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n❌ Error inesperado:', err.message);
  process.exit(1);
});
