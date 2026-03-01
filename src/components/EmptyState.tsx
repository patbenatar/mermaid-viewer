import "./EmptyState.css";

export function EmptyState() {
  return (
    <div className="empty-state">
      <h2>No diagrams found</h2>
      <p>
        Create <code>.mmd</code> files in the{" "}
        <code>.mermaid-visuals/</code> directory to get started.
      </p>
      <pre>
        {`# Example: .mermaid-visuals/example.mmd
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[Cancel]`}
      </pre>
    </div>
  );
}
