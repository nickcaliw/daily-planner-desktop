// Mood tracking is now integrated into the Journal page.
// This component redirects there.
export default function MoodTrackerPage({ onNavigate }) {
  return (
    <div className="placeholderPage" style={{ cursor: "pointer" }} onClick={() => onNavigate?.("journal")}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.7 }}>📝</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>Mood tracking moved to Journal</div>
      <div style={{ fontSize: 14, color: "var(--muted)", maxWidth: 360, textAlign: "center", lineHeight: 1.6 }}>
        Mood, energy, and tags are now part of your journal entries — all in one place.
      </div>
      <button className="btn btnPrimary" style={{ marginTop: 16 }} onClick={() => onNavigate?.("journal")} type="button">
        Go to Journal
      </button>
    </div>
  );
}
