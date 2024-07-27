// .github/scripts/check-theme-status.js

const https = require("https");
const fs = require("fs");

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issue_number = parseInt(process.env.PR_NUMBER);

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.end();
  });
}

async function checkThemeStatus() {
  try {
    const options = {
      hostname: "api.github.com",
      path: `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
      method: "GET",
      headers: {
        "User-Agent": "Node.js",
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    };

    const comments = await makeRequest(options);

    const removedComment = comments
      .reverse()
      .find((comment) =>
        comment.body.includes("Preview theme has been removed")
      );
    const previewComment = comments
      .reverse()
      .find((comment) => comment.body.includes("!preview"));

    const shouldCreatePreview =
      !removedComment ||
      (previewComment &&
        new Date(previewComment.created_at) >
          new Date(removedComment.created_at));

    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `should_create_preview=${shouldCreatePreview}\n`
      );
    }

    console.log(`Should create preview: ${shouldCreatePreview}`);
    return shouldCreatePreview;
  } catch (error) {
    console.error("Error checking theme status:", error);
    return false;
  }
}

checkThemeStatus();
