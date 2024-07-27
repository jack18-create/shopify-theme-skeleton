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

    const sortedComments = comments.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    const lastRelevantComment = sortedComments.find(
      (comment) =>
        comment.body.includes("!remove") || comment.body.includes("!preview")
    );

    const shouldCreatePreview =
      lastRelevantComment && lastRelevantComment.body.includes("!preview");

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
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `preview_exists=${existingTheme ? "true" : "false"}\n`
      );
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        `last_command=${lastRelevantComment ? lastRelevantComment.body : ""}\n`
      );
    }

    console.log(`Should create preview: ${shouldCreatePreview}`);
    console.log(
      `Existing theme ID: ${existingTheme ? existingTheme.id : "None"}`
    );
    console.log(`Preview exists: ${existingTheme ? "true" : "false"}`);
    console.log(
      `Last command: ${lastRelevantComment ? lastRelevantComment.body : "None"}`
    );

    return shouldCreatePreview;
  } catch (error) {
    console.error("Error checking theme status:", error);
    return false;
  }
}

checkThemeStatus();
