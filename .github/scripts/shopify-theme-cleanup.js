const https = require("https");
const { Octokit } = require("@octokit/rest");
const fs = require("fs");

const SHOPIFY_STORE = process.env.SHOPIFY_FLAG_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;
const THEME_NAME = `PR-${PR_NUMBER}`;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const COMMENT_ID = process.env.COMMENT_ID;

const octokit = new Octokit({ auth: GITHUB_TOKEN });

function shopifyApiRequest(endpoint, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      port: 443,
      path: `/admin/api/2023-04/${endpoint}`,
      method: method,
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : null);
        } else {
          reject(
            new Error(`Request failed with status code ${res.statusCode}`)
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function getExistingTheme() {
  const { themes } = await shopifyApiRequest("themes.json");
  return themes.find(
    (theme) => theme.name === THEME_NAME && theme.role === "unpublished"
  );
}

async function deleteTheme(themeId) {
  await shopifyApiRequest(`themes/${themeId}.json`, "DELETE");
}

async function deleteComment(commentId) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  await octokit.issues.deleteComment({
    owner,
    repo,
    comment_id: commentId,
  });
}

async function addComment(body) {
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: PR_NUMBER,
    body: body,
  });
}

async function main() {
  try {
    const existingTheme = await getExistingTheme();
    let removalMessage = "";

    if (existingTheme) {
      console.log(`Deleting theme: ${existingTheme.id}`);
      await deleteTheme(existingTheme.id);
      removalMessage = `Theme "${THEME_NAME}" (ID: ${existingTheme.id}) has been successfully removed.`;
      console.log(removalMessage);
    } else {
      removalMessage = `No theme found for PR-${PR_NUMBER}`;
      console.log(removalMessage);
    }

    if (
      process.env.GITHUB_EVENT_NAME === "issue_comment" &&
      process.env.GITHUB_EVENT_ACTION === "created"
    ) {
      const eventPath = process.env.GITHUB_EVENT_PATH;
      const eventData = JSON.parse(fs.readFileSync(eventPath, "utf8"));
      const commentBody = eventData.comment.body;

      if (commentBody === "!remove") {
        await deleteComment(COMMENT_ID);
        console.log("Removed the !remove comment");

        await addComment(removalMessage);
        console.log("Added removal confirmation comment");
      }
    } else if (
      process.env.GITHUB_EVENT_NAME === "pull_request" &&
      process.env.GITHUB_EVENT_ACTION === "closed"
    ) {
      await addComment(`Pull request was closed. ${removalMessage}`);
      console.log("Added removal confirmation comment for closed PR");
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
