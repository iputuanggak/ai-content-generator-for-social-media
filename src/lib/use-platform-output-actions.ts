import { useState } from "react";
import { toast } from "sonner";

export interface OutputState {
  editedContent: string;
  savedContent: string;
  isSaving: boolean;
  isRegenerating: boolean;
}

export function usePlatformOutputActions(slug: string, generationId: string) {
  const [outputStates, setOutputStates] = useState<Record<string, OutputState>>({});

  function setOutputState(outputId: string, patch: Partial<OutputState>) {
    setOutputStates((prev) => ({
      ...prev,
      [outputId]: { ...prev[outputId], ...patch },
    }));
  }

  function initOutputState(outputId: string, content: string) {
    setOutputStates((prev) => ({
      ...prev,
      [outputId]: {
        editedContent: content,
        savedContent: content,
        isSaving: false,
        isRegenerating: false,
      },
    }));
  }

  function setEditedContent(outputId: string, value: string) {
    setOutputState(outputId, { editedContent: value });
  }

  async function handleSave(outputId: string) {
    const output = outputStates[outputId];
    if (!output) return;

    setOutputState(outputId, { isSaving: true });

    try {
      const res = await fetch(`/api/${slug}/platform-outputs/${outputId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editedContent: output.editedContent }),
      });

      if (res.ok) {
        setOutputStates((prev) => ({
          ...prev,
          [outputId]: {
            ...prev[outputId],
            savedContent: prev[outputId].editedContent,
            isSaving: false,
          },
        }));
        toast("Changes saved");
      } else {
        setOutputState(outputId, { isSaving: false });
        toast.error("Failed to save changes");
      }
    } catch {
      setOutputState(outputId, { isSaving: false });
      toast.error("Failed to save changes");
    }
  }

  async function handleRegenerate(outputId: string) {
    setOutputState(outputId, { isRegenerating: true });

    try {
      const res = await fetch(`/api/${slug}/platform-outputs/${outputId}/regenerate`, {
        method: "POST",
      });

      if (res.ok) {
        const data = (await res.json()) as { id: string; content: string };
        setOutputStates((prev) => ({
          ...prev,
          [outputId]: {
            ...prev[outputId],
            editedContent: data.content,
            savedContent: data.content,
            isRegenerating: false,
          },
        }));
        toast("Content regenerated");
      } else {
        setOutputState(outputId, { isRegenerating: false });
        toast.error("Regeneration failed");
      }
    } catch {
      setOutputState(outputId, { isRegenerating: false });
      toast.error("Regeneration failed");
    }
  }

  async function handleCopy(outputId: string) {
    const output = outputStates[outputId];
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output.editedContent);
      toast("Copied to clipboard");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  async function handlePublishDateChange(date: Date | undefined) {
    if (!generationId || !date) return;
    try {
      await fetch(`/api/${slug}/generations/${generationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intendedPublishAt: date ? date.toISOString() : null }),
      });
    } catch {
      // silently fail — callers manage their own publish date state
    }
  }

  return {
    outputStates,
    setOutputStates,
    initOutputState,
    setEditedContent,
    handleSave,
    handleRegenerate,
    handleCopy,
    handlePublishDateChange,
  };
}
