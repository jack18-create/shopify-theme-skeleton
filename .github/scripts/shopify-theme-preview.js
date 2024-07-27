const { execSync } = require("child_process");
const fs = require("fs");

const SHOPIFY_STORE = process.env.SHOPIFY_FLAG_STORE;
const PR_NUMBER = process.env.PR_NUMBER;
const THEME_NAME = `PR-${PR_NUMBER}`;

function checkEnvironmentVariables() {
  const requiredVars = [
    "SHOPIFY_FLAG_STORE",
    "PR_NUMBER",
    "GITHUB_OUTPUT",
    "SHOPIFY_ACCESS_TOKEN",
  ];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }
}

function runShopifyCommand(command) {
  try {
    const fullCommand = `SHOPIFY_ACCESS_TOKEN=${process.env.SHOPIFY_ACCESS_TOKEN} SHOPIFY_FLAG_STORE=${process.env.SHOPIFY_FLAG_STORE} shopify ${command}`;
    const output = execSync(fullCommand, { encoding: "utf8" });
    return JSON.parse(output);
  } catch (error) {
    console.error(`Error running command: ${command}`);
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

function appendToOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  } else {
    console.log(`${key}=${value}`);
  }
}

function main() {
  try {
    console.log(`SHOPIFY_STORE: ${SHOPIFY_STORE}`);
    console.log(`PR_NUMBER: ${PR_NUMBER}`);
    console.log(`THEME_NAME: ${THEME_NAME}`);

    checkEnvironmentVariables();

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
    appendToOutput("preview_url", previewUrl);
    appendToOutput("editor_url", editorUrl);
    appendToOutput("theme_id", themeInfo.theme.id);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
