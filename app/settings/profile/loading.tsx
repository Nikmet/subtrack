export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", padding: "18px 14px 110px", background: "#e8edf4" }}>
      <div style={{ maxWidth: "1480px", margin: "0 auto", display: "grid", gap: "12px" }}>
        <div className="skeleton" style={{ height: "56px", width: "100%" }} />
        <div className="skeleton" style={{ height: "340px", width: "100%" }} />
      </div>
    </main>
  );
}
