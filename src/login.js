const puppeteer = require('puppeteer');
const { log } = require('./logger');


async function login() {
  console.log('Usando Chromium desde:', puppeteer.executablePath());
  const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--single-process'
  ],
});
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
  'Accept-Language': 'es-ES,es;q=0.9'
  });
  page.setDefaultTimeout(90000);
  page.setDefaultNavigationTimeout(90000);

  try {
    log("🌐 Abriendo página de login...", 'info');
    await page.goto('https://web.openrainbow.com/rb/2.149.26/index.html#/login', {
      waitUntil: 'networkidle2'
    });

     // Esperar y escribir el usuario
    await page.waitForSelector('#username', { timeout: 10000 });
    log("Encontro username ");
    await page.type('#username', process.env.RAINBOW_USER, { delay: 50 });

    // Pausa de 3 segundos
    await new Promise(resolve => setTimeout(resolve, 8000));


    // Esperar hasta que aparezca el botón "Continuar" y hacer clic
    await page.waitForSelector('span.c-button__label', { timeout: 50000 });
    

    const continuarClick = await page.evaluate(() => {
  const btn = Array.from(document.querySelectorAll('span.c-button__label'))
    .find(el => ['Continuar', 'Continue'].includes(el.textContent.trim()));
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
    console.error("❌ Error en login:", error.message);
    log("❌ Error en login: " + error.message, 'error');
    await browser.close();
    return { browser, page: null };
  }
}

module.exports = login;