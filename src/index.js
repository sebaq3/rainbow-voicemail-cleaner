require('dotenv').config();
const cron = require('node-cron');
const login = require('./login');
const cleanupVoicemail = require('./cleanupVoicemail');
const { log } = require('./logger');

async function runCleanup() {
    log(`Ejecutando limpieza...`, 'info');
    console.log(`[${new Date().toISOString()}] Ejecutando limpieza...`);
    const { browser, page } = await login();
    
    if (!page) {
        console.error("❌ No se pudo iniciar sesión.");
        log("❌ No se pudo iniciar sesión.", 'error');
        await browser.close();
        return;
    }
    
    await cleanupVoicemail(page);
    await browser.close();
    console.log("✔️ Proceso terminado.");
    log("✔️ Proceso terminado.", 'info');
}

// Ejecutar al iniciar
runCleanup();

// Ejecutar cada 12h (a las 0:00 y 12:00)
cron.schedule('0 0,12 * * *', runCleanup);