const puppeteer = require('puppeteer');
const { log } = require('./logger');

async function login() {
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://chrome:3000'
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  try {
    log("🌐 Abriendo página de login...", 'info');
    await page.goto('https://web.openrainbow.com/rb/2.149.26/index.html#/login', {
      waitUntil: 'networkidle2'
    });

    // Esperar el input del usuario
    await page.waitForSelector('#username');
    await page.type('#username', process.env.RAINBOW_USER, { delay: 100 });

    // Clic en botón "Continuar"
    const continuarBtn = await page.$x("//span[contains(text(), 'Continuar')]/..");
    if (continuarBtn.length === 0) throw new Error('❌ Botón "Continuar" no encontrado');

    log("🔁 Click en 'Continuar'...", 'info');
    await Promise.all([
      continuarBtn[0].click(),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {})
    ]);

    // Esperar campo de contraseña
    await page.waitForSelector('#authPwd');
    await page.type('#authPwd', process.env.RAINBOW_PASS, { delay: 50 });

    // Clic en botón "Conectar"
    const conectarBtn = await page.$x("//span[contains(text(), 'Conectar')]/..");
    if (conectarBtn.length === 0) throw new Error('❌ Botón "Conectar" no encontrado');

    log("🔁 Click en 'Conectar'...", 'info');
    await Promise.all([
      conectarBtn[0].click(),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {})
    ]);

    // Confirmar login exitoso (esperar selector de app, por ejemplo una clase de dashboard)
    await page.waitForSelector('#app', { timeout: 15000 }).catch(() => {
      throw new Error("❌ No se detectó carga de la app después del login.");
    });

    log("✅ Login exitoso.", 'info');
    return { browser, page };

  } catch (error) {
    console.error("❌ Error en login:", error.message);
    log("❌ Error en login: " + error.message, 'error');

    try { await browser.close(); } catch (_) {}
    return { browser: null, page: null };
  }
}

module.exports = login;
