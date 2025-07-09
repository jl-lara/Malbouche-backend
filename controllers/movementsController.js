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
      duracion,
      movimiento
    } = req.body;

    if (!movimiento || typeof movimiento !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'El campo movimiento es requerido y debe ser un objeto'
      });
    }

    const movimientoData = {
      nombre,
      duracion: parseInt(duracion),
      movimiento: {
        direccionGeneral: movimiento.direccionGeneral,
        horas: {
          direccion: movimiento.horas?.direccion,
          velocidad: parseInt(movimiento.horas?.velocidad)
        },
        minutos: {
          direccion: movimiento.minutos?.direccion,
          velocidad: parseInt(movimiento.minutos?.velocidad)
        }
      },
      fechaCreacion: new Date().toISOString(),
      creadoPor: req.user?.uid || 'system'
    };

    const movimientoRef = await db.collection('movimientos').add(movimientoData);

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
      duracion,
      movimiento
    } = req.body;

    const movimientoDoc = await db.collection('movimientos').doc(id).get();

    if (!movimientoDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Movimiento no encontrado'
      });
    }

    const updateData = {};

    if (nombre) updateData.nombre = nombre;
    if (duracion !== undefined) updateData.duracion = parseInt(duracion);

    if (movimiento && typeof movimiento === 'object') {
      updateData.movimiento = {};

      if (movimiento.direccionGeneral) {
        updateData.movimiento.direccionGeneral = movimiento.direccionGeneral;
      }

      if (movimiento.horas && typeof movimiento.horas === 'object') {
        updateData.movimiento.horas = {};
        if (movimiento.horas.direccion) {
          updateData.movimiento.horas.direccion = movimiento.horas.direccion;
        }
        if (movimiento.horas.velocidad !== undefined) {
          updateData.movimiento.horas.velocidad = parseInt(movimiento.horas.velocidad);
        }
      }

      if (movimiento.minutos && typeof movimiento.minutos === 'object') {
        updateData.movimiento.minutos = {};
        if (movimiento.minutos.direccion) {
          updateData.movimiento.minutos.direccion = movimiento.minutos.direccion;
        }
        if (movimiento.minutos.velocidad !== undefined) {
          updateData.movimiento.minutos.velocidad = parseInt(movimiento.minutos.velocidad);
        }
      }
    }

    updateData.fechaActualizacion = new Date().toISOString();

    await db.collection('movimientos').doc(id).update(updateData);

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