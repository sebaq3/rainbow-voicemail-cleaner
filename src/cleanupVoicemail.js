async function cleanupVoicemail(page) {
  try {
    // Esperar a que se cargue el buzón (ajustar selectores reales)
    await page.waitForTimeout(5000); // o usar selectores específicos

    // Suponiendo que los mensajes tienen botones de borrar
    // const deleteButtons = await page.$$('.delete-button-selector');
    // for (const button of deleteButtons) {
    //   await button.click();
    //   await page.waitForTimeout(300);
    // }

    console.log("🧹 Limpieza de mensajes ejecutada.");
  } catch (error) {
    console.error("❌ Error al borrar mensajes:", error);
  }
}

module.exports = cleanupVoicemail;