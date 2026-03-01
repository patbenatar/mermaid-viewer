import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTauriEvents } from "./hooks/useTauriEvents";
import { useMermaidRenderer } from "./hooks/useMermaidRenderer";
import { TabBar } from "./components/TabBar";
import { DiagramView } from "./components/DiagramView";
import { EmptyState } from "./components/EmptyState";
import "./App.css";

function App() {
  const { state, dispatch } = useTauriEvents();
  useMermaidRenderer(state, dispatch);

  const tabKeys = Array.from(state.tabs.keys());
  const activeIndex = state.activeTab ? tabKeys.indexOf(state.activeTab) : -1;

  const switchTab = useCallback(
    (direction: -1 | 1) => {
      if (tabKeys.length < 2) return;
      const next = (activeIndex + direction + tabKeys.length) % tabKeys.length;
      dispatch({ type: "SET_ACTIVE_TAB", filename: tabKeys[next] });
    },
    [tabKeys, activeIndex, dispatch],
  );

  const closeActiveTab = useCallback(() => {
    if (state.activeTab) {
      invoke("delete_file", { filename: state.activeTab });
    }
  }, [state.activeTab]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.shiftKey && e.key === "O") {
        e.preventDefault();
        switchTab(-1);
      } else if (e.altKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        switchTab(1);
      } else if (e.ctrlKey && e.key === "w") {
        e.preventDefault();
        closeActiveTab();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [switchTab, closeActiveTab]);

  const activeTabState = state.activeTab
    ? state.tabs.get(state.activeTab) ?? null
    : null;

  return (
    <div className="app">
      <TabBar
        dirName={state.dirName}
        tabs={state.tabs}
        activeTab={state.activeTab}
        onSelectTab={(filename) =>
          dispatch({ type: "SET_ACTIVE_TAB", filename })
        }
      />
      {activeTabState ? (
        <DiagramView tab={activeTabState} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

export default App;
