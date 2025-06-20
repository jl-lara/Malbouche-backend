import express from 'express';
import { 
  getAllDevices, 
  registerDevice, 
  updateDevice, 
  deleteDevice,
  sendCommand,
  getDeviceStatus,
  pairDevice,
  unpairDevice
} from '../controllers/devicesController.js';
import { validateDevice, validateCommand } from '../middleware/validation.js';

const router = express.Router();

// GET /api/devices - Get all registered devices
router.get('/', getAllDevices);

// POST /api/devices - Register new ESP32 device
router.post('/', validateDevice, registerDevice);

// PUT /api/devices/:id - Update device configuration
router.put('/:id', validateDevice, updateDevice);

// DELETE /api/devices/:id - Remove device
router.delete('/:id', deleteDevice);

// POST /api/devices/:id/command - Send command to specific device
router.post('/:id/command', validateCommand, sendCommand);

// GET /api/devices/:id/status - Get real-time device status
router.get('/:id/status', getDeviceStatus);

// POST /api/devices/:id/pair - Pair device with user
router.post('/:id/pair', pairDevice);

// POST /api/devices/:id/unpair - Unpair device from user
router.post('/:id/unpair', unpairDevice);

export { router };