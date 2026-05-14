import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Routers
import router from './routes/index.js';
import statesRouter from './routes/api/states.js';

// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const MONGO_URI =  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/statesDB";

const app = express();

// DB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('connected to local MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Built-in Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
app.use('/', router);
app.use('/states', statesRouter);

// 404 Catch-all
app.all(/(.*)/, (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'internal server error' });
});

app.listen(PORT, () => console.log(`server running at http://localhost:${PORT}`));
