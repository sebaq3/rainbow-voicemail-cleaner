require('dotenv').config();
const cron = require('node-cron');
const login = require('./login');
const cleanupVoicemail = require('./cleanupVoicemail');

async function runCleanup() {
  console.log(`[${new Date().toISOString()}] Ejecutando limpieza...`);
  const { browser, page } = await login();

  if (!page) {
    console.error("❌ No se pudo iniciar sesión.");
    await browser.close();
    return;
  }

  await cleanupVoicemail(page);
  await browser.close();
  console.log("✔️ Proceso terminado.");
}

// Ejecutar al iniciar
runCleanup();

// Ejecutar cada 12h (a las 0:00 y 12:00)
cron.schedule('0 0,12 * * *', runCleanup);