import { useEffect, useRef } from "react";

export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open && confirmRef.current) confirmRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="confirmOverlay" onClick={onCancel}>
      <div className="confirmDialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirmTitle">{title || "Are you sure?"}</div>
        {message && <div className="confirmMessage">{message}</div>}
        <div className="confirmActions">
          <button className="btn" onClick={onCancel} type="button">
            {cancelLabel || "Cancel"}
          </button>
          <button
            ref={confirmRef}
            className={`btn ${danger ? "btnDanger" : "btnPrimary"}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
