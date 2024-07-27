// .github/scripts/update-theme-status.js

const https = require("https");

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issue_number = parseInt(process.env.PR_NUMBER);

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => resolve(responseData));
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function updateThemeStatus() {
  try {
    const options = {
      hostname: "api.github.com",
      path: `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
      method: "POST",
      headers: {
        "User-Agent": "Node.js",
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
    };

    const data = JSON.stringify({
      body: "Preview theme has been removed. Use !preview to create a new one.",
    });

    await makeRequest(options, data);
    console.log("Theme status updated successfully.");
  } catch (error) {
    console.error("Error updating theme status:", error);
  }
}

updateThemeStatus();
