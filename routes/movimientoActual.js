import express from 'express';
import { setCurrentMovement, updateCurrentMovementSpeed } from '../controllers/movementsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/movimiento-actual/:preset
router.post('/:preset', verifyToken, async (req, res) => {
  const presetName = req.params.preset;
  const { velocidad } = req.body;
  const userId = req.user?.uid || 'system';

  try {
    const updatedMovement = await setCurrentMovement(presetName, velocidad, userId);
    res.json({
      success: true,
      message: `Movimiento actual actualizado con preset '${presetName}'`,
      data: updatedMovement
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: err.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error actualizando movimiento actual',
      details: err.message
    });
  }
});

// PATCH /api/movimiento-actual/velocidad
router.patch('/velocidad', verifyToken, async (req, res) => {
  const { velocidad } = req.body;
  const userId = req.user?.uid || 'system';

  if (velocidad === undefined || velocidad === null) {
    return res.status(400).json({
      success: false,
      error: 'El campo velocidad es requerido'
    });
  }

  try {
    const updatedMovement = await updateCurrentMovementSpeed(velocidad, userId);
    res.json({
      success: true,
      message: 'Velocidad actualizada exitosamente',
      data: updatedMovement
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: err.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Error actualizando velocidad',
      details: err.message
    });
  }
});

export default router;
