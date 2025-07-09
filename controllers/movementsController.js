export const setCurrentMovement = async (presetName, velocidad, userId) => {
  try {
    const docRef = db.collection('movimiento_actual').doc('actual');
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      const error = new Error(`Current movement document 'actual' not found`);
      error.statusCode = 404;
      throw error;
    }

    // Assuming presetName corresponds to a movement preset stored in 'movimientos' collection
    const presetQuery = await db.collection('movimientos').where('nombre', '==', presetName).limit(1).get();

    if (presetQuery.empty) {
      const error = new Error(`Preset movement '${presetName}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const presetData = presetQuery.docs[0].data();

    // Prepare updated movement data based on preset and velocidad
    const updatedMovement = {
      ...presetData,
      movimiento: {
        ...presetData.movimiento,
        horas: {
          ...presetData.movimiento.horas,
          velocidad: parseInt(velocidad)
        },
        minutos: {
          ...presetData.movimiento.minutos,
          velocidad: parseInt(velocidad)
        }
      },
      fechaActualizacion: new Date().toISOString(),
      creadoPor: userId || 'system'
    };

    // Update the 'movimiento_actual' document with the updated movement
    await docRef.set(updatedMovement);

    return { id: 'actual', ...updatedMovement };
  } catch (err) {
    logger.error('❌ Error setting current movement:', err.message);
    throw err;
  }
};
