export default function Loading() {
  return (
    <main style={{ minHeight: "100vh", padding: "18px 14px 110px", background: "#e8edf4" }}>
      <div style={{ maxWidth: "1480px", margin: "0 auto", display: "grid", gap: "12px" }}>
        <div className="skeleton" style={{ height: "44px", width: "38%" }} />
        <div className="skeleton" style={{ height: "140px", width: "100%" }} />
        <div className="skeleton" style={{ height: "96px", width: "100%" }} />
        <div className="skeleton" style={{ height: "96px", width: "100%" }} />
      </div>
    </main>
  );
}
