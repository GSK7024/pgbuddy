import fetch from "node-fetch";

const url = "https://backend.aisensy.com/campaign/t1/api/v2";
const payload = {
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YmNkZTIwM2QzM2IxMGRlNTZmNjc3NyIsIm5hbWUiOiJwZ19idWRkeSIsImFwcE5hbWUiOiJBaVNlbnN5IiwiY2xpZW50SWQiOiI2OWJjZGUyMDNkMzNiMTBkZTU2ZjY3NzIiLCJhY3RpdmVQbGFuIjoiRlJFRV9GT1JFVkVSIiwiaWF0IjoxNzczOTg1MzEyfQ.6SFBZbugZBmqBExJSRa_NcoUW0u0OxNbTTNqeaFPE1g",
  campaignName: "pg_announcement",
  destination: "917743843389",
  userName: "Test User",
  templateParams: ["Test Setup", "This is a direct API test announcement", "PG Buddy Config"],
};

console.log("Sending payload:", JSON.stringify(payload, null, 2));

try {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  const text = await resp.text();
  console.log("Response Status:", resp.status);
  console.log("Response Text:", text);
} catch (error) {
  console.error("Fetch Error:", error);
}
