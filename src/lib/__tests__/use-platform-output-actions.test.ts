/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlatformOutputActions } from "@/lib/use-platform-output-actions";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
  }),
}));

import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toastMock = toast as unknown as ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> };

function makeHook(slug = "team-slug", generationId = "gen-1") {
  return renderHook(() => usePlatformOutputActions(slug, generationId));
}

function setupOutput(result: ReturnType<typeof makeHook>["result"], outputId = "out-1", content = "Hello world") {
  act(() => {
    result.current.initOutputState(outputId, content);
  });
}

describe("usePlatformOutputActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    vi.stubGlobal("fetch", vi.fn());
  });

  it("initialises output state with editedContent and savedContent equal to content", () => {
    const { result } = makeHook();
    setupOutput(result, "out-1", "Initial content");

    expect(result.current.outputStates["out-1"]).toEqual({
      editedContent: "Initial content",
      savedContent: "Initial content",
      isSaving: false,
      isRegenerating: false,
    });
  });

  describe("handleSave", () => {
    it("PATCHes platform-output and toasts 'Changes saved' on success", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = makeHook("my-team", "gen-42");
      setupOutput(result, "out-1", "Draft content");

      // Simulate user editing
      act(() => {
        result.current.setEditedContent("out-1", "Edited content");
      });

      await act(async () => {
        await result.current.handleSave("out-1");
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/my-team/platform-outputs/out-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ editedContent: "Edited content" }),
        })
      );
      expect(result.current.outputStates["out-1"].savedContent).toBe("Edited content");
      expect(result.current.outputStates["out-1"].isSaving).toBe(false);
      expect(toastMock).toHaveBeenCalledWith("Changes saved");
    });

    it("toasts error and clears isSaving on save failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
      const { result } = makeHook();
      setupOutput(result, "out-1", "content");

      await act(async () => {
        await result.current.handleSave("out-1");
      });

      expect(result.current.outputStates["out-1"].isSaving).toBe(false);
      expect(toastMock.error).toHaveBeenCalledWith("Failed to save changes");
    });
  });

  describe("handleRegenerate", () => {
    it("POSTs to regenerate endpoint and updates content on success", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "out-1", content: "Regenerated content" }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = makeHook("team-a", "gen-1");
      setupOutput(result, "out-1", "Old content");

      await act(async () => {
        await result.current.handleRegenerate("out-1");
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/team-a/platform-outputs/out-1/regenerate",
        expect.objectContaining({ method: "POST" })
      );
      expect(result.current.outputStates["out-1"].editedContent).toBe("Regenerated content");
      expect(result.current.outputStates["out-1"].savedContent).toBe("Regenerated content");
      expect(result.current.outputStates["out-1"].isRegenerating).toBe(false);
      expect(toastMock).toHaveBeenCalledWith("Content regenerated");
    });

    it("toasts error and clears isRegenerating on failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
      const { result } = makeHook();
      setupOutput(result, "out-1", "content");

      await act(async () => {
        await result.current.handleRegenerate("out-1");
      });

      expect(result.current.outputStates["out-1"].isRegenerating).toBe(false);
      expect(toastMock.error).toHaveBeenCalledWith("Regeneration failed");
    });
  });

  describe("handleCopy", () => {
    it("writes editedContent to clipboard and toasts 'Copied to clipboard'", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("navigator", { clipboard: { writeText } });

      const { result } = makeHook();
      setupOutput(result, "out-1", "Clipboard content");

      await act(async () => {
        await result.current.handleCopy("out-1");
      });

      expect(writeText).toHaveBeenCalledWith("Clipboard content");
      expect(toastMock).toHaveBeenCalledWith("Copied to clipboard");
    });
  });

  describe("handlePublishDateChange", () => {
    it("PATCHes the generation with intendedPublishAt when date is provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);

      const { result } = makeHook("my-team", "gen-99");
      const date = new Date("2025-01-15T10:00:00Z");

      await act(async () => {
        await result.current.handlePublishDateChange(date);
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/my-team/generations/gen-99",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ intendedPublishAt: date.toISOString() }),
        })
      );
    });

    it("does not fetch when no date is provided", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const { result } = makeHook("my-team", "gen-99");

      await act(async () => {
        await result.current.handlePublishDateChange(undefined);
      });

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
