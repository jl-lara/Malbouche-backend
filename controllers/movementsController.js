import logger from '../services/logger.js';

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

export const getAllMovements = async (req, res) => {
  try {
    // Placeholder: Fetch all movements from database
    const movements = []; // Replace with actual DB call
    res.status(200).json(movements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movements', error: error.message });
  }
};

export const createMovement = async (req, res) => {
  try {
    // Placeholder: Create a new movement in database
    const newMovement = req.body; // Replace with actual DB insert logic
    res.status(201).json(newMovement);
  } catch (error) {
    res.status(500).json({ message: 'Error creating movement', error: error.message });
  }
};

export const updateMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    // Placeholder: Update movement by id in database
    res.status(200).json({ id, ...updatedData });
  } catch (error) {
    res.status(500).json({ message: 'Error updating movement', error: error.message });
  }
};

export const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;
    // Placeholder: Delete movement by id from database
    res.status(200).json({ message: `Movement with id ${id} deleted` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting movement', error: error.message });
  }
};

export const updateCurrentMovementSpeed = async (velocidad, userId) => {
  try {
    const docRef = db.collection('movimiento_actual').doc('actual');
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      const error = new Error(`Current movement document 'actual' not found`);
      error.statusCode = 404;
      throw error;
    }

    const currentData = docSnapshot.data();

    const updatedMovement = {
      ...currentData,
      movimiento: {
        ...currentData.movimiento,
        horas: {
          ...currentData.movimiento.horas,
          velocidad: parseInt(velocidad)
        },
        minutos: {
          ...currentData.movimiento.minutos,
          velocidad: parseInt(velocidad)
        }
      },
      fechaActualizacion: new Date().toISOString(),
      modificadoPor: userId || 'system'
    };

    await docRef.set(updatedMovement);

    return { id: 'actual', ...updatedMovement };
  } catch (err) {
    logger.error('❌ Error updating current movement speed:', err.message);
    throw err;
  }
};
