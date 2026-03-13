import express from 'express';
import {
  getConfig,
  updateConfig,
  getStatus,
  updateStatus,
  getHealth,
  getTestMode,
  toggleTestMode,
  clearSensorHistory,
  clearWateringHistory,
  clearDiseaseHistory,
  clearAllHistory,
  getDataRetentionPolicy,
  updateDataRetentionPolicy
} from '../controllers/configController.js';
import { validateConfigUpdate, validateDeviceStatus } from '../validators/requestValidator.js';
import { readLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// IMPORTANT: Specific routes must come BEFORE dynamic parameter routes
// Otherwise /:deviceId will match everything

// GET /api/config/status - Get device status (with optional ?deviceId= query param)
router.get('/status', readLimiter, getStatus);

// GET /api/config/status/:deviceId - Get device status by path param (supports ESP32-CAM etc.)
router.get('/status/:deviceId', readLimiter, getStatus);

// POST /api/config/status - Update device status (ESP32 endpoint)
router.post('/status', validateDeviceStatus, updateStatus);

// GET /api/config/health - Get system health
router.get('/health', readLimiter, getHealth);

// GET /api/config/health/:deviceId - Get health for specific device
router.get('/health/:deviceId', readLimiter, getHealth);

// GET /api/config/testmode - Get test mode status
router.get('/testmode', readLimiter, getTestMode);

// POST /api/config/testmode - Toggle test mode
router.post('/testmode', toggleTestMode);

// POST /api/config/clear-sensor-history - Clear sensor readings history
router.post('/clear-sensor-history', clearSensorHistory);

// POST /api/config/clear-watering-history - Clear watering logs history
router.post('/clear-watering-history', clearWateringHistory);

// POST /api/config/clear-disease-history - Clear disease detection history
router.post('/clear-disease-history', clearDiseaseHistory);

// POST /api/config/clear-all-history - Clear all historical data
router.post('/clear-all-history', clearAllHistory);

// GET/PUT /api/config/data-retention - Manage retention policy
router.get('/data-retention', readLimiter, getDataRetentionPolicy);
router.put('/data-retention', updateDataRetentionPolicy);

// GET /api/config - Get system configuration
router.get('/', readLimiter, getConfig);
router.get('/:deviceId', readLimiter, getConfig);

// POST /api/config - Update system configuration
router.post('/', validateConfigUpdate, updateConfig);
router.patch('/:deviceId', validateConfigUpdate, updateConfig);

export default router;
