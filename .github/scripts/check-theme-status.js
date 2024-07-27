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
    // Check if the pull request is open
    const prOptions = {
      hostname: "api.github.com",
      path: `/repos/${owner}/${repo}/pulls/${issue_number}`,
      method: "GET",
      headers: {
        "User-Agent": "Node.js",
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    };

    const prData = await makeRequest(prOptions);
    if (prData.state !== "open") {
      console.log("Pull request is not open. Preview creation disabled.");
      return false;
    }

    // Check comments for !remove and !preview
    const commentsOptions = {
      hostname: "api.github.com",
      path: `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
      method: "GET",
      headers: {
        "User-Agent": "Node.js",
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    };

    const comments = await makeRequest(commentsOptions);

    const removeComment = comments
      .reverse()
      .find((comment) => comment.body.includes("!remove"));
    const previewComment = comments
      .reverse()
      .find((comment) => comment.body.includes("!preview"));

    const shouldCreatePreview =
      !removeComment ||
      (previewComment &&
        new Date(previewComment.created_at) >
          new Date(removeComment.created_at));

    // Check if a preview theme already exists
    const themesOptions = {
      hostname: process.env.SHOPIFY_FLAG_STORE,
      path: "/admin/api/2024-07/themes.json",
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    };

    const { themes } = await makeRequest(themesOptions);
    const existingTheme = themes.find(
      (theme) =>
        theme.name === `PR-${issue_number}` && theme.role === "unpublished"
    );

    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `should_create_preview=${shouldCreatePreview}\n`
      );
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `existing_theme_id=${existingTheme ? existingTheme.id : ""}\n`
      );
    }

    console.log(`Should create preview: ${shouldCreatePreview}`);
    console.log(
      `Existing theme ID: ${existingTheme ? existingTheme.id : "None"}`
    );
    return shouldCreatePreview;
  } catch (error) {
    console.error("Error checking theme status:", error);
    return false;
  }
}

checkThemeStatus();
