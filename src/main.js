const core = require("@actions/core");
const dateFns = require("date-fns");
const github = require("@actions/github");
const { some } = require("lodash");

async function codefreeze() {
  try {
    const start = core.getInput("codefreeze-begin", { required: true });
    const end = core.getInput("codefreeze-end", { required: true });

    const now = new Date();

    if (
      dateFns.isWithinInterval(now, {
        start,
        end,
      })
    ) {
      const allowedPaths = core.getInput("allowed-paths");
      core.info(`Allowed paths: ${allowedPaths}`);
      // If no apps are specified, just short circuit here and throw an error.
      if (!allowedPaths) {
        throw new Error("Code freeze is in effect for all files.");
      }

      const token = core.getInput("token", { required: true });
      const client = github.getOctokit(token);

      const context = github.context;
      // Debug log the payload.
      core.debug(`Payload keys: ${Object.keys(context.payload)}`);

      const eventName = context.eventName;

      // Define the base and head commits to be extracted from the payload.
      let base;
      let head;

      switch (eventName) {
        case "pull_request":
          base = context.payload.pull_request?.base?.sha;
          head = context.payload.pull_request?.head?.sha;
          break;
        case "push":
          base = context.payload.before;
          head = context.payload.after;
          break;
        default:
          core.setFailed(
            `This action only supports pull requests and pushes, ${context.eventName} events are not supported. `
          );
      }

      // Log the base and head commits
      core.info(`Base commit: ${base}`);
      core.info(`Head commit: ${head}`);

      const response = await client.rest.repos.compareCommits({
        base,
        head,
        owner: context.repo.owner,
        repo: context.repo.repo,
      });

      // Ensure that the request was successful.
      if (response.status !== 200) {
        core.setFailed(
          `The GitHub API for comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200. `
        );
      }

      const files = response.data.files;

      for (const file of files) {
        const filename = file.filename;
        const isAllowed = some(allowedPaths, (app) => filename.startsWith(app));

        if (!isAllowed) {
          throw new Error(
            `The file ${filename} is not allowed to be changed during a code freeze.`
          );
        }
      }
    } else {
      console.log("Code freeze is not in effect.");
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

module.exports = { codefreeze };
