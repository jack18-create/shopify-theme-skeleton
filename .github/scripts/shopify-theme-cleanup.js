// .github/scripts/shopify-theme-cleanup.js

const https = require("https");

const SHOPIFY_STORE = process.env.SHOPIFY_FLAG_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_CLI_THEME_TOKEN;
const PR_NUMBER = process.env.PR_NUMBER;
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

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data ? JSON.parse(data) : {});
        } else {
          reject(
            new Error(
              `Shopify API request failed: ${res.statusCode} ${res.statusMessage}`
            )
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

async function getThemeList() {
  const { themes } = await shopifyApiRequest("themes.json");
  return themes;
}

async function deleteTheme(themeId) {
  await shopifyApiRequest(`themes/${themeId}.json`, "DELETE");
}

async function removePreviewTheme() {
  const themeList = await getThemeList();
  const previewTheme = themeList.find(
    (theme) => theme.name === THEME_NAME && theme.role === "unpublished"
  );

  if (previewTheme) {
    console.log(`Deleting unpublished preview theme for PR #${PR_NUMBER}`);
    await deleteTheme(previewTheme.id);
    console.log(`Successfully deleted theme ${previewTheme.id}`);
    return true;
  } else {
    console.log(`No unpublished preview theme found for PR #${PR_NUMBER}`);
    return false;
  }
}

async function main() {
  try {
    const removed = await removePreviewTheme();
    if (removed) {
      console.log("Preview theme removed successfully.");
    } else {
      console.log("No preview theme to remove.");
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
