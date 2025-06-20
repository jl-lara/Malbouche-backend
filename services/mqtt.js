import mqtt from 'mqtt';
import { logger } from '../utils/logger.js';
import { db } from '../firebase.js';

let mqttClient = null;

export function initializeMQTT() {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  const options = {
    clientId: process.env.MQTT_CLIENT_ID || 'malbouche-backend',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000
  };
  
  logger.info(`🔌 Connecting to MQTT broker: ${brokerUrl}`);
  
  mqttClient = mqtt.connect(brokerUrl, options);
  
  mqttClient.on('connect', () => {
    logger.info('✅ Connected to MQTT broker');
    
    // Subscribe to device topics
    const topics = [
      'malbouche/devices/+/status',
      'malbouche/devices/+/response',
      'malbouche/devices/+/heartbeat'
    ];
    
    topics.forEach(topic => {
      mqttClient.subscribe(topic, (err) => {
        if (err) {
          logger.error(`❌ Failed to subscribe to ${topic}:`, err.message);
        } else {
          logger.info(`📡 Subscribed to ${topic}`);
        }
      });
    });
  });
  
  mqttClient.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      await handleMQTTMessage(topic, data);
    } catch (err) {
      logger.error('❌ MQTT message parsing error:', err.message);
    }
  });
  
  mqttClient.on('error', (err) => {
    logger.error('❌ MQTT connection error:', err.message);
  });
  
  mqttClient.on('close', () => {
    logger.warn('⚠️ MQTT connection closed');
  });
  
  mqttClient.on('reconnect', () => {
    logger.info('🔄 Reconnecting to MQTT broker...');
  });
}

async function handleMQTTMessage(topic, data) {
  const topicParts = topic.split('/');
  const deviceId = topicParts[2];
  const messageType = topicParts[3];
  
  logger.info(`📡 MQTT message from ${deviceId}: ${messageType}`);
  
  switch (messageType) {
    case 'status':
      await handleDeviceStatusUpdate(deviceId, data);
      break;
      
    case 'response':
      await handleCommandResponse(deviceId, data);
      break;
      
    case 'heartbeat':
      await handleHeartbeat(deviceId, data);
      break;
      
    default:
      logger.warn(`⚠️ Unknown MQTT message type: ${messageType}`);
  }
}

async function handleDeviceStatusUpdate(deviceId, data) {
  try {
    await db.ref(`devices/${deviceId}`).update({
      status: 'online',
      lastSeen: new Date().toISOString(),
      currentTime: data.currentTime,
      uptime: data.uptime,
      memoryUsage: data.memoryUsage,
      wifiSignal: data.wifiSignal
    });
    
    logger.info(`✅ Updated status for device ${deviceId}`);
  } catch (err) {
    logger.error(`❌ Error updating device status:`, err.message);
  }
}

async function handleCommandResponse(deviceId, data) {
  try {
    await db.ref(`devices/${deviceId}/command_responses`).push({
      ...data,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`✅ Logged command response for device ${deviceId}`);
  } catch (err) {
    logger.error(`❌ Error logging command response:`, err.message);
  }
}

async function handleHeartbeat(deviceId, data) {
  try {
    await db.ref(`devices/${deviceId}`).update({
      status: 'online',
      lastSeen: new Date().toISOString(),
      heartbeat: data
    });
  } catch (err) {
    logger.error(`❌ Error updating heartbeat:`, err.message);
  }
}

export function publishToDevice(deviceId, command) {
  return new Promise((resolve) => {
    if (!mqttClient || !mqttClient.connected) {
      resolve({ success: false, error: 'MQTT client not connected' });
      return;
    }
    
    const topic = `malbouche/devices/${deviceId}/command`;
    const message = JSON.stringify({
      ...command,
      timestamp: new Date().toISOString()
    });
    
    mqttClient.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        logger.error(`❌ Failed to publish to ${topic}:`, err.message);
        resolve({ success: false, error: err.message });
      } else {
        logger.info(`📡 Published command to ${topic}`);
        resolve({ success: true, message: 'Command published' });
      }
    });
  });
}

export function getMQTTStatus() {
  return {
    connected: mqttClient?.connected || false,
    reconnecting: mqttClient?.reconnecting || false
  };
}