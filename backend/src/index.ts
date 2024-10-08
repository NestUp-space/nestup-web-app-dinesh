import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino-http';
import authRoutes from '@/routes/auth.routes';
import projectRoutes from '@/routes/project.routes';
import userRoutes from '@/routes/user.routes';
import fileRoutes from '@/routes/file.routes';
import siteVisitRoutes from '@/routes/site-visit.routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pino());

// Routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/files', fileRoutes);
app.use('/users', userRoutes);
app.use('/site-visit', siteVisitRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;