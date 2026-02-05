import { render } from "ink-testing-library";
import { StatusBar } from "../components/StatusBar.js";
import type { ReleaseCheckState } from "../hooks/useReleaseCheck.js";

describe("StatusBar", () => {
  it("shows update available message in the status area", () => {
    const releaseStatus: ReleaseCheckState = {
      status: "update-available",
      latestVersion: "2.0.0",
    };

    const { lastFrame } = render(
      <StatusBar
        activeTab="containers"
        itemCount={3}
        releaseStatus={releaseStatus}
      />
    );

    expect(lastFrame()).toContain("Update available: v2.0.0");
  });

  it("shows controls when no release message is provided", () => {
    const { lastFrame } = render(
      <StatusBar
        activeTab="images"
        itemCount={1}
      />
    );

    expect(lastFrame()).toContain("h/l:tabs");
  });
});
