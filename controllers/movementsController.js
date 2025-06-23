import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllMovements = async (req, res) => {
  try {
<<<<<<< HEAD
    logger.info('🎭 Obteniendo todos los movimientos...');
    
    const movimientosSnapshot = await db.collection('movimientos').get();
    const movimientos = [];
    
    movimientosSnapshot.forEach(doc => {
      movimientos.push({
=======
    logger.info('🎭 Getting all movements...');
    
    const movementsSnapshot = await db.collection('movements').get();
    const movements = [];
    
    movementsSnapshot.forEach(doc => {
      movements.push({
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
        id: doc.id,
        ...doc.data()
      });
    });
    
<<<<<<< HEAD
    logger.info(`✅ ${movimientos.length} movimientos encontrados`);
    
    res.json({
      success: true,
      data: movimientos,
      count: movimientos.length
    });
  } catch (err) {
    logger.error('❌ Error obteniendo movimientos:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo movimientos',
=======
    logger.info(`✅ ${movements.length} movements found`);
    
    res.json({
      success: true,
      data: movements,
      count: movements.length
    });
  } catch (err) {
    logger.error('❌ Error getting movements:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error getting movements',
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      details: err.message
    });
  }
};

export const createMovement = async (req, res) => {
  try {
<<<<<<< HEAD
    const { nombre, tipoMovimiento, velocidad, duracion } = req.body;
    
    logger.info(`🎭 Creando movimiento: ${nombre}`);
    
    const movimientoData = {
      nombre,
      tipoMovimiento,
      velocidad: parseInt(velocidad),
      duracion: parseInt(duracion),
      fechaCreacion: new Date().toISOString(),
      creadoPor: req.user?.uid || 'system'
    };
    
    const movimientoRef = await db.collection('movimientos').add(movimientoData);
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: req.user?.uid || 'system',
      accion: 'crear_movimiento',
      resultado: 'exitoso',
      timestamp: new Date().toISOString(),
      detalles: { movimientoCreado: movimientoRef.id }
    });
    
    logger.info(`✅ Movimiento creado con ID: ${movimientoRef.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Movimiento creado exitosamente',
      data: {
        id: movimientoRef.id,
        ...movimientoData
      }
    });
  } catch (err) {
    logger.error('❌ Error creando movimiento:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error creando movimiento',
=======
    const { name, movementType, speed, duration } = req.body;
    
    logger.info(`🎭 Creating movement: ${name}`);
    
    const movementData = {
      name,
      movementType,
      speed: parseInt(speed),
      duration: parseInt(duration),
      createdAt: new Date().toISOString(),
      createdBy: req.user?.uid || 'system'
    };
    
    const movementRef = await db.collection('movements').add(movementData);
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'create_movement',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { movementCreated: movementRef.id }
    });
    
    logger.info(`✅ Movement created with ID: ${movementRef.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Movement created successfully',
      data: {
        id: movementRef.id,
        ...movementData
      }
    });
  } catch (err) {
    logger.error('❌ Error creating movement:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error creating movement',
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      details: err.message
    });
  }
};

export const updateMovement = async (req, res) => {
  try {
    const { id } = req.params;
<<<<<<< HEAD
    const { nombre, tipoMovimiento, velocidad, duracion } = req.body;
    
    logger.info(`🎭 Actualizando movimiento: ${id}`);
    
    // Check if movement exists
    const movimientoDoc = await db.collection('movimientos').doc(id).get();
    
    if (!movimientoDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
=======
    const { name, movementType, speed, duration } = req.body;
    
    logger.info(`🎭 Updating movement: ${id}`);
    
    // Check if movement exists
    const movementDoc = await db.collection('movements').doc(id).get();
    
    if (!movementDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      });
    }
    
    const updateData = {};
    
<<<<<<< HEAD
    if (nombre) updateData.nombre = nombre;
    if (tipoMovimiento) updateData.tipoMovimiento = tipoMovimiento;
    if (velocidad !== undefined) updateData.velocidad = parseInt(velocidad);
    if (duracion !== undefined) updateData.duracion = parseInt(duracion);
    
    updateData.fechaActualizacion = new Date().toISOString();
    
    await db.collection('movimientos').doc(id).update(updateData);
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: req.user?.uid || 'system',
      accion: 'actualizar_movimiento',
      resultado: 'exitoso',
      timestamp: new Date().toISOString(),
      detalles: { movimientoActualizado: id }
    });
    
    logger.info(`✅ Movimiento ${id} actualizado`);
    
    res.json({
      success: true,
      message: 'Movimiento actualizado exitosamente',
      data: { id, ...updateData }
    });
  } catch (err) {
    logger.error('❌ Error actualizando movimiento:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error actualizando movimiento',
=======
    if (name) updateData.name = name;
    if (movementType) updateData.movementType = movementType;
    if (speed !== undefined) updateData.speed = parseInt(speed);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    
    updateData.updatedAt = new Date().toISOString();
    
    await db.collection('movements').doc(id).update(updateData);
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'update_movement',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { movementUpdated: id }
    });
    
    logger.info(`✅ Movement ${id} updated`);
    
    res.json({
      success: true,
      message: 'Movement updated successfully',
      data: { id, ...updateData }
    });
  } catch (err) {
    logger.error('❌ Error updating movement:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error updating movement',
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
      details: err.message
    });
  }
};

export const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;
    
<<<<<<< HEAD
    logger.info(`🗑️ Eliminando movimiento: ${id}`);
    
    // Check if movement exists
    const movimientoDoc = await db.collection('movimientos').doc(id).get();
    
    if (!movimientoDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }
    
    await db.collection('movimientos').doc(id).delete();
    
    // Log the action
    await db.collection('logs').add({
      usuarioId: req.user?.uid || 'system',
      accion: 'eliminar_movimiento',
      resultado: 'exitoso',
      timestamp: new Date().toISOString(),
      detalles: { movimientoEliminado: id }
    });
    
    logger.info(`✅ Movimiento ${id} eliminado`);
    
    res.json({
      success: true,
      message: 'Movimiento eliminado exitosamente',
      data: { id }
    });
  } catch (err) {
    logger.error('❌ Error eliminando movimiento:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error eliminando movimiento',
      details: err.message
    });
  }
};
=======
    logger.info(`🗑️ Deleting movement: ${id}`);
    
    // Check if movement exists
    const movementDoc = await db.collection('movements').doc(id).get();
    
    if (!movementDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Movement not found'
      });
    }
    
    await db.collection('movements').doc(id).delete();
    
    // Log the action
    await db.collection('logs').add({
      userId: req.user?.uid || 'system',
      action: 'delete_movement',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: { movementDeleted: id }
    });
    
    logger.info(`✅ Movement ${id} deleted`);
    
    res.json({
      success: true,
      message: 'Movement deleted successfully',
      data: { id }
    });
  } catch (err) {
    logger.error('❌ Error deleting movement:', err.message);
    res.status(500).json({
      success: false,
      error: 'Error deleting movement',
      details: err.message
    });
  }
};
>>>>>>> d71f8d772e7f643a781bf6af4778ae620c91d75a
