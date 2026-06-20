/**
 * make-admin.js — Script de Administración NaTec
 *
 * Este script le da el permiso "admin: true" (Custom Claim) a las cuentas
 * que necesitan acceder al panel de administración.
 *
 * CÓMO USARLO:
 * 1. Instalar dependencia: npm install firebase-admin --save-dev
 * 2. Obtener serviceAccountKey.json desde Firebase Console:
 *    → Ir a: https://console.firebase.google.com/
 *    → Seleccionar proyecto NaTec
 *    → Engranaje (⚙) → Configuración del proyecto
 *    → Pestaña "Cuentas de servicio"
 *    → Botón "Generar nueva clave privada"
 *    → Guardar el archivo como "serviceAccountKey.json" en la RAÍZ del proyecto
 *    ⚠️  NUNCA subas este archivo a Git (ya está en .gitignore)
 *
 * 3. Correr el script:
 *    node scripts/make-admin.js
 *
 * 4. Verificar en Firebase Console → Authentication → Users
 *    El campo "Custom Claims" debe mostrar: {"admin":true}
 *
 * ─────────────────────────────────────────────────────────
 * PARA AGREGAR UN NUEVO ADMIN EN EL FUTURO:
 *   Simplemente agrega el email al array ADMIN_EMAILS y corre el script de nuevo.
 * ─────────────────────────────────────────────────────────
 */

const admin = require('firebase-admin');
const path = require('path');

// ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');

/**
 * Agrega aquí los emails de todos los administradores.
 * Puedes agregar más en el futuro simplemente sumando más emails al array.
 */
const ADMIN_EMAILS = [
  'juanpalinare@gmail.com',       // Desarrollador
  'natechnology010@gmail.com',    // Cliente admin
];
// ───────────────────────────────────────────────────────────────────────────

// Verificar que el archivo de credenciales existe
let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch (e) {
  console.error('\n❌ ERROR: No se encontró el archivo serviceAccountKey.json');
  console.error('   Ruta esperada:', SERVICE_ACCOUNT_PATH);
  console.error('\n📋 INSTRUCCIONES:');
  console.error('   1. Ve a https://console.firebase.google.com/');
  console.error('   2. Selecciona el proyecto NaTec');
  console.error('   3. Engranaje → Configuración del proyecto → Cuentas de servicio');
  console.error('   4. "Generar nueva clave privada"');
  console.error('   5. Guarda el archivo como serviceAccountKey.json en la raíz del proyecto\n');
  process.exit(1);
}

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Otorga el rol de administrador a una cuenta por su email.
 */
async function grantAdminRole(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`  ✅ ${email} → Permisos de admin otorgados (UID: ${user.uid})`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`  ⚠️  ${email} → Usuario no encontrado. ¿El email está bien escrito?`);
    } else {
      console.error(`  ❌ ${email} → Error:`, error.message);
    }
  }
}

// ── EJECUCIÓN ──────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔐 NaTec — Script de Permisos de Administrador');
  console.log('─'.repeat(50));
  console.log(`   Proyecto: ${serviceAccount.project_id}`);
  console.log(`   Cuentas a procesar: ${ADMIN_EMAILS.length}`);
  console.log('─'.repeat(50));

  for (const email of ADMIN_EMAILS) {
    await grantAdminRole(email);
  }

  console.log('\n─'.repeat(50));
  console.log('✅ Proceso completado.');
  console.log('\n⚠️  IMPORTANTE: Los usuarios deben cerrar sesión y volver a');
  console.log('   iniciar sesión para que el nuevo permiso surta efecto.\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
