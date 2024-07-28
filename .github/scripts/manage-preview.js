// .github/scripts/manage-preview.js

const fs = require("fs");
const { execSync } = require("child_process");
const https = require("https");

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;
const EVENT_NAME = process.env.EVENT_NAME;
const PR_ACTION = process.env.PR_ACTION;
const COMMENT_BODY = process.env.COMMENT_BODY;
const THEME_NAME = `PR-${PR_NUMBER}`;

function shopifyApiRequest(endpoint, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SHOPIFY_STORE,
      path: `/admin/api/2024-07/${endpoint}`,
      method: method,
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(
            new Error(
              `Shopify API request failed: ${res.statusCode} ${res.statusMessage}`
            )
          );
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getExistingTheme() {
  const { themes } = await shopifyApiRequest("themes.json");
  return themes.find(
    (theme) => theme.name === THEME_NAME && theme.role === "unpublished"
  );
}

async function createOrUpdateTheme() {
  const existingTheme = await getExistingTheme();
  if (existingTheme) {
    console.log(`Updating existing unpublished theme: ${existingTheme.id}`);
    return shopifyApiRequest(`themes/${existingTheme.id}.json`, "PUT", {
      theme: { id: existingTheme.id },
    });
  } else {
    console.log(`Creating new unpublished theme: ${THEME_NAME}`);
    return shopifyApiRequest("themes.json", "POST", {
      theme: { name: THEME_NAME, role: "unpublished" },
    });
  }
}

async function deleteTheme(themeId) {
  await shopifyApiRequest(`themes/${themeId}.json`, "DELETE");
}

function checkRelevantChanges() {
  try {
    execSync("git fetch origin main:main");
    const mergeBase = execSync("git merge-base HEAD main").toString().trim();
    const diffOutput = execSync(
      `git diff --name-only ${mergeBase} HEAD`
    ).toString();
    const relevantPaths = [
      "assets/",
      "config/",
      "layout/",
      "locales/",
      "sections/",
      "snippets/",
      "templates/",
      "src/",
      "tailwind.config.js",
    ];
    return diffOutput
      .split("\n")
      .some((file) => relevantPaths.some((path) => file.startsWith(path)));
  } catch (error) {
    console.error("Error checking for relevant changes:", error);
    return true;
  }
}

function isPROpen() {
  if (EVENT_NAME === "pull_request" && PR_ACTION === "closed") {
    return false;
  }
  if (EVENT_NAME === "issue_comment") {
    const prData = JSON.parse(
      execSync(
        `curl -H "Authorization: token ${process.env.GITHUB_TOKEN}" https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${PR_NUMBER}`
      ).toString()
    );
    return prData.state === "open";
  }
  return true;
}

async function managePreview() {
  const existingTheme = await getExistingTheme();
  const isOpen = isPROpen();

  if (EVENT_NAME === "issue_comment" && COMMENT_BODY.includes("!preview")) {
    if (!isOpen) {
      return "This PR is closed. A preview cannot be created for a closed PR.";
    }
    if (existingTheme) {
      return "A preview for this pull request already exists. It will be automatically updated when new changes are pushed.";
    }
    if (!checkRelevantChanges()) {
      return "No relevant theme changes detected. A preview will not be created.";
    }
    const { theme } = await createOrUpdateTheme();
    return `Preview created:\nPreview URL: https://${SHOPIFY_STORE}?preview_theme_id=${theme.id}\nEditor URL: https://${SHOPIFY_STORE}/admin/themes/${theme.id}/editor`;
  }

  if (EVENT_NAME === "issue_comment" && COMMENT_BODY.includes("!remove")) {
    if (existingTheme) {
      await deleteTheme(existingTheme.id);
      return "The preview theme has been removed.";
    }
    return "No preview theme found to remove.";
  }

  if (
    EVENT_NAME === "pull_request" &&
    PR_ACTION === "closed" &&
    existingTheme
  ) {
    await deleteTheme(existingTheme.id);
    return "The PR has been closed. The preview theme has been removed.";
  }

  if (
    EVENT_NAME === "pull_request" &&
    ["opened", "synchronize", "reopened"].includes(PR_ACTION)
  ) {
    if (existingTheme && checkRelevantChanges()) {
      const { theme } = await createOrUpdateTheme();
      return `Preview updated:\nPreview URL: https://${SHOPIFY_STORE}?preview_theme_id=${theme.id}\nEditor URL: https://${SHOPIFY_STORE}/admin/themes/${theme.id}/editor`;
    }
  }

  return null;
}

async function main() {
  try {
    const comment = await managePreview();
    if (comment) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `comment_body=${comment}\n`);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
