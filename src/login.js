const puppeteer = require('puppeteer');
const { log } = require('./logger');

async function login() {
  // const browser = await puppeteer.launch({
    const browser = await puppeteer.connect({
      browserWSEndpoint: 'ws://chrome:3000'
  // headless: 'new',
  // args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://web.openrainbow.com/rb/2.149.26/index.html#/login', {
      waitUntil: 'networkidle2'
    });

    // Esperar y escribir el usuario
    await page.waitForSelector('#username', { timeout: 10000 });
    await page.type('#username', process.env.RAINBOW_USER, { delay: 50 });

    // Pausa de 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));


    // Esperar hasta que aparezca el botón "Continuar" y hacer clic
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('span.c-button__label'))
        .some(el => el.textContent.trim() === 'Continuar');
    }, { timeout: 5000 });

    const continuarClick = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('span.c-button__label'))
        .find(el => el.textContent.trim() === 'Continuar');
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
        .some(el => el.textContent.trim() === 'Conectar');
    }, { timeout: 5000 });

    const conectarClick = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('span.c-button__label'))
        .find(el => el.textContent.trim() === 'Conectar');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!conectarClick) throw new Error('❌ No se encontró el botón "Conectar"');

    // Esperar que la app cargue después del login
    await new Promise(resolve => setTimeout(resolve, 5000)); // o usar un selector post-login

    console.log("✅ Login exitoso.");
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
