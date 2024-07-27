// .github/scripts/shopify-theme-preview.js

const https = require("https");
const fs = require("fs");

const SHOPIFY_STORE = process.env.SHOPIFY_FLAG_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
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

function appendToOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  } else {
    console.log(`${key}=${value}`);
  }
}

async function main() {
  try {
    console.log(`SHOPIFY_STORE: ${SHOPIFY_STORE}`);
    console.log(`PR_NUMBER: ${PR_NUMBER}`);
    console.log(`THEME_NAME: ${THEME_NAME}`);

    const { theme } = await createOrUpdateTheme();
    const previewUrl = `https://${SHOPIFY_STORE}?preview_theme_id=${theme.id}`;
    const editorUrl = `https://${SHOPIFY_STORE}/admin/themes/${theme.id}/editor`;

    console.log(`Theme ID: ${theme.id}`);
    console.log(`Preview URL: ${previewUrl}`);
    console.log(`Editor URL: ${editorUrl}`);

    appendToOutput("preview_url", previewUrl);
    appendToOutput("editor_url", editorUrl);
    appendToOutput("theme_id", theme.id);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
