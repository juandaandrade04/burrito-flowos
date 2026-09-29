const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[sales-service] MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[sales-service] Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;