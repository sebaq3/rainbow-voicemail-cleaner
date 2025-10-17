#!/usr/bin/env node
require('dotenv').config();
const cron = require('node-cron');
const { loginWithRetry }  = require('./login');
const cleanupVoicemail = require('./cleanupVoicemail');
const { log } = require('./logger');

async function runCleanup() {
    log(`Ejecutando limpieza...`, 'info');    
    //const { browser, page } = await login();
    const { browser, page } = await loginWithRetry();
    
    if (!page) {
        console.error("❌ No se pudo iniciar sesión.");
        log("❌ No se pudo iniciar sesión.", 'error');
        //await browser.close();
        process.on('exit', async () => {
            try { await browser?.close(); } catch {}
        });
        return;
    }
    
    await cleanupVoicemail(page);
    //await browser.close();
    process.on('exit', async () => {
        try { await browser?.close(); } catch {}
    });
    log("✔️ Proceso terminado.", 'info');
}

// Ejecutar al iniciar
runCleanup();

// Ejecutar cada 6h
//cron.schedule('0 0,6 * * *', runCleanup);