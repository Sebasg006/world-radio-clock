import { useEffect, useRef } from "react";
import { zonedParts } from "./time";

// Reloj de agujas en SVG. Las agujas se mueven escribiendo directamente su atributo
// transform en cada frame, sin volver a renderizar React (más fluido, sobre todo en Safari).
const TICKS = Array.from({ length: 60 }, (_, i) => i);

export default function AnalogClock({ tz, day }) {
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const secondRef = useRef(null);

  useEffect(() => {
    let frame;
    let lastSecond = -1;
    let base = null;

    const tick = () => {
      const now = new Date();
      const sec = Math.floor(now.getTime() / 1000);
      // La hora de la zona solo se recalcula una vez por segundo
      if (sec !== lastSecond) {
        base = zonedParts(now, tz);
        lastSecond = sec;
      }
      const s = base.second + now.getMilliseconds() / 1000;
      const m = base.minute + s / 60;
      const h = (base.hour % 12) + m / 60;
      hourRef.current?.setAttribute("transform", `rotate(${h * 30} 100 100)`);
      minuteRef.current?.setAttribute("transform", `rotate(${m * 6} 100 100)`);
      secondRef.current?.setAttribute("transform", `rotate(${s * 6} 100 100)`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [tz]);

  return (
    <div className={`clock-wrap ${day ? "is-day" : "is-night"}`}>
      <div className="clock-glow" aria-hidden="true" />
      <svg viewBox="0 0 200 200" className="clock" role="img" aria-label="Analog clock">
        <defs>
          <radialGradient id="face" cx="50%" cy="35%" r="70%">
            <stop offset="0%" className="face-stop-1" />
            <stop offset="100%" className="face-stop-2" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="96" className="clock-rim" />
        <circle cx="100" cy="100" r="92" fill="url(#face)" className="clock-face" />
        {TICKS.map((i) => {
          const major = i % 5 === 0;
          return (
            <line
              key={i}
              x1="100"
              y1={major ? 14 : 16}
              x2="100"
              y2={major ? 24 : 20}
              className={major ? "tick tick-major" : "tick"}
              transform={`rotate(${i * 6} 100 100)`}
            />
          );
        })}
        {[12, 3, 6, 9].map((n, i) => {
          const angle = (i * Math.PI) / 2;
          return (
            <text
              key={n}
              x={100 + Math.sin(angle) * 64}
              y={100 - Math.cos(angle) * 64}
              className="clock-number"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {n}
            </text>
          );
        })}
        <line ref={hourRef} x1="100" y1="112" x2="100" y2="54" className="hand hand-hour" />
        <line ref={minuteRef} x1="100" y1="114" x2="100" y2="36" className="hand hand-minute" />
        <g ref={secondRef}>
          <line x1="100" y1="122" x2="100" y2="22" className="hand hand-second" />
          <circle cx="100" cy="122" r="3" className="hand-second-tail" />
        </g>
        <circle cx="100" cy="100" r="4.5" className="clock-pin" />
        <circle cx="100" cy="100" r="1.8" className="clock-pin-inner" />
      </svg>
    </div>
  );
}
