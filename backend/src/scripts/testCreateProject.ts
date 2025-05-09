import fetch from 'node-fetch';

async function testCreateProject() {
  try {
    // First, login to get a token
    const loginResponse = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'surya8352@gmail.com',
        password: '1234test'
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);

    if (!loginData.token) {
      console.error('Failed to login. Cannot proceed with project creation test.');
      return;
    }

    const token = loginData.token;
    const userId = loginData.user.id;

    console.log('Successfully logged in. User ID:', userId);

    // Now create a project with the token and user ID
    const projectData = {
      name: 'Test Project',
      description: 'A test project created via script',
      address: '123 Test Street',
      location: 'Test Location',
      sqft: 1000,
      estimatedTime: new Date().toISOString(),
      vbCount: 5,
      createdById: userId, // Include the user ID as createdById
      // Add any other required fields
      statusId: 1, // Default status ID
      engineerId: null,
      clientId: null,
    };

    console.log('Sending project creation request with data:', projectData);

    const createProjectResponse = await fetch('http://127.0.0.1:5001/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(projectData),
    });

    const responseStatus = createProjectResponse.status;
    const responseData = await createProjectResponse.json();
    
    console.log('Project Creation Response Status:', responseStatus);
    console.log('Project Creation Response:', responseData);

    if (responseStatus === 201 || responseStatus === 200) {
      console.log('✅ SUCCESS: Project created successfully!');
    } else {
      console.log('❌ FAILURE: Project creation failed.');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testCreateProject();
