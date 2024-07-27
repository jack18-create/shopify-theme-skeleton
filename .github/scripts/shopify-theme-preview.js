const { execSync } = require("child_process");
const fs = require("fs");

const SHOPIFY_STORE = process.env.SHOPIFY_FLAG_STORE;
const PR_NUMBER = process.env.PR_NUMBER;
const THEME_NAME = `PR-${PR_NUMBER}`;

function checkEnvironmentVariables() {
  const requiredVars = ["SHOPIFY_FLAG_STORE", "PR_NUMBER", "GITHUB_OUTPUT"];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }
}

function authenticateShopifyCLI() {
  try {
    execSync(`shopify auth login --store ${SHOPIFY_STORE}`, {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Failed to authenticate Shopify CLI");
    throw error;
  }
}

function runShopifyCommand(command) {
  try {
    const output = execSync(`shopify ${command}`, { encoding: "utf8" });
    return JSON.parse(output);
  } catch (error) {
    console.error(`Error running command: shopify ${command}`);
    console.error(error.message);
    throw error;
  }
}

function getExistingTheme() {
  const themeList = runShopifyCommand("theme list --json");
  return themeList.find(
    (theme) => theme.name === THEME_NAME && theme.role === "unpublished"
  );
}

function createOrUpdateTheme() {
  const existingTheme = getExistingTheme();

  let themeInfo;
  if (existingTheme) {
    console.log(`Updating existing unpublished theme: ${existingTheme.id}`);
    themeInfo = runShopifyCommand(
      `theme push --theme ${existingTheme.id} --json`
    );
  } else {
    console.log(`Creating new unpublished theme: ${THEME_NAME}`);
    themeInfo = runShopifyCommand(
      `theme push --unpublished --json --theme "${THEME_NAME}"`
    );
  }

  return themeInfo;
}

function main() {
  try {
    console.log(`SHOPIFY_STORE: ${SHOPIFY_STORE}`);
    console.log(`PR_NUMBER: ${PR_NUMBER}`);
    console.log(`THEME_NAME: ${THEME_NAME}`);

    checkEnvironmentVariables();
    authenticateShopifyCLI();

    const themeInfo = createOrUpdateTheme();
    const previewUrl =
      themeInfo.theme.preview_url ||
      `https://${SHOPIFY_STORE}/admin/themes/${themeInfo.theme.id}/editor`;
    const editorUrl =
      themeInfo.theme.editor_url ||
      `https://${SHOPIFY_STORE}/admin/themes/${themeInfo.theme.id}/editor`;

    console.log(`Theme ID: ${themeInfo.theme.id}`);
    console.log(`Preview URL: ${previewUrl}`);
    console.log(`Editor URL: ${editorUrl}`);

    // Set output for GitHub Actions
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `preview_url=${previewUrl}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `editor_url=${editorUrl}\n`);
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `theme_id=${themeInfo.theme.id}\n`
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
