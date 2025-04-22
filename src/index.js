import dotenv from 'dotenv';
import { httpServer } from './app.js';
import { connectDb } from './db/db.js';

dotenv.config({
  path: '/.env'
});


const PORT = process.env.PORT || 3000;

// Datbase connection
connectDb()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`💻 Server is running on PORT:${PORT}`)
    })
  })



