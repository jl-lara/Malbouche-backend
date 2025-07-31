/**
 * Verificador de dependencias y configuración del EventScheduler
 */

import { logger } from '../services/logger.js';

export class SystemHealthChecker {
  static async checkDependencies() {
    const checks = [];

    // 1. Verificar node-cron
    try {
      const cron = await import('node-cron');
      checks.push({ name: 'node-cron', status: 'OK', version: 'available' });
    } catch (error) {
      checks.push({ name: 'node-cron', status: 'ERROR', error: error.message });
    }

    // 2. Verificar Firebase
    try {
      const { db } = await import('../services/firebase.js');
      await db.collection('test').limit(1).get(); // Test query
      checks.push({ name: 'Firebase', status: 'OK', message: 'Connection successful' });
    } catch (error) {
      checks.push({ name: 'Firebase', status: 'ERROR', error: error.message });
    }

    // 3. Verificar axios
    try {
      const axios = await import('axios');
      checks.push({ name: 'axios', status: 'OK', version: axios.default.VERSION || 'available' });
    } catch (error) {
      checks.push({ name: 'axios', status: 'ERROR', error: error.message });
    }

    // 4. Verificar variables de entorno críticas
    const requiredEnvVars = ['FIREBASE_CREDENTIALS'];
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        checks.push({ name: `ENV.${envVar}`, status: 'OK', message: 'Set' });
      } else {
        checks.push({ name: `ENV.${envVar}`, status: 'WARNING', message: 'Not set' });
      }
    }

    return checks;
  }

  static async checkESP32Connectivity(ip) {
    if (!ip) {
      return { status: 'ERROR', message: 'No IP provided' };
    }

    try {
      const axios = await import('axios');
      const response = await axios.default.get(`http://${ip}/status`, { timeout: 5000 });
      return { 
        status: 'OK', 
        message: 'ESP32 responsive',
        data: response.data 
      };
    } catch (error) {
      return { 
        status: 'ERROR', 
        message: `ESP32 not accessible: ${error.message}` 
      };
    }
  }

  static async checkFirestoreCollections() {
    try {
      const { db } = await import('../services/firebase.js');
      
      const collections = ['eventos', 'movimientos', 'configuration'];
      const results = [];

      for (const collectionName of collections) {
        try {
          const snapshot = await db.collection(collectionName).limit(1).get();
          results.push({
            collection: collectionName,
            status: 'OK',
            exists: true,
            documentCount: snapshot.size
          });
        } catch (error) {
          results.push({
            collection: collectionName,
            status: 'ERROR',
            exists: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      return [{ status: 'ERROR', error: error.message }];
    }
  }

  static logSystemStatus(checks) {
    logger.info('🔍 System Health Check Results:');
    
    let hasErrors = false;
    let hasWarnings = false;

    checks.forEach(check => {
      if (check.status === 'OK') {
        logger.info(`  ✅ ${check.name}: ${check.message || check.version || 'OK'}`);
      } else if (check.status === 'WARNING') {
        logger.warn(`  ⚠️ ${check.name}: ${check.message || 'Warning'}`);
        hasWarnings = true;
      } else {
        logger.error(`  ❌ ${check.name}: ${check.error || check.message || 'Error'}`);
        hasErrors = true;
      }
    });

    if (hasErrors) {
      logger.error('🚨 System has critical errors - EventScheduler may not function properly');
      return 'ERROR';
    } else if (hasWarnings) {
      logger.warn('⚠️ System has warnings - some features may be limited');
      return 'WARNING';
    } else {
      logger.info('✅ System is healthy - EventScheduler ready to start');
      return 'OK';
    }
  }
}
