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
    await new Promise(resolve => setTimeout(resolve, 60000));
    // Esperar y escribir el usuario
    await page.waitForSelector('#username', { timeout: 15000 });
    await page.type('#username', process.env.RAINBOW_USER, { delay: 100 });

    // Pausa de 3 segundos
    await new Promise(resolve => setTimeout(resolve, 3000));


    // Esperar hasta que aparezca el botón "Continuar" y hacer clic
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('span.c-button__label'))
        .some(el => el.textContent.trim() === 'Continuar');
    }, { timeout: 5000 });

    const btn = await page.$x("//span[contains(text(),'Continuar')]/.."); // buscá el botón padre del span
    if (btn.length > 0) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
        btn[0].click()
      ]);
    } else {
      throw new Error('❌ No se encontró el botón "Continuar"');
    }

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

    // Buscar el botón "Conectar"
    const conectarBtn = await page.$x("//span[contains(text(), 'Conectar')]/.."); // Subí al botón padre

    if (conectarBtn.length > 0) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }), // esperá navegación si cambia
        conectarBtn[0].click()
      ]);
    } else {
      throw new Error('❌ No se encontró el botón "Conectar"');
    }

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
