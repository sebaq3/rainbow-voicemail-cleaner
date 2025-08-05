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
        log('✅ Popup detectado y botón "No" clickeado.', 'info');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch {      
      log('ℹ️ No apareció popup para aceptar "No".', 'info');
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Esperar y click en menú mensajes de voz
    await page.waitForSelector('body > div.o-grid.p-layout > header > nav > menu > ul > li.nav-item_call_log > button', {
      timeout: 10000,
    });
    await page.click('body > div.o-grid.p-layout > header > nav > menu > ul > li.nav-item_call_log > button');
    
    log('✅ Click en menú mensajes de voz realizado.', 'info');

    // Esperar 5 segundos antes del siguiente click
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Click en botón "Eliminar todos"
    const eliminarBtn = await page.$('#callLogs-delete-all > rb-svg-img > svg');
    if (eliminarBtn) {
      await eliminarBtn.click();
      
      log('✅ Click en botón eliminar todos.', 'info');
    } else {
      log('⚠️ Botón de eliminar no encontrado. Quizás no hay mensajes.','info');
      return;
    }
    

    // Esperar 5 segundos antes del siguiente click
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Esperar y click en el botón "Eliminar" del mensaje emergente
    const eliminarVisible = await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('span.c-button__label'));
      return buttons.some(el => el.textContent.trim() === 'Eliminar');
    }, { timeout: 10000 });

  if (eliminarVisible) {
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('span.c-button__label'));
      const eliminarBtn = buttons.find(el => el.textContent.trim() === 'Eliminar');
      if (eliminarBtn) {
        eliminarBtn.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      
      log('✅ Confirmación de eliminación realizada.', 'info');
    } else {
      
      log('⚠️ Botón "Eliminar" visible, pero no se pudo hacer click.', 'warn');
    }
  }

    // Esperar 5 segundos para que se complete la acción
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {    
    log('❌ Error durante limpieza de mensajes de voz: ' + error.message, 'error');
  }
}

module.exports = cleanupVoicemail;
