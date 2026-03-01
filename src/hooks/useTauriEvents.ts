import { useEffect, useReducer } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  MmdFile,
  FileEvent,
  TabAction,
  TabState,
  TabsState,
} from "../types";

function tabsReducer(state: TabsState, action: TabAction): TabsState {
  switch (action.type) {
    case "SET_INITIAL": {
      const tabs = new Map<string, TabState>();
      for (const file of action.files) {
        tabs.set(file.filename, {
          filename: file.filename,
          content: file.content,
          svg: null,
          error: null,
        });
      }
      const activeTab =
        action.files.length > 0 ? action.files[0].filename : null;
      return { dirName: action.dirName, tabs, activeTab };
    }

    case "FILE_CHANGED": {
      const tabs = new Map(state.tabs);
      const existing = tabs.get(action.filename);
      if (existing && existing.content === action.content) {
        return state;
      }
      tabs.set(action.filename, {
        filename: action.filename,
        content: action.content,
        svg: existing?.svg ?? null,
        error: null,
      });
      const activeTab = state.activeTab ?? action.filename;
      return { ...state, tabs, activeTab };
    }

    case "FILE_REMOVED": {
      const tabs = new Map(state.tabs);
      tabs.delete(action.filename);
      let activeTab = state.activeTab;
      if (activeTab === action.filename) {
        const keys = Array.from(tabs.keys());
        activeTab = keys.length > 0 ? keys[0] : null;
      }
      return { ...state, tabs, activeTab };
    }

    case "SET_SVG": {
      const tab = state.tabs.get(action.filename);
      if (!tab) return state;
      const tabs = new Map(state.tabs);
      tabs.set(action.filename, { ...tab, svg: action.svg, error: null });
      return { ...state, tabs };
    }

    case "SET_ERROR": {
      const tab = state.tabs.get(action.filename);
      if (!tab) return state;
      const tabs = new Map(state.tabs);
      tabs.set(action.filename, { ...tab, error: action.error, svg: null });
      return { ...state, tabs };
    }

    case "SET_ACTIVE_TAB": {
      return { ...state, activeTab: action.filename };
    }

    default:
      return state;
  }
}

const initialState: TabsState = {
  dirName: null,
  tabs: new Map(),
  activeTab: null,
};

export function useTauriEvents() {
  const [state, dispatch] = useReducer(tabsReducer, initialState);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    async function setup() {
      const dirName = await invoke<string>("get_dir_name");
      const files = await invoke<MmdFile[]>("get_initial_files");
      dispatch({ type: "SET_INITIAL", files, dirName });

      // Listen for ongoing file events
      unlisten = await listen<FileEvent>("file-event", (event) => {
        const payload = event.payload;
        if (payload.kind === "FileChanged") {
          dispatch({
            type: "FILE_CHANGED",
            filename: payload.filename,
            content: payload.content,
          });
        } else if (payload.kind === "FileRemoved") {
          dispatch({ type: "FILE_REMOVED", filename: payload.filename });
        }
      });
    }

    setup();

    return () => {
      unlisten?.();
    };
  }, []);

  return { state, dispatch };
}
