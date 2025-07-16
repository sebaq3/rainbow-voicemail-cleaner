const { log } = require('./logger');

async function cleanupVoicemail(page) {
  try {
    // Manejar popup emergente con botón "No" si aparece
    try {
        await new Promise(resolve => setTimeout(resolve, 5000));
      await page.waitForSelector('button.dummyRbButtonClass.c-button--secondary > span.c-button__label', {
        timeout: 3000,
      });

      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button.dummyRbButtonClass.c-button--secondary > span.c-button__label'));
        const noBtnSpan = buttons.find(el => el.textContent.trim() === 'No');
        if (noBtnSpan) {
          noBtnSpan.parentElement.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        console.log('✅ Popup detectado y botón "No" clickeado.');
        log('✅ Popup detectado y botón "No" clickeado.', 'info');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch {
      console.log('ℹ️ No apareció popup para aceptar "No".');
      log('ℹ️ No apareció popup para aceptar "No".', 'info');
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Esperar y click en menú mensajes de voz
    await page.waitForSelector('body > div.o-grid.p-layout > header > nav > menu > ul > li.nav-item_call_log > button', {
      timeout: 10000,
    });
    await page.click('body > div.o-grid.p-layout > header > nav > menu > ul > li.nav-item_call_log > button');
    console.log('✅ Click en menú mensajes de voz realizado.');
    log('✅ Click en menú mensajes de voz realizado.', 'info');

    // Esperar 5 segundos antes del siguiente click
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Click en botón "Eliminar todos"
    await page.waitForSelector('#callLogs-delete-all > rb-svg-img > svg', { timeout: 10000 });
    
    await page.click('#callLogs-delete-all > rb-svg-img > svg');
    
    console.log('✅ Click en botón eliminar todos.');
    log('✅ Click en botón eliminar todos.', 'info');

    // Esperar 5 segundos antes del siguiente click
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Esperar y click en el botón "Eliminar" del mensaje emergente
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('span.c-button__label'));
      const eliminarBtn = buttons.find(el => el.textContent.trim() === 'Eliminar');
      if (eliminarBtn) {
        eliminarBtn.click();
        return true;
      }
      return false;
    }, { timeout: 10000 });

    console.log('✅ Confirmación de eliminación realizada.');
    log('✅ Confirmación de eliminación realizada.', 'info');

    // Esperar 5 segundos para que se complete la acción
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error durante limpieza de mensajes de voz:', error.message);
    log('❌ Error durante limpieza de mensajes de voz: ' + error.message, 'error');
  }
}

module.exports = cleanupVoicemail;
