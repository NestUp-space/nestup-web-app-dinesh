import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

async function testLogin() {
  try {
    // Test admin login
    const adminResponse = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'adminpassword'
      }),
    });

    const adminData = await adminResponse.json();
    console.log('Admin Login Response:', adminData);

    if (adminData.token) {
      const decoded = jwt.decode(adminData.token);
      console.log('Decoded Admin Token:', decoded);
    }

    // Test super admin login
    const superAdminResponse = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@example.com',
        password: 'superadminpassword'
      }),
    });

    const superAdminData = await superAdminResponse.json();
    console.log('\nSuper Admin Login Response:', superAdminData);

    if (superAdminData.token) {
      const decoded = jwt.decode(superAdminData.token);
      console.log('Decoded Super Admin Token:', decoded);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testLogin();
