import mongoose from 'mongoose';

const deviceStatusSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    default: 'ESP32-001'
  },
  online: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  pumpActive: {
    type: Boolean,
    default: false
  },
  currentState: {
    type: String,
    enum: ['IDLE', 'WATERING', 'COOLDOWN', 'ERROR'],
    default: 'IDLE'
  },
  ipAddress: {
    type: String
  },
  firmwareVersion: {
    type: String,
    default: '1.0.0'
  },
  wifiSignal: {
    type: Number // RSSI
  },
  uptime: {
    type: Number // seconds
  },
  freeHeap: {
    type: Number // bytes
  },
  errors: [{
    code: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  suppressReservedKeysWarning: true,
  timestamps: true
});

// Mark device as online
deviceStatusSchema.methods.markOnline = function() {
  this.online = true;
  this.lastSeen = new Date();
  return this.save();
};

// Mark device as offline
deviceStatusSchema.methods.markOffline = function() {
  this.online = false;
  return this.save();
};

// Check if device is stale (no update in 30 seconds)
deviceStatusSchema.methods.isStale = function() {
  const thirtySecondsAgo = new Date(Date.now() - 30000);
  return this.lastSeen < thirtySecondsAgo;
};

// Static method to get or create status
deviceStatusSchema.statics.getStatus = async function(deviceId = 'ESP32-001') {
  let status = await this.findOne({ deviceId });
  
  if (!status) {
    status = await this.create({ deviceId });
  }
  
  return status;
};

const DeviceStatus = mongoose.model('DeviceStatus', deviceStatusSchema);

export default DeviceStatus;
