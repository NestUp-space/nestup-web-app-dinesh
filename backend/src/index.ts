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
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: any) => void) => {
    if (origin && allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
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
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
