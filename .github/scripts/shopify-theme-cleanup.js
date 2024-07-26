// .github/scripts/shopify-theme-cleanup.js

const { execSync } = require("child_process");

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

function removePreviewTheme() {
  const themeList = runShopifyCommand("theme list --json");
  const previewTheme = themeList.find(
    (theme) => theme.name === THEME_NAME && theme.role === "unpublished"
  );

  if (previewTheme) {
    console.log(`Deleting unpublished preview theme for PR #${PR_NUMBER}`);
    const deleteResult = runShopifyCommand(
      `theme delete --theme ${previewTheme.id} -f`
    );
    if (deleteResult.error) {
      throw new Error(`Failed to delete theme: ${deleteResult.error}`);
    }
  } else {
    console.log(`No unpublished preview theme found for PR #${PR_NUMBER}`);
  }
}

function main() {
  try {
    removePreviewTheme();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
