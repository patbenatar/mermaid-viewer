import { invoke } from "@tauri-apps/api/core";
import type { TabState } from "../types";
import "./TabBar.css";

interface TabBarProps {
  dirName: string | null;
  tabs: Map<string, TabState>;
  activeTab: string | null;
  onSelectTab: (filename: string) => void;
}

function displayName(filename: string): string {
  return filename.replace(/\.mmd$/, "");
}

export function TabBar({ dirName, tabs, activeTab, onSelectTab }: TabBarProps) {
  const tabEntries = Array.from(tabs.values());

  return (
    <div className="tab-bar">
      {dirName && <span className="tab-bar-title">{dirName}</span>}
      {tabEntries.map((tab) => (
        <button
          key={tab.filename}
          className={`tab ${tab.filename === activeTab ? "tab-active" : ""} ${tab.error ? "tab-error" : ""}`}
          onClick={() => onSelectTab(tab.filename)}
        >
          {displayName(tab.filename)}
          {tab.error && <span className="tab-error-indicator">!</span>}
          <span
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              invoke("delete_file", { filename: tab.filename });
            }}
          >
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
