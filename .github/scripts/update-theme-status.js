// .github/scripts/update-theme-status.js

const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issue_number = parseInt(process.env.PR_NUMBER);

async function updateThemeStatus() {
  try {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number,
      body: "Preview theme has been removed. Use !preview to create a new one.",
    });
    console.log("Theme status updated successfully.");
  } catch (error) {
    console.error("Error updating theme status:", error);
  }
}

updateThemeStatus();
