import mongoose from 'mongoose';

let hasRegisteredEvents = false;
let reconnectTimer = null;
let mongoMemoryServer = null;

const isProduction = process.env.NODE_ENV === 'production';

async function ensureInMemoryMongoServer() {
  if (isProduction) {
    throw new Error('In-memory MongoDB is disabled in production');
  }

  if (!mongoMemoryServer) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
  }

  return mongoMemoryServer;
}

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  // Use in-memory MongoDB for development if no URI provided
  if (!mongoUri) {
    if (isProduction) {
      console.error('❌ MONGODB_URI is required in production.');
      console.log('⚠️  Database initialization skipped. Check Render environment variables.');
      return;
    }

    try {
      console.log('🔄 MongoDB URI not set. Starting in-memory MongoDB...');
      mongoMemoryServer = await ensureInMemoryMongoServer();
      console.log('✅ In-memory MongoDB server created');
      const uri = mongoMemoryServer.getUri();
      
      await mongoose.connect(uri);
      console.log('✅ In-memory MongoDB Connected');
      setupConnectionHandlers();
      return;
    } catch (error) {
      console.error('❌ In-memory MongoDB error:', error.message);
      console.log('⚠️  Database initialization failed but server will continue...');
      return;
    }
  }

  // Use provided MongoDB URI (local or cloud)
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    setupConnectionHandlers();

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Tips:');
    console.log('   1. For local MongoDB: Start mongod service');
    console.log('   2. For cloud MongoDB: Use MongoDB Atlas (free tier)');
    console.log('   3. Set MONGODB_URI in .env file');
    if (isProduction) {
      console.log('⚠️  Production mode: in-memory fallback is disabled.');
      return;
    }

    console.log('⚠️  Server will continue with in-memory database fallback...');
    
    // Fallback to in-memory
    try {
      mongoMemoryServer = await ensureInMemoryMongoServer();
      const uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log('✅ Switched to in-memory MongoDB');
      setupConnectionHandlers();
    } catch (fallbackError) {
      console.error('❌ Fallback to in-memory MongoDB failed:', fallbackError.message);
    }
  }
};

function setupConnectionHandlers() {
  if (!hasRegisteredEvents) {
    hasRegisteredEvents = true;

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Retrying in 10s...');
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectDB();
        }, 10000);
      }
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      
      if (mongoMemoryServer) {
        await mongoMemoryServer.stop();
        console.log('In-memory MongoDB stopped');
      }
      
      process.exit(0);
    });
  }
}

export default connectDB;
