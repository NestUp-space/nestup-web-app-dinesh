import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

/**
 * WARNING: This script is for LOCAL DEVELOPMENT ONLY.
 * Never run in production or with production credentials.
 * Token logging is intentional for debugging but should not be used with real data.
 */
async function testLogin() {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: This script should not be run in production!');
    process.exit(1);
  }

  try {
    // Test admin login
    const adminResponse = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
        password: process.env.TEST_ADMIN_PASSWORD || '',
      }),
    });

    const adminData = await adminResponse.json();
    console.log('Admin Login Response:', adminData);

    if (adminData.token) {
      const decoded = jwt.decode(adminData.token);
      // Security: Only log non-sensitive payload fields for debugging
      console.log('Admin Token payload (non-sensitive):', { 
        id: (decoded as any)?.id, 
        role: (decoded as any)?.role,
        exp: (decoded as any)?.exp 
      });
    }

    // Test super admin login
    const superAdminResponse = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.TEST_SUPERADMIN_EMAIL || 'superadmin@example.com',
        password: process.env.TEST_SUPERADMIN_PASSWORD || '',
      }),
    });

    const superAdminData = await superAdminResponse.json();
    console.log('\nSuper Admin Login Response:', superAdminData);

    if (superAdminData.token) {
      const decoded = jwt.decode(superAdminData.token);
      // Security: Only log non-sensitive payload fields for debugging
      console.log('Super Admin Token payload (non-sensitive):', { 
        id: (decoded as any)?.id, 
        role: (decoded as any)?.role,
        exp: (decoded as any)?.exp 
      });
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testLogin();
