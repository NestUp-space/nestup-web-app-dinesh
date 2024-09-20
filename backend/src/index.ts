import express from 'express';
import dotenv from 'dotenv';
import prisma from './config/db';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import fileRoutes from './routes/file.routes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware to parse JSON requests
app.use(express.json());


// Routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/files', fileRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
