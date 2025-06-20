import { sendToDevice as sendViaWebSocket } from './websocket.js';
import { publishToDevice as sendViaMQTT } from './mqtt.js';
import { logger } from '../utils/logger.js';

export async function sendToDevice(device, command) {
  logger.info(`📡 Sending command to device ${device.deviceId}: ${command.command}`);
  
  // Try WebSocket first, then MQTT as fallback
  let result = await sendViaWebSocket(device.deviceId, command);
  
  if (!result.success) {
    logger.info(`🔄 WebSocket failed, trying MQTT for device ${device.deviceId}`);
    result = await sendViaMQTT(device.deviceId, command);
  }
  
  return result;
}

export function broadcastToAllDevices(command) {
  return new Promise(async (resolve) => {
    const results = [];
    
    try {
      // Get all online devices from Firebase
      const { db } = await import('../firebase.js');
      const snapshot = await db.ref('devices').orderByChild('status').equalTo('online').once('value');
      const devices = snapshot.val() || {};
      
      // Send command to each device
      const promises = Object.entries(devices).map(async ([deviceId, device]) => {
        const result = await sendToDevice(device, command);
        results.push({ deviceId, result });
        return result;
      });
      
      await Promise.all(promises);
      
      resolve({
        success: true,
        results,
        totalDevices: results.length,
        successCount: results.filter(r => r.result.success).length
      });
    } catch (err) {
      logger.error('❌ Error broadcasting to devices:', err.message);
      resolve({
        success: false,
        error: err.message,
        results
      });
    }
  });
}

export function getDeviceConnectionStatus(deviceId) {
  // This would check both WebSocket and MQTT connections
  // Implementation depends on how you track connections
  return {
    websocket: false, // Check WebSocket connection
    mqtt: false,      // Check MQTT connection
    lastSeen: null    // Get from Firebase
  };
}