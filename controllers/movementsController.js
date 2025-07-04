import { db } from '../services/firebase.js';
import { logger } from '../services/logger.js';

export const getAllMovements = async (req, res) => {
  try {
    // Removed activity logging
    
    const movimientosSnapshot = await db.collection('movimientos').get();
    const movimientos = [];
    
    movimientosSnapshot.forEach(doc => {
      movimientos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
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
    
    // Removed activity logging
    
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
    
    // Removed activity logging to logs collection
    
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
    
    // Removed activity logging
    
    // Check if movement exists
    const movimientoDoc = await db.collection('movimientos').doc(id).get();
    
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
    
    // Removed activity logging to logs collection
    
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
    
    // Removed activity logging
    
    // Check if movement exists
    const movimientoDoc = await db.collection('movimientos').doc(id).get();
    
    if (!movimientoDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }
    
    await db.collection('movimientos').doc(id).delete();
    
    // Removed activity logging to logs collection
    
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