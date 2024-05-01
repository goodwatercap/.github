const core = require("@actions/core");
const dateFns = require("date-fns");

async function codefreeze() {
  try {
    const start = core.getInput("codefreeze-begin", { required: true });
    const end = core.getInput("codefreeze-end", { required: true });
    const allowedApps = core.getInput("allowed-apps");

    const now = new Date();

    if (
      dateFns.isWithinInterval(now, {
        start,
        end,
      })
    ) {
      throw new Error("Code freeze is in effect.");
    } else {
      console.log("Code freeze is not in effect.");
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

module.exports = { codefreeze };
