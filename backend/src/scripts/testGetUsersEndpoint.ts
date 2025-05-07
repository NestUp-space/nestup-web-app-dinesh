import axios from "axios";

async function testGetUsersEndpoint() {
  try {
    const response = await axios.get("http://localhost:8080/api/users", {
      headers: {
        Authorization: "Bearer YOUR_AUTH_TOKEN_HERE",
      },
    });
    console.log("Response from /api/users:", response.data);
  } catch (error) {
    console.error("Error testing /api/users endpoint:", (error as any).message);
  }
}

testGetUsersEndpoint();
