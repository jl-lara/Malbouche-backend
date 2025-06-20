import { db } from '../firebase.js';
import { logger } from '../utils/logger.js';
import { sendToDevice } from '../services/deviceCommunication.js';

export async function getAllDevices(req, res) {
  try {
    logger.info('📱 Getting all devices...');
    const snapshot = await db.ref('devices').once('value');
    const devices = snapshot.val() || {};
    
    logger.info(`✅ ${Object.keys(devices).length} devices found`);
    res.json({
      success: true,
      data: devices,
      count: Object.keys(devices).length
    });
  } catch (err) {
    logger.error('❌ Error getting devices:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error getting devices', 
      details: err.message 
    });
  }
}

export async function registerDevice(req, res) {
  try {
    const { deviceId, name, type, macAddress, ipAddress } = req.body;
    logger.info(`📱 Registering device: ${name} (${deviceId})`);
    
    // Check if device already exists
    const existingDevice = await db.ref(`devices/${deviceId}`).once('value');
    if (existingDevice.exists()) {
      return res.status(409).json({
        success: false,
        error: 'Device already registered'
      });
    }

    const deviceData = {
      deviceId,
      name,
      type: type || 'ESP32_CLOCK',
      macAddress,
      ipAddress,
      status: 'offline',
      lastSeen: null,
      pairedUsers: [],
      settings: {
        timezone: 'UTC',
        brightness: 100,
        autoSync: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await db.ref(`devices/${deviceId}`).set(deviceData);
    
    logger.info(`✅ Device ${deviceId} registered successfully`);
    res.status(201).json({ 
      success: true,
      message: 'Device registered successfully', 
      data: deviceData
    });
  } catch (err) {
    logger.error('❌ Error registering device:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error registering device', 
      details: err.message 
    });
  }
}

export async function updateDevice(req, res) {
  try {
    const { id } = req.params;
    logger.info(`📱 Updating device: ${id}`);
    
    const deviceData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await db.ref(`devices/${id}`).update(deviceData);
    
    logger.info(`✅ Device ${id} updated`);
    res.json({ 
      success: true,
      message: 'Device updated successfully',
      id,
      data: deviceData
    });
  } catch (err) {
    logger.error('❌ Error updating device:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error updating device', 
      details: err.message 
    });
  }
}

export async function deleteDevice(req, res) {
  try {
    const { id } = req.params;
    logger.info(`🗑️ Deleting device: ${id}`);
    
    await db.ref(`devices/${id}`).remove();
    
    logger.info(`✅ Device ${id} deleted`);
    res.json({ 
      success: true,
      message: 'Device deleted successfully',
      id
    });
  } catch (err) {
    logger.error('❌ Error deleting device:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error deleting device', 
      details: err.message 
    });
  }
}

export async function sendCommand(req, res) {
  try {
    const { id } = req.params;
    const { command, parameters } = req.body;
    
    logger.info(`📡 Sending command to device ${id}: ${command}`);
    
    // Get device info
    const deviceSnapshot = await db.ref(`devices/${id}`).once('value');
    if (!deviceSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    const device = deviceSnapshot.val();
    
    // Send command to device
    const result = await sendToDevice(device, { command, parameters });
    
    // Log command in Firebase
    await db.ref(`devices/${id}/commands`).push({
      command,
      parameters,
      timestamp: new Date().toISOString(),
      status: result.success ? 'sent' : 'failed',
      response: result.response
    });
    
    logger.info(`✅ Command sent to device ${id}`);
    res.json({ 
      success: true,
      message: 'Command sent successfully',
      result
    });
  } catch (err) {
    logger.error('❌ Error sending command:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error sending command', 
      details: err.message 
    });
  }
}

export async function getDeviceStatus(req, res) {
  try {
    const { id } = req.params;
    logger.info(`📊 Getting status for device: ${id}`);
    
    const snapshot = await db.ref(`devices/${id}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    const device = snapshot.val();
    
    res.json({
      success: true,
      data: {
        deviceId: id,
        status: device.status,
        lastSeen: device.lastSeen,
        currentTime: device.currentTime,
        settings: device.settings,
        uptime: device.uptime
      }
    });
  } catch (err) {
    logger.error('❌ Error getting device status:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error getting device status', 
      details: err.message 
    });
  }
}

export async function pairDevice(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    logger.info(`🔗 Pairing device ${id} with user ${userId}`);
    
    const deviceRef = db.ref(`devices/${id}`);
    const snapshot = await deviceRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    const device = snapshot.val();
    const pairedUsers = device.pairedUsers || [];
    
    if (!pairedUsers.includes(userId)) {
      pairedUsers.push(userId);
      await deviceRef.update({ 
        pairedUsers,
        updatedAt: new Date().toISOString()
      });
    }
    
    logger.info(`✅ Device ${id} paired with user ${userId}`);
    res.json({ 
      success: true,
      message: 'Device paired successfully'
    });
  } catch (err) {
    logger.error('❌ Error pairing device:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error pairing device', 
      details: err.message 
    });
  }
}

export async function unpairDevice(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    logger.info(`🔓 Unpairing device ${id} from user ${userId}`);
    
    const deviceRef = db.ref(`devices/${id}`);
    const snapshot = await deviceRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    const device = snapshot.val();
    const pairedUsers = (device.pairedUsers || []).filter(uid => uid !== userId);
    
    await deviceRef.update({ 
      pairedUsers,
      updatedAt: new Date().toISOString()
    });
    
    logger.info(`✅ Device ${id} unpaired from user ${userId}`);
    res.json({ 
      success: true,
      message: 'Device unpaired successfully'
    });
  } catch (err) {
    logger.error('❌ Error unpairing device:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error unpairing device', 
      details: err.message 
    });
  }
}