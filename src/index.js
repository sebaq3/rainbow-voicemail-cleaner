#!/usr/bin/env node
require('dotenv').config();
const cron = require('node-cron');
const { loginWithRetry }  = require('./login');
const cleanupVoicemail = require('./cleanupVoicemail');
const { log } = require('./logger');
const fs = require('fs');

const LOCK_FILE = '/tmp/cleanup.lock';



async function runCleanup() {
    if (fs.existsSync(LOCK_FILE)) {
        log('🟠 Tarea ya en ejecución, cancelando ejecución duplicada', 'warn');
        return;
    }
    fs.writeFileSync(LOCK_FILE, String(Date.now()));

    try {
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
    } catch (error) {    
        log(`❌ Error durante cleanup: ${error.message}`, 'error');
    } finally {
        try {
            fs.unlinkSync(LOCK_FILE);
        } catch (err) {
            log(`❌ Error al eliminar el archivo de bloqueo: ${err.message}`, 'error');
        }
    }
}

// Ejecutar al iniciar
runCleanup();

// Ejecutar cada 6h
//cron.schedule('0 0,6 * * *', runCleanup);