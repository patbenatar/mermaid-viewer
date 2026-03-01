import { useEffect, useRef, useCallback } from "react";
import mermaid from "mermaid";
import type { TabsState, TabAction } from "../types";

let mermaidInitialized = false;

function initMermaid() {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      flowchart: { useMaxWidth: true },
      sequence: { useMaxWidth: true },
    });
    mermaidInitialized = true;
  }
}

export function useMermaidRenderer(
  state: TabsState,
  dispatch: React.Dispatch<TabAction>,
) {
  const prevContentRef = useRef<string | null>(null);
  const renderIdRef = useRef(0);

  const renderDiagram = useCallback(
    async (filename: string, content: string) => {
      initMermaid();
      const renderId = ++renderIdRef.current;
      const uniqueId = `mermaid-${renderId}`;

      try {
        const { svg } = await mermaid.render(uniqueId, content);
        // Only apply if this is still the latest render
        if (renderId === renderIdRef.current) {
          dispatch({ type: "SET_SVG", filename, svg });
        }
      } catch (error) {
        if (renderId === renderIdRef.current) {
          dispatch({
            type: "SET_ERROR",
            filename,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!state.activeTab) {
      prevContentRef.current = null;
      return;
    }

    const tab = state.tabs.get(state.activeTab);
    if (!tab) {
      prevContentRef.current = null;
      return;
    }

    // Skip if content hasn't changed
    if (tab.content === prevContentRef.current) {
      return;
    }

    prevContentRef.current = tab.content;
    renderDiagram(tab.filename, tab.content);
  }, [state.activeTab, state.tabs, renderDiagram]);
}
