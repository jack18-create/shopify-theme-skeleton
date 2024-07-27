// .github/scripts/check-theme-status.js

const { Octokit } = require("octokit");
const fs = require("fs");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issue_number = parseInt(process.env.PR_NUMBER);

async function checkThemeStatus() {
  try {
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number,
    });

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
