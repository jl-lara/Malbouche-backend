import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllMovements = async (req, res) => {
  try {
    logger.info('🎭 Obteniendo todos los movimientos...');
    
    const movimientosSnapshot = await db.collection('movimientos').get();
    const movimientos = [];
    
    movimientosSnapshot.forEach(doc => {
      movimientos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
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
      details: err.message
    });
  }
};

export const createMovement = async (req, res) => {
  try {
    const { 
      nombre, 
      tipoMovimientoHoras, 
      velocidadHora, 
      tipoMovimientoMinutos, 
      velocidadMinuto, 
      tipoMovimiento, 
      velocidad, 
      duracion 
    } = req.body;
    
    logger.info(`🎭 Creando movimiento: ${nombre}`);
    
    const movimientoData = {
      nombre,
      tipoMovimientoHoras,
      velocidadHora: parseInt(velocidadHora),
      tipoMovimientoMinutos,
      velocidadMinuto: parseInt(velocidadMinuto),
      // Campos legacy para compatibilidad
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
      details: err.message
    });
  }
};

export const updateMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      tipoMovimientoHoras, 
      velocidadHora, 
      tipoMovimientoMinutos, 
      velocidadMinuto, 
      tipoMovimiento, 
      velocidad, 
      duracion 
    } = req.body;
    
    logger.info(`🎭 Actualizando movimiento: ${id}`);
    console.log(`UpdateMovement called with id: '${id}'`);
    
    // Check if movement exists
    const movimientoDoc = await db.collection('movimientos').doc(id).get();
    console.log(`Document exists: ${movimientoDoc.exists}`);
    
    if (!movimientoDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }
    
    const updateData = {};
    
    if (nombre) updateData.nombre = nombre;
    if (tipoMovimientoHoras) updateData.tipoMovimientoHoras = tipoMovimientoHoras;
    if (velocidadHora !== undefined) updateData.velocidadHora = parseInt(velocidadHora);
    if (tipoMovimientoMinutos) updateData.tipoMovimientoMinutos = tipoMovimientoMinutos;
    if (velocidadMinuto !== undefined) updateData.velocidadMinuto = parseInt(velocidadMinuto);
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
      details: err.message
    });
  }
};

export const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;
    
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
