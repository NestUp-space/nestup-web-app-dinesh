import axios from "axios";

async function testGetUsersByRoleEndpoint() {
  try {
    // Get auth token
    const loginResponse = await axios.post("http://localhost:5001/api/auth/login", {
      email: "surya8352@gmail.com",
      password: "1234test"
    });
    
    const token = loginResponse.data.token;
    console.log("Auth token obtained:", token);

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
