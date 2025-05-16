import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino-http';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import userRoutes from './routes/user.routes';
import fileRoutes from './routes/file.routes';
import siteVisitRoutes from './routes/site-visit.routes';
import roleRoutes from './routes/role.routes';
import catalogueRouter from "./catalogue/routes/model.routes"; // Import catalogue router
import plankGenerationRouter from "./bim/routes/plank-generation.routes"; // Import plank generation router

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
// Parse comma-separated origins if multiple are provided
const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

console.log('CORS allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(pino());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/site-visit', siteVisitRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/v1/catalogue', catalogueRouter); // Mount catalogue router
app.use('/api/bim/plank-generation', plankGenerationRouter); // Mount plank generation router

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
