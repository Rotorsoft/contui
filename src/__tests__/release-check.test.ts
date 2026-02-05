import { fetchLatestVersion, isNewerVersion } from "../hooks/useReleaseCheck.js";

describe("Release check", () => {
  describe("isNewerVersion", () => {
    it("should detect newer semantic versions", () => {
      expect(isNewerVersion("1.0.0", "1.0.1")).toBe(true);
      expect(isNewerVersion("1.2.3", "2.0.0")).toBe(true);
      expect(isNewerVersion("1.2.3", "1.2.3")).toBe(false);
      expect(isNewerVersion("2.0.0", "1.9.9")).toBe(false);
    });

    it("should return false for non-numeric versions", () => {
      expect(isNewerVersion("unknown", "1.0.0")).toBe(false);
      expect(isNewerVersion("1.0.0", "latest")).toBe(false);
    });
  });

  describe("fetchLatestVersion", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = async () => ({ ok: false, status: 500 }) as Response;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("should return the latest version from npm", async () => {
      global.fetch = async () =>
        ({
          ok: true,
          json: async () => ({ version: "1.2.3" }),
        }) as Response;

      await expect(fetchLatestVersion("@rotorsoft/contui")).resolves.toBe("1.2.3");
    });

    it("should throw when the response is not ok", async () => {
      global.fetch = async () => ({ ok: false, status: 500 }) as Response;

      await expect(fetchLatestVersion("@rotorsoft/contui")).rejects.toThrow("Failed to fetch latest version");
    });
  });
});
