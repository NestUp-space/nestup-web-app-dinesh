// Mock data for testing purposes
export const mockData = {
  users: [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      phoneNumber: '1234567890',
      password: 'hashedPassword', // Store hashed passwords if comparing
      roleId: 1, // Assuming roleId 1 is for admin or a default role
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: 'Test User',
      email: 'test@example.com',
      phoneNumber: '0987654321',
      password: 'hashedPassword2',
      roleId: 2, // Assuming roleId 2 is for a client or another default role
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  // Add other mock data arrays as needed (e.g., projects, tasks)
};

// You can also add helper functions here, for example:
// export const generateMockToken = (userId: number, role: string) => { ... };
