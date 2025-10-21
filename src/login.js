const puppeteer = require('puppeteer');
const { log } = require('./logger');
const fs = require('fs');


async function login() {
  let browser;
  try {
    fs.rmSync('/tmp/.org.chromium.Chromium', { recursive: true, force: true });
    fs.rmSync('/tmp/chrome_*', { recursive: true, force: true });
    fs.rmSync('/tmp/puppeteer_dev_chrome_profile-*', { recursive: true, force: true });
  } catch (_) {}
  try {
    console.log('Usando Chromium desde:', puppeteer.executablePath());
    browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--no-first-run',
      '--disable-background-networking',
      '--disable-translate',
      '--disable-extensions',
      '--disable-default-apps',
      '--hide-scrollbars',
      '--disable-software-rasterizer'
    ],
    });
    const page = await browser.newPage();

     // 🩹 Esperar a que el frame principal esté listo (manejar errores de timing)
    for (let i = 0; i < 5; i++) {
      try {
        if (page.mainFrame()) break;
      } catch (err) {
        if (err.message.includes("Requesting main frame too early")) {
          console.warn(`⚠️  Intento ${i + 1}: main frame no listo aún, reintentando...`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        } else {
          throw err; // otro tipo de error
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    // 🩹 Esperar a que el frame principal esté listo
    while (!page.mainFrame()) {
      console.log('Esperando mainFrame...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    
    // 🩹 Espera adicional de seguridad (~1s)
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.setExtraHTTPHeaders({
    'Accept-Language': 'es-ES,es;q=0.9'
    });
    page.setDefaultTimeout(90000);
    page.setDefaultNavigationTimeout(90000);

    
    log("🌐 Abriendo página de login...", 'info');
    //await page.goto('https://web.openrainbow.com/rb/2.149.26/index.html#/login', {waitUntil: 'networkidle2'});
    await page.goto('https://web.openrainbow.com/#/login', { waitUntil: 'networkidle2' });

    // Esperar y escribir el usuario
    await page.waitForSelector('#username', { timeout: 10000 });
    log("Encontro username ");
    await page.type('#username', process.env.RAINBOW_USER, { delay: 50 });

    // Pausa de 3 segundos
    await new Promise(resolve => setTimeout(resolve, 8000));


    // Esperar hasta que aparezca el botón "Continuar" y hacer clic
    await page.waitForSelector('span.c-button__label', { timeout: 50000 });
    

    const continuarClick = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('span.c-button__label')).find(el => ['Continuar', 'Continue'].includes(el.textContent.trim()));
      if (btn) {
        btn.click();
        return true;
      }
        return false;
    });



    if (!continuarClick) throw new Error('❌ No se encontró el botón "Continuar"');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Esperar a que cargue el campo de contraseña
    await page.waitForSelector('#authPwd', { timeout: 10000 });

    // Ingresar contraseña (recién ahora)
    await page.type('#authPwd', process.env.RAINBOW_PASS, { delay: 50 });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Esperar hasta que aparezca y hacer clic en "Conectar"
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('span.c-button__label'))
        .some(el => ['Conectar', 'Connect'].includes(el.textContent.trim()));
    }, { timeout: 5000 });

    const conectarClick = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('span.c-button__label'))
        .find(el => ['Conectar', 'Connect'].includes(el.textContent.trim()));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!conectarClick) throw new Error('❌ No se encontró el botón "Conectar"');

    // Esperar que la app cargue después del login
    await new Promise(resolve => setTimeout(resolve, 5000)); // o usar un selector post-login

    
    log("✅ Login exitoso.", 'info');
    return { browser, page };

    
  } catch (error) {
    if (error.message.includes("Requesting main frame too early")) {
      log("⚠️  Detected 'Requesting main frame too early' — forcing retry.", 'warn');
      try { await browser?.close(); } catch {}
      throw new Error("REINTENTAR_MAIN_FRAME");
    }
    console.error("❌ Error en login:", error.message)
    log(`❌ Error durante login: ${error.message}`, 'error');
    try { await browser?.close(); } catch {}
    return { browser: null, page: null };
  }
}


async function loginWithRetry(maxRetries = 3) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const result = await login();
      if (result.page) return result;
    } catch (error) {
      if (error.message === "REINTENTAR_MAIN_FRAME") {
        console.warn(`🩹 Error 'Requesting main frame too early!' — reintentando (${i}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      } else {
        console.error(`❌ Intento ${i} fallido: ${error.message}`);
      }
    }
    if (i < maxRetries) {
      console.log(`🔁 Esperando 10s antes del siguiente intento (${i + 1}/${maxRetries})...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  throw new Error(`🚨 Fallaron ${maxRetries} intentos de login consecutivos`);
}

module.exports = {loginWithRetry};