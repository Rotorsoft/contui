import { render } from "ink-testing-library";
import { ContainersView } from "../components/ContainersView.js";
import { ImagesView } from "../components/ImagesView.js";
import { NetworksView } from "../components/NetworksView.js";
import { VolumesView } from "../components/VolumesView.js";
import type { Container, Image, Network, Volume } from "../types/index.js";

function makeContainer(name: string): Container {
  return {
    id: name,
    name,
    image: "nginx:latest",
    status: "running",
    state: "running",
    ports: [],
    created: "2024-01-01",
  };
}

function makeImage(repository: string): Image {
  return {
    id: repository,
    repository,
    tag: "latest",
    size: "100MB",
    created: "2024-01-01",
    reference: `${repository}:latest`,
  };
}

function makeNetwork(name: string): Network {
  return { id: name, name, driver: "bridge", scope: "local" };
}

function makeVolume(name: string): Volume {
  return { name, driver: "local", mountpoint: `/var/${name}`, scope: "local" };
}

describe("List sorting", () => {
  it("sorts containers alphabetically by name", () => {
    const containers = [makeContainer("zebra"), makeContainer("alpha"), makeContainer("mango")];
    const { lastFrame } = render(
      <ContainersView containers={containers} selectedIndex={0} searchQuery="" />
    );
    const frame = lastFrame() ?? "";
    const alphaIdx = frame.indexOf("alpha");
    const mangoIdx = frame.indexOf("mango");
    const zebraIdx = frame.indexOf("zebra");
    expect(alphaIdx).toBeLessThan(mangoIdx);
    expect(mangoIdx).toBeLessThan(zebraIdx);
  });

  it("sorts images alphabetically by repository", () => {
    const images = [makeImage("zookeeper"), makeImage("alpine"), makeImage("nginx")];
    const { lastFrame } = render(
      <ImagesView images={images} selectedIndex={0} searchQuery="" />
    );
    const frame = lastFrame() ?? "";
    const alpineIdx = frame.indexOf("alpine");
    const nginxIdx = frame.indexOf("nginx");
    const zookeeperIdx = frame.indexOf("zookeeper");
    expect(alpineIdx).toBeLessThan(nginxIdx);
    expect(nginxIdx).toBeLessThan(zookeeperIdx);
  });

  it("sorts networks alphabetically by name", () => {
    const networks = [makeNetwork("zoo-net"), makeNetwork("app-net"), makeNetwork("db-net")];
    const { lastFrame } = render(
      <NetworksView networks={networks} selectedIndex={0} searchQuery="" />
    );
    const frame = lastFrame() ?? "";
    const appIdx = frame.indexOf("app-net");
    const dbIdx = frame.indexOf("db-net");
    const zooIdx = frame.indexOf("zoo-net");
    expect(appIdx).toBeLessThan(dbIdx);
    expect(dbIdx).toBeLessThan(zooIdx);
  });

  it("sorts volumes alphabetically by name", () => {
    const volumes = [makeVolume("z-vol"), makeVolume("a-vol"), makeVolume("m-vol")];
    const { lastFrame } = render(
      <VolumesView volumes={volumes} selectedIndex={0} searchQuery="" />
    );
    const frame = lastFrame() ?? "";
    const aIdx = frame.indexOf("a-vol");
    const mIdx = frame.indexOf("m-vol");
    const zIdx = frame.indexOf("z-vol");
    expect(aIdx).toBeLessThan(mIdx);
    expect(mIdx).toBeLessThan(zIdx);
  });

  it("sorts containers after filtering", () => {
    const containers = [makeContainer("zebra-app"), makeContainer("alpha-app"), makeContainer("no-match")];
    const { lastFrame } = render(
      <ContainersView containers={containers} selectedIndex={0} searchQuery="app" />
    );
    const frame = lastFrame() ?? "";
    expect(frame).not.toContain("no-match");
    const alphaIdx = frame.indexOf("alpha-app");
    const zebraIdx = frame.indexOf("zebra-app");
    expect(alphaIdx).toBeLessThan(zebraIdx);
  });
});
