"use client";

import { MessagesSquare, NotebookPen } from "lucide-react";
import { useState } from "react";

import { ForumBoard } from "./forum-board";
import { ForumPanel } from "./forum-panel";

type ForumMode = "board" | "chat";

/**
 * The Forum tab holds two different things under one name: a threaded
 * discussion board (titles, categories, likes, replies) and the realtime chat
 * channels, including the invitation-only private forums. They are not two
 * views of the same data, so the switch is explicit rather than a filter.
 */
export function ForumTabs() {
  const [mode, setMode] = useState<ForumMode>("board");

  return (
    <div className="forum-tabs">
      <div className="forum-tabs__switch" role="tablist" aria-label="Mode forum">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "board"}
          className={`forum-tabs__tab${mode === "board" ? " forum-tabs__tab--active" : ""}`}
          onClick={() => setMode("board")}
        >
          <NotebookPen size={16} aria-hidden="true" />
          Diskusi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "chat"}
          className={`forum-tabs__tab${mode === "chat" ? " forum-tabs__tab--active" : ""}`}
          onClick={() => setMode("chat")}
        >
          <MessagesSquare size={16} aria-hidden="true" />
          Obrolan
        </button>
      </div>

      {mode === "board" ? <ForumBoard /> : <ForumPanel />}
    </div>
  );
}
