/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from "@actions/core";
import * as main from "../src/main";

// Mock the action's main function
const runMock = jest.spyOn(main, "run");

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>;
let infoMock: jest.SpiedFunction<typeof core.info>;
let getInputMock: jest.SpiedFunction<typeof core.getInput>;
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;

jest.mock("@actions/github", () => ({
  context: {
    eventName: "push",
    payload: {
      before: "base",
      after: "head",
    },
    repo: {
      owner: "owner",
      repo: "repo",
    },
  },
  getOctokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        compareCommits: jest.fn().mockResolvedValue({
          status: 200,
          data: {
            status: "ahead",
            files: [
              {
                filename: "apps/wellspring/file1.ts",
              },
              {
                filename: "apps/wellspring/file2.ts",
              },
            ],
          },
        }),
      },
    },
  })),
}));

describe("action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    debugMock = jest.spyOn(core, "debug").mockImplementation();
    infoMock = jest.spyOn(core, "info").mockImplementation();
    getInputMock = jest.spyOn(core, "getInput").mockImplementation();
    setFailedMock = jest.spyOn(core, "setFailed").mockImplementation();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("during a code freeze", () => {
    beforeEach(() => {
      jest.useFakeTimers({ now: new Date("2021-01-05T00:00:00Z") });
    });
    describe("with allowed-paths not set", () => {
      it("fails", async () => {
        getInputMock.mockImplementation((name) => {
          switch (name) {
            case "codefreeze-begin":
              return "2021-01-01T00:00:00Z";
            case "codefreeze-end":
              return "2021-01-10T00:00:00Z";
            default:
              return "";
          }
        });

        await main.run();
        expect(runMock).toHaveReturned();
        expect(setFailedMock).toHaveBeenNthCalledWith(
          1,
          "Code freeze is in effect for all files."
        );
      });
    });

    describe("with allowed-paths set", () => {
      describe("when changes are within allowed paths", () => {
        it("succeeds", async () => {
          getInputMock.mockImplementation((name) => {
            switch (name) {
              case "token":
                return "token";
              case "codefreeze-begin":
                return "2021-01-01T00:00:00Z";
              case "codefreeze-end":
                return "2021-01-10T00:00:00Z";
              case "allowed-paths":
                return "apps/wellspring";
              default:
                return "";
            }
          });
          await main.run();
          expect(runMock).toHaveReturned();
          expect(infoMock).toHaveBeenNthCalledWith(1, "Base commit: base");
          expect(infoMock).toHaveBeenNthCalledWith(2, "Head commit: head");
          expect(debugMock).toHaveBeenNthCalledWith(
            4,
            "Checking file: apps/wellspring/file1.ts"
          );
        });
      });
      describe("when changes are not within allowed paths", () => {
        it("fails", async () => {
          getInputMock.mockImplementation((name) => {
            switch (name) {
              case "token":
                return "token";
              case "codefreeze-begin":
                return "2021-01-01T00:00:00Z";
              case "codefreeze-end":
                return "2021-01-10T00:00:00Z";
              case "allowed-paths":
                return "apps/concierge";
              default:
                return "";
            }
          });
          await main.run();
          expect(runMock).toHaveReturned();
          expect(infoMock).toHaveBeenNthCalledWith(1, "Base commit: base");
          expect(infoMock).toHaveBeenNthCalledWith(2, "Head commit: head");
          expect(debugMock).toHaveBeenNthCalledWith(
            4,
            "Checking file: apps/wellspring/file1.ts"
          );
          expect(setFailedMock).toHaveBeenNthCalledWith(
            1,
            `The file apps/wellspring/file1.ts is not allowed to be changed during a code freeze.`
          );
        });
      });
    });
  });

  describe("not during a code freeze", () => {
    it("succeeds", async () => {
      getInputMock.mockImplementation((name) => {
        switch (name) {
          case "codefreeze-begin":
            return "2021-01-01T00:00:00Z";
          case "codefreeze-end":
            return "2021-01-10T00:00:00Z";
          default:
            return "";
        }
      });

      await main.run();
      expect(runMock).toHaveReturned();
      expect(infoMock).toHaveBeenNthCalledWith(
        1,
        "Code freeze is not in effect."
      );
    });
  });
});
