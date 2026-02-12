import { render } from "ink-testing-library";
import { StatusBar, renderAction } from "../components/StatusBar.js";
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

    const frame = lastFrame()?.replace(/\n/g, " ") ?? "";
    expect(frame).toContain("Update available:");
    expect(frame).toContain("v2.0.0");
  });

  it("shows controls when no release message is provided", () => {
    const { lastFrame } = render(
      <StatusBar
        activeTab="images"
        itemCount={1}
      />
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("hjkl:nav");
    expect(frame).toContain("search");
    expect(frame).toContain("quit");
  });

  it("displays action labels with highlighted shortcut for containers tab", () => {
    const { lastFrame } = render(
      <StatusBar
        activeTab="containers"
        itemCount={3}
      />
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("create");
    expect(frame).toContain("edit");
    expect(frame).toContain("start");
    expect(frame).toContain("stop");
    expect(frame).toContain("Restart");
    expect(frame).toContain("delete");
    expect(frame).toContain("Logs");
    expect(frame).toContain("inspect");
    // Should NOT contain old format
    expect(frame).not.toContain("n:run");
    expect(frame).not.toContain("s:start");
  });

  it("displays action labels for images tab", () => {
    const { lastFrame } = render(
      <StatusBar
        activeTab="images"
        itemCount={5}
      />
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("create");
    expect(frame).toContain("pull");
    expect(frame).toContain("delete");
    expect(frame).toContain("inspect");
  });

  it("displays action labels for networks tab", () => {
    const { lastFrame } = render(
      <StatusBar
        activeTab="networks"
        itemCount={2}
      />
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("create");
    expect(frame).toContain("delete");
    expect(frame).toContain("inspect");
  });

  it("displays action labels for volumes tab", () => {
    const { lastFrame } = render(
      <StatusBar
        activeTab="volumes"
        itemCount={1}
      />
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("create");
    expect(frame).toContain("delete");
    expect(frame).toContain("inspect");
  });
});

describe("renderAction", () => {
  it("highlights the shortcut character in a label", () => {
    const { lastFrame } = render(
      renderAction({ key: "c", label: "create" })
    );
    // The rendered output should contain "create" with 'c' highlighted (yellow underline)
    expect(lastFrame()).toContain("reate");
  });

  it("handles mid-word shortcut character", () => {
    const { lastFrame } = render(
      renderAction({ key: "x", label: "exit" })
    );
    expect(lastFrame()).toContain("e");
    expect(lastFrame()).toContain("it");
  });

  it("handles uppercase shortcut character", () => {
    const { lastFrame } = render(
      renderAction({ key: "R", label: "Restart" })
    );
    expect(lastFrame()).toContain("estart");
  });
});
