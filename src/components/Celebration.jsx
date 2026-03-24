import { useEffect, useState } from "react";

const CONFETTI_COLORS = ["#5B7CF5", "#4caf50", "#ff9800", "#e91e63", "#9c27b0", "#00bcd4", "#ffeb3b"];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function ConfettiPiece({ color, delay }) {
  const style = {
    position: "absolute",
    left: `${randomBetween(10, 90)}%`,
    top: "-10px",
    width: `${randomBetween(6, 12)}px`,
    height: `${randomBetween(6, 12)}px`,
    background: color,
    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
    opacity: 0,
    animation: `confettiFall ${randomBetween(1.5, 3)}s ease-out ${delay}s forwards`,
    transform: `rotate(${randomBetween(0, 360)}deg)`,
  };
  return <div style={style} />;
}

export function ConfettiCelebration({ show, onDone }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!show) { setPieces([]); return; }
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: randomBetween(0, 0.5),
    }));
    setPieces(newPieces);
    const timer = setTimeout(() => {
      setPieces([]);
      if (onDone) onDone();
    }, 3500);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (pieces.length === 0) return null;

  return (
    <div className="confettiContainer">
      {pieces.map(p => (
        <ConfettiPiece key={p.id} color={p.color} delay={p.delay} />
      ))}
    </div>
  );
}

export function MilestoneToast({ show, message, emoji, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDone) onDone();
    }, 3000);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!visible) return null;

  return (
    <div className="milestoneToast">
      <span className="milestoneEmoji">{emoji || "🎉"}</span>
      <span className="milestoneMessage">{message}</span>
    </div>
  );
}
