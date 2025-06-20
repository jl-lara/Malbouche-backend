import { logger } from '../utils/logger.js';
import { db } from '../firebase.js';

const connectedDevices = new Map();
const connectedClients = new Map();

export function initializeWebSocket(wss) {
  logger.info('🔌 Initializing WebSocket server...');
  
  wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    logger.info(`🔗 New WebSocket connection: ${clientId}`);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await handleWebSocketMessage(ws, clientId, data);
      } catch (err) {
        logger.error('❌ WebSocket message error:', err.message);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      logger.info(`🔌 WebSocket disconnected: ${clientId}`);
      connectedDevices.delete(clientId);
      connectedClients.delete(clientId);
    });
    
    ws.on('error', (err) => {
      logger.error(`❌ WebSocket error for ${clientId}:`, err.message);
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId,
      timestamp: new Date().toISOString()
    }));
  });
  
  logger.info(`✅ WebSocket server initialized on port ${process.env.ESP32_WEBSOCKET_PORT || 8080}`);
}

async function handleWebSocketMessage(ws, clientId, data) {
  const { type, deviceId, payload } = data;
  
  switch (type) {
    case 'device_register':
      await handleDeviceRegister(ws, clientId, deviceId, payload);
      break;
      
    case 'device_status':
      await handleDeviceStatus(deviceId, payload);
      break;
      
    case 'client_subscribe':
      handleClientSubscribe(ws, clientId, payload);
      break;
      
    case 'command_response':
      await handleCommandResponse(deviceId, payload);
      break;
      
    default:
      logger.warn(`⚠️ Unknown WebSocket message type: ${type}`);
  }
}

async function handleDeviceRegister(ws, clientId, deviceId, payload) {
  logger.info(`📱 Device registering: ${deviceId}`);
  
  connectedDevices.set(clientId, {
    ws,
    deviceId,
    connectedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString()
  });
  
  // Update device status in Firebase
  await db.ref(`devices/${deviceId}`).update({
    status: 'online',
    lastSeen: new Date().toISOString(),
    ipAddress: payload.ipAddress,
    firmwareVersion: payload.firmwareVersion
  });
  
  ws.send(JSON.stringify({
    type: 'registration_success',
    deviceId,
    timestamp: new Date().toISOString()
  }));
  
  // Notify subscribed clients
  broadcastToClients('device_online', { deviceId });
}

async function handleDeviceStatus(deviceId, payload) {
  // Update device status in Firebase
  await db.ref(`devices/${deviceId}/status`).update({
    ...payload,
    lastUpdate: new Date().toISOString()
  });
  
  // Broadcast to subscribed clients
  broadcastToClients('device_status_update', { deviceId, status: payload });
}

function handleClientSubscribe(ws, clientId, payload) {
  logger.info(`📱 Client subscribing: ${clientId}`);
  
  connectedClients.set(clientId, {
    ws,
    subscriptions: payload.subscriptions || [],
    connectedAt: new Date().toISOString()
  });
  
  ws.send(JSON.stringify({
    type: 'subscription_success',
    subscriptions: payload.subscriptions,
    timestamp: new Date().toISOString()
  }));
}

async function handleCommandResponse(deviceId, payload) {
  logger.info(`📡 Command response from ${deviceId}:`, payload);
  
  // Log response in Firebase
  await db.ref(`devices/${deviceId}/command_responses`).push({
    ...payload,
    timestamp: new Date().toISOString()
  });
  
  // Broadcast to subscribed clients
  broadcastToClients('command_response', { deviceId, response: payload });
}

function broadcastToClients(type, data) {
  connectedClients.forEach((client, clientId) => {
    try {
      client.ws.send(JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      logger.error(`❌ Error broadcasting to client ${clientId}:`, err.message);
      connectedClients.delete(clientId);
    }
  });
}

export function sendToDevice(deviceId, command) {
  return new Promise((resolve) => {
    let deviceFound = false;
    
    connectedDevices.forEach((device, clientId) => {
      if (device.deviceId === deviceId) {
        deviceFound = true;
        try {
          device.ws.send(JSON.stringify({
            type: 'command',
            command,
            timestamp: new Date().toISOString()
          }));
          
          resolve({ success: true, message: 'Command sent' });
        } catch (err) {
          logger.error(`❌ Error sending command to device ${deviceId}:`, err.message);
          resolve({ success: false, error: err.message });
        }
      }
    });
    
    if (!deviceFound) {
      resolve({ success: false, error: 'Device not connected' });
    }
  });
}

function generateClientId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Cleanup disconnected devices periodically
setInterval(() => {
  const now = Date.now();
  connectedDevices.forEach(async (device, clientId) => {
    const lastSeen = new Date(device.lastSeen).getTime();
    if (now - lastSeen > 60000) { // 1 minute timeout
      logger.info(`🔌 Device timeout: ${device.deviceId}`);
      connectedDevices.delete(clientId);
      
      // Update device status in Firebase
      await db.ref(`devices/${device.deviceId}`).update({
        status: 'offline',
        lastSeen: device.lastSeen
      });
      
      broadcastToClients('device_offline', { deviceId: device.deviceId });
    }
  });
}, 30000); // Check every 30 seconds