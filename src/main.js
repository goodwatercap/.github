const core = require("@actions/core");
const dateFns = require("date-fns");

const codefreeze = async () => {
  try {
    const begin = core.getInput("codefreeze-begin", { required: true });
    const end = core.getInput("codefreeze-end", { required: true });

    const now = new Date();

    if (dateFns.isWithinRange(now, begin, end)) {
      throw new Error("Code freeze is in effect.");
    } else {
      console.log("Code freeze is not in effect.");
    }
  } catch (err) {
    core.setFailed(err.message);
  }
};

module.exports = codefreeze;
