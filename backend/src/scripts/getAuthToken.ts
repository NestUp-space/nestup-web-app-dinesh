import axios from "axios";

async function getAuthToken() {
  try {
    const response = await axios.post("http://localhost:8080/api/auth/login", {
      email: "superadmin@example.com",
      password: "superadminpassword",
    });
    console.log("Auth Token:", response.data.token);
  } catch (error) {
    console.error("Error fetching auth token:", (error as any).message);
  }
}

getAuthToken();
