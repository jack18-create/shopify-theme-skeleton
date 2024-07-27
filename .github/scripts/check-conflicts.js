// .github/scripts/check-conflicts.js

const { execSync } = require("child_process");
const fs = require("fs");

const PR_NUMBER = process.env.PR_NUMBER;

function checkConflicts() {
  try {
    // Fetch the latest main branch
    execSync("git fetch origin main:main");

    // Get the merge base
    const mergeBase = execSync("git merge-base HEAD main").toString().trim();

    // Check for conflicts using diff
    const diffOutput = execSync(
      `git diff --name-only --diff-filter=U ${mergeBase} HEAD`
    ).toString();

    // If there's any output, there are conflicts
    return diffOutput.trim().length > 0;
  } catch (error) {
    console.error("Error checking for conflicts:", error);
    return true; // Assume conflicts on error
  }
}

function checkRelevantChanges() {
  try {
    // Fetch the latest main branch
    execSync("git fetch origin main:main");

    // Get the merge base
    const mergeBase = execSync("git merge-base HEAD main").toString().trim();

    // Check for changes in relevant directories and files
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
      "tailwind.config.js",
      "theme.liquid",
    ];

    const changedFiles = diffOutput
      .split("\n")
      .filter((file) => file.trim() !== "");
    const hasRelevantChanges = changedFiles.some((file) =>
      relevantPaths.some((path) => file.startsWith(path))
    );

    return hasRelevantChanges;
  } catch (error) {
    console.error("Error checking for relevant changes:", error);
    return true; // Assume changes on error to be safe
  }
}

function main() {
  const hasConflicts = checkConflicts();
  const hasRelevantChanges = checkRelevantChanges();

  // Set the outputs for the GitHub Action
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `has_conflicts=${hasConflicts}\n`
    );
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `has_relevant_changes=${hasRelevantChanges}\n`
    );
  }

  console.log(`Conflicts detected: ${hasConflicts}`);
  console.log(`Relevant changes detected: ${hasRelevantChanges}`);

  if (hasConflicts) {
    console.log("Please resolve conflicts before creating a preview.");
    process.exit(1);
  }

  if (!hasRelevantChanges) {
    console.log("No relevant changes detected. Skipping preview creation.");
    process.exit(0);
  }
}

main();
