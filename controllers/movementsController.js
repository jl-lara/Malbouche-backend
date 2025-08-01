import { logger } from '../services/logger.js';
import { db } from '../services/firebase.js';

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
    logger.info('📋 Fetching all movements');

    const snapshot = await db.collection('movimientos').orderBy('fechaCreacion', 'desc').get();
    const movements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    logger.info(`✅ Found ${movements.length} movements`);

    res.status(200).json({ 
      success: true, 
      data: movements,
      count: movements.length
    });

  } catch (error) {
    logger.error(`❌ Error fetching movements: ${error.message}`, { 
      error: error.stack 
    });
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching movements', 
      details: error.message 
    });
  }
};

export const getMovementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`🔍 Fetching movement with ID: ${id}`);

    const movementDoc = await db.collection('movimientos').doc(id).get();
    
    if (!movementDoc.exists) {
      logger.warn(`❌ Movement not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }

    const movement = { id: movementDoc.id, ...movementDoc.data() };

    logger.info(`✅ Movement found: ${movement.nombre}`);
    
    res.json({
      success: true,
      data: movement
    });

  } catch (error) {
    logger.error(`❌ Error fetching movement: ${error.message}`, { 
      movementId: req.params.id, 
      error: error.stack 
    });
    res.status(500).json({
      success: false,
      error: 'Error fetching movement',
      details: error.message
    });
  }
};

export const createMovement = async (req, res) => {
  try {
    const newMovement = req.body;

    logger.info('📝 Creating new movement', { newMovement });

    // Add metadata for tracking creation
    const movementWithMetadata = {
      ...newMovement,
      fechaCreacion: new Date().toISOString(),
      creadoPor: req.user?.id || 'unknown'
    };

    const docRef = await db.collection('movimientos').add(movementWithMetadata);
    const createdMovement = { id: docRef.id, ...movementWithMetadata };

    logger.info(`✅ Movement created successfully with ID: ${docRef.id}`, { 
      movementName: createdMovement.nombre 
    });

    res.status(201).json({
      success: true,
      data: createdMovement
    });

  } catch (error) {
    logger.error(`❌ Error creating movement: ${error.message}`, { 
      error: error.stack 
    });
    res.status(500).json({ 
      success: false,
      error: 'Error creating movement', 
      details: error.message 
    });
  }
};

export const updateMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    logger.info(`🔄 Updating movement with ID: ${id}`, { updateData });

    // First check if the movement exists
    const movementRef = db.collection('movimientos').doc(id);
    const movementDoc = await movementRef.get();

    if (!movementDoc.exists) {
      logger.warn(`❌ Movement not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }

    // Add metadata for tracking updates
    const dataWithMetadata = {
      ...updateData,
      fechaActualizacion: new Date().toISOString(),
      actualizadoPor: req.user?.id || 'unknown'
    };

    // Update the document in Firestore
    await movementRef.update(dataWithMetadata);

    // Fetch the updated document to return the real saved data
    const updatedDoc = await movementRef.get();
    const savedData = { id: updatedDoc.id, ...updatedDoc.data() };

    logger.info(`✅ Movement updated successfully: ${id}`, { savedData });

    res.status(200).json({
      success: true,
      data: savedData
    });

  } catch (error) {
    logger.error(`❌ Error updating movement: ${error.message}`, { 
      movementId: req.params.id, 
      error: error.stack 
    });
    res.status(500).json({ 
      success: false,
      error: 'Error updating movement', 
      details: error.message 
    });
  }
};

export const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`🗑️ Deleting movement with ID: ${id}`);

    // First check if the movement exists
    const movementRef = db.collection('movimientos').doc(id);
    const movementDoc = await movementRef.get();

    if (!movementDoc.exists) {
      logger.warn(`❌ Movement not found for deletion: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }

    // Store movement data for logging before deletion
    const deletedMovement = { id: movementDoc.id, ...movementDoc.data() };

    // Delete the document from Firestore
    await movementRef.delete();

    logger.info(`✅ Movement deleted successfully: ${id}`, { deletedMovement: deletedMovement.nombre });

    res.status(200).json({ 
      success: true,
      message: `Movement '${deletedMovement.nombre}' deleted successfully`,
      data: { id }
    });

  } catch (error) {
    logger.error(`❌ Error deleting movement: ${error.message}`, { 
      movementId: req.params.id, 
      error: error.stack 
    });
    res.status(500).json({ 
      success: false,
      error: 'Error deleting movement', 
      details: error.message 
    });
  }
};

export const patchMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const partialUpdateData = req.body;

    logger.info(`🔧 Patching movement with ID: ${id}`, { partialUpdateData });

    // First check if the movement exists
    const movementRef = db.collection('movimientos').doc(id);
    const movementDoc = await movementRef.get();

    if (!movementDoc.exists) {
      logger.warn(`❌ Movement not found for patch: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }

    // Add metadata for tracking partial updates
    const dataWithMetadata = {
      ...partialUpdateData,
      fechaActualizacion: new Date().toISOString(),
      actualizadoPor: req.user?.id || 'unknown'
    };

    // Update only the provided fields in Firestore
    await movementRef.update(dataWithMetadata);

    // Fetch the updated document to return the real saved data
    const updatedDoc = await movementRef.get();
    const savedData = { id: updatedDoc.id, ...updatedDoc.data() };

    logger.info(`✅ Movement patched successfully: ${id}`, { savedData });

    res.status(200).json({
      success: true,
      data: savedData
    });

  } catch (error) {
    logger.error(`❌ Error patching movement: ${error.message}`, { 
      movementId: req.params.id, 
      error: error.stack 
    });
    res.status(500).json({ 
      success: false,
      error: 'Error patching movement', 
      details: error.message 
    });
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
