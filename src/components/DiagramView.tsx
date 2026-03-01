import { useRef, useEffect } from "react";
import type { TabState } from "../types";
import "./DiagramView.css";

interface DiagramViewProps {
  tab: TabState;
}

export function DiagramView({ tab }: DiagramViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && tab.svg) {
      containerRef.current.innerHTML = tab.svg;
    }
  }, [tab.svg]);

  if (tab.error) {
    return (
      <div className="diagram-error">
        <h3>Render Error</h3>
        <pre>{tab.error}</pre>
      </div>
    );
  }

  if (!tab.svg) {
    return (
      <div className="diagram-loading">
        <p>Rendering…</p>
      </div>
    );
  }

  return <div className="diagram-container" ref={containerRef} />;
}
