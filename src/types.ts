export interface MmdFile {
  filename: string;
  content: string;
}

export interface TabState {
  filename: string;
  content: string;
  svg: string | null;
  error: string | null;
}

export type FileEvent =
  | { kind: "FileChanged"; filename: string; content: string }
  | { kind: "FileRemoved"; filename: string };

export type TabAction =
  | { type: "SET_INITIAL"; files: MmdFile[]; dirName: string }
  | { type: "FILE_CHANGED"; filename: string; content: string }
  | { type: "FILE_REMOVED"; filename: string }
  | { type: "SET_SVG"; filename: string; svg: string }
  | { type: "SET_ERROR"; filename: string; error: string }
  | { type: "SET_ACTIVE_TAB"; filename: string };

export interface TabsState {
  dirName: string | null;
  tabs: Map<string, TabState>;
  activeTab: string | null;
}
