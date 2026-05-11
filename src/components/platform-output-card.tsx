import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface PlatformOutputCardProps {
  platformName: string;
  content: string;
  onChange: (value: string) => void;
  onCopy: () => void;
  onSave: () => void;
  onRegenerate: () => void;
  loading: boolean;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
}

export function PlatformOutputCard({
  platformName,
  content,
  onChange,
  onCopy,
  onSave,
  onRegenerate,
  loading,
  hasUnsavedChanges = false,
  isSaving = false,
}: PlatformOutputCardProps) {
  return (
    <div
      className={[
        "flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition",
        hasUnsavedChanges ? "border-amber-300 shadow-amber-100" : "border-zinc-200",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-zinc-700">
          {platformName}
        </span>
        {hasUnsavedChanges && (
          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
            Unsaved
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-100" />
        </div>
      ) : (
        <>
          <Textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed text-zinc-700 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />

          <div className="mt-3 flex items-center justify-end gap-2">
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="xs"
                    title="More actions"
                  >
                    ···
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={onRegenerate}>
                    Regenerate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={onRegenerate}
              className="hidden sm:inline-flex"
            >
              Regenerate
            </Button>
            <Button variant="outline" size="xs" onClick={onCopy}>
              Copy
            </Button>
            <Button
              size="xs"
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
