import axios from "axios";

/**
 * WARNING: This script is for LOCAL DEVELOPMENT ONLY.
 * Never run in production or with production credentials.
 * The token is logged for debugging purposes only.
 */
async function getAuthToken() {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: This script should not be run in production!');
    process.exit(1);
  }

  try {
    const response = await axios.post("http://localhost:8080/api/auth/login", {
      email: process.env.TEST_SUPERADMIN_EMAIL || "superadmin@example.com",
      password: process.env.TEST_SUPERADMIN_PASSWORD || "",
    });
    // Note: Token logging is intentional for local debugging
    // This script should NEVER be used with production credentials
    console.log("Auth Token:", response.data.token);
  } catch (error) {
    console.error("Error fetching auth token:", (error as any).message);
  }
}

getAuthToken();
