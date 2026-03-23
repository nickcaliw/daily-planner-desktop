import { useCallback, useEffect, useRef, useState } from "react";

const api = typeof window !== "undefined" ? window.collectionApi : null;
const COLLECTION = "networking";

const STATUS_OPTIONS = ["Active", "Follow Up", "Dormant"];
const STATUS_COLORS = {
  Active: "#4caf50",
  "Follow Up": "#ff9800",
  Dormant: "#607d8b",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

export default function NetworkingPage() {
  const [items, setItems] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const saveTimer = useRef({});

  const refresh = useCallback(async () => {
    if (api) setItems((await api.list(COLLECTION)) || []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    (id, data) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
      if (saveTimer.current[id]) clearTimeout(saveTimer.current[id]);
      saveTimer.current[id] = setTimeout(() => {
        if (api) api.save(id, COLLECTION, data);
      }, 300);
    },
    []
  );

  const addContact = async () => {
    const id = crypto.randomUUID();
    const data = {
      name: "",
      company: "",
      role: "",
      metAt: "",
      lastContact: "",
      followUpDate: "",
      notes: "",
      status: "Active",
    };
    if (api) await api.save(id, COLLECTION, data);
    await refresh();
    setExpandedId(id);
  };

  const deleteContact = async (id) => {
    if (api) await api.delete(id);
    if (expandedId === id) setExpandedId(null);
    refresh();
  };

  const filtered =
    filterStatus === "All"
      ? items
      : items.filter((i) => i.status === filterStatus);

  const sorted = [...filtered].sort((a, b) => {
    if (a.followUpDate && b.followUpDate)
      return a.followUpDate.localeCompare(b.followUpDate);
    if (a.followUpDate) return -1;
    if (b.followUpDate) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  return (
    <div className="netPage">
      <style>{`
        .netPage {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .netBody {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .netGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .netCard {
          background: var(--paper, #fbf7f0);
          border: 1px solid var(--border, #e0dcd4);
          border-radius: 10px;
          overflow: hidden;
          transition: box-shadow 0.15s;
        }
        .netCard:hover {
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        }
        .netCardActive {
          box-shadow: 0 2px 16px rgba(91, 124, 245, 0.12);
          border-color: var(--accent, #5B7CF5);
        }
        .netCardTop {
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .netCardHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .netCardName {
          font-size: 16px;
          font-weight: 600;
          color: var(--text, #3a3226);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .netCardName.netPlaceholder {
          color: var(--muted, #b5a89a);
          font-style: italic;
        }
        .netBadge {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 12px;
          color: #fff;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .netCardMeta {
          font-size: 13px;
          color: var(--muted, #b5a89a);
          line-height: 1.4;
        }
        .netCardMeta span {
          display: inline-block;
          margin-right: 12px;
        }
        .netFollowUp {
          font-size: 12px;
          margin-top: 2px;
        }
        .netFollowUp.netOverdue {
          color: #e53935;
          font-weight: 600;
        }
        .netFollowUp.netUpcoming {
          color: #ff9800;
        }
        .netEditPanel {
          padding: 0 16px 16px;
          border-top: 1px solid var(--border, #e0dcd4);
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 14px;
        }
        .netEditRow {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .netEditLabel {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--muted, #b5a89a);
        }
        .netEditInput, .netEditSelect, .netEditTextarea {
          font-size: 14px;
          padding: 7px 10px;
          border-radius: 6px;
          border: 1px solid var(--border, #e0dcd4);
          background: var(--bg, #f6f1e8);
          color: var(--text, #3a3226);
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
        }
        .netEditInput:focus, .netEditSelect:focus, .netEditTextarea:focus {
          border-color: var(--accent, #5B7CF5);
        }
        .netEditTextarea {
          resize: vertical;
          min-height: 48px;
        }
        .netDeleteBtn {
          align-self: flex-start;
          color: #e53935 !important;
          border-color: #e53935 !important;
          margin-top: 4px;
          font-size: 12px;
        }
        .netDeleteBtn:hover {
          background: #fbe9e7 !important;
        }
        .netFilterRow {
          display: flex;
          gap: 4px;
          margin-right: 12px;
        }
        .netEmpty {
          grid-column: 1 / -1;
        }
      `}</style>

      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Networking</h1>
          <div className="weekBadge">{items.length} contacts</div>
        </div>
        <div className="nav">
          <div className="netFilterRow">
            {["All", ...STATUS_OPTIONS].map((s) => (
              <button
                key={s}
                className={`tabBtn ${filterStatus === s ? "active" : ""}`}
                onClick={() => setFilterStatus(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            className="btn btnPrimary"
            onClick={addContact}
            type="button"
          >
            + Add Contact
          </button>
        </div>
      </div>

      <div className="netBody">
        <div className="netGrid">
          {sorted.map((item) => {
            const isExpanded = expandedId === item.id;
            const overdue = isOverdue(item.followUpDate);
            return (
              <div
                className={`netCard ${isExpanded ? "netCardActive" : ""}`}
                key={item.id}
              >
                <div
                  className="netCardTop"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : item.id)
                  }
                >
                  <div className="netCardHeader">
                    <div
                      className={`netCardName ${!item.name ? "netPlaceholder" : ""}`}
                    >
                      {item.name || "New Contact"}
                    </div>
                    <span
                      className="netBadge"
                      style={{
                        background:
                          STATUS_COLORS[item.status] || STATUS_COLORS.Active,
                      }}
                    >
                      {item.status || "Active"}
                    </span>
                  </div>
                  <div className="netCardMeta">
                    {item.role && <span>{item.role}</span>}
                    {item.company && <span>at {item.company}</span>}
                  </div>
                  {item.followUpDate && (
                    <div
                      className={`netFollowUp ${
                        overdue ? "netOverdue" : "netUpcoming"
                      }`}
                    >
                      {overdue ? "Overdue: " : "Follow up: "}
                      {formatDate(item.followUpDate)}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="netEditPanel">
                    <div className="netEditRow">
                      <label className="netEditLabel">Name</label>
                      <input
                        className="netEditInput"
                        value={item.name || ""}
                        onChange={(e) =>
                          save(item.id, { ...item, name: e.target.value })
                        }
                        placeholder="Full name"
                      />
                    </div>
                    <div className="netEditRow">
                      <label className="netEditLabel">Company</label>
                      <input
                        className="netEditInput"
                        value={item.company || ""}
                        onChange={(e) =>
                          save(item.id, { ...item, company: e.target.value })
                        }
                        placeholder="Company name"
                      />
                    </div>
                    <div className="netEditRow">
                      <label className="netEditLabel">Role</label>
                      <input
                        className="netEditInput"
                        value={item.role || ""}
                        onChange={(e) =>
                          save(item.id, { ...item, role: e.target.value })
                        }
                        placeholder="Job title"
                      />
                    </div>
                    <div className="netEditRow">
                      <label className="netEditLabel">Where You Met</label>
                      <input
                        className="netEditInput"
                        value={item.metAt || ""}
                        onChange={(e) =>
                          save(item.id, { ...item, metAt: e.target.value })
                        }
                        placeholder="Conference, LinkedIn, etc."
                      />
                    </div>
                    <div className="netEditRow">
                      <label className="netEditLabel">Last Contact</label>
                      <input
                        type="date"
                        className="netEditInput"
                        value={item.lastContact || ""}
                        onChange={(e) =>
                          save(item.id, {
                            ...item,
                            lastContact: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="netEditRow">
                      <label className="netEditLabel">Follow-Up Date</label>
                      <input
                        type="date"
                        className="netEditInput"
                        value={item.followUpDate || ""}
                        onChange={(e) =>
                          save(item.id, {
                            ...item,
                            followUpDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="netEditRow">
                      <label className="netEditLabel">Status</label>
                      <select
                        className="netEditSelect"
                        value={item.status || "Active"}
                        onChange={(e) =>
                          save(item.id, { ...item, status: e.target.value })
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="netEditRow">
                      <label className="netEditLabel">Notes</label>
                      <textarea
                        className="netEditTextarea"
                        value={item.notes || ""}
                        rows={3}
                        onChange={(e) =>
                          save(item.id, { ...item, notes: e.target.value })
                        }
                        placeholder="Conversation topics, reminders, etc."
                      />
                    </div>
                    <button
                      className="btn netDeleteBtn"
                      onClick={() => deleteContact(item.id)}
                      type="button"
                    >
                      Delete Contact
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div className="netEmpty">
              <div
                style={{
                  fontSize: 15,
                  color: "var(--muted)",
                  textAlign: "center",
                  padding: "40px 0",
                }}
              >
                {filterStatus !== "All"
                  ? `No ${filterStatus.toLowerCase()} contacts.`
                  : "No contacts yet. Click + Add Contact to start networking."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
