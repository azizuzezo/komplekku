import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = join(process.cwd());
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("reliable delete interaction", () => {
  it("awaits the delete request and exposes a failure in the confirmation", () => {
    const source = read("components/ui/entity-actions.tsx");
    expect(source).toContain("await onDelete()");
    expect(source).toContain('role="alert"');
  });

  it("uses mutateAsync so announcement, agenda, and forum failures propagate", () => {
    expect(read("features/announcement/announcement-list.tsx")).toContain(
      "archiveMutation.mutateAsync",
    );
    expect(read("features/agenda/agenda-list.tsx")).toContain(
      "archiveMutation.mutateAsync",
    );
    expect(read("features/forum/forum-board.tsx")).toContain(
      "deleteMutation.mutateAsync",
    );
  });
});
