// .github/scripts/shopify-theme-preview.js

const { execSync } = require("child_process");
const fs = require("fs");

const SHOPIFY_STORE = process.env.SHOPIFY_FLAG_STORE;
const PR_NUMBER = process.env.PR_NUMBER;
const THEME_NAME = `PR-${PR_NUMBER}`;

function runShopifyCommand(command) {
  try {
    return JSON.parse(execSync(`shopify ${command}`, { encoding: "utf8" }));
  } catch (error) {
    console.error(`Error running command: shopify ${command}`);
    console.error(error.message);
    return { error: error.message };
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

  if (themeInfo.error) {
    throw new Error(
      `Failed to ${existingTheme ? "update" : "create"} theme: ${
        themeInfo.error
      }`
    );
  }

  return themeInfo;
}

function main() {
  try {
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
