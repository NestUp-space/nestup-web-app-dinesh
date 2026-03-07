import axios from "axios";

/**
 * WARNING: This script is for LOCAL DEVELOPMENT ONLY.
 * Never run in production or with production credentials.
 */
async function testGetUsersByRoleEndpoint() {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: This script should not be run in production!');
    process.exit(1);
  }

  try {
    // Get auth token
    const loginResponse = await axios.post("http://localhost:5001/api/auth/login", {
      email: process.env.TEST_USER_EMAIL || "",
      password: process.env.TEST_USER_PASSWORD || "",
    });
    
    const token = loginResponse.data.token;
    // Security: Don't log full token, just confirm it was received
    console.log("Auth token obtained: [RECEIVED - length:", token?.length || 0, "]");

    // Test client role
    const clientResponse = await axios.get("http://localhost:5001/api/users/by-role?roleName=client", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Response from /api/users/by-role?roleName=client:", clientResponse.data);

    // Test engineer role
    const engineerResponse = await axios.get("http://localhost:5001/api/users/by-role?roleName=engineer", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Response from /api/users/by-role?roleName=engineer:", engineerResponse.data);
  } catch (error) {
    console.error("Error testing endpoint:", (error as any).message);
    if ((error as any).response) {
      console.error("Response data:", (error as any).response.data);
      console.error("Response status:", (error as any).response.status);
    }
  }
}

testGetUsersByRoleEndpoint();
