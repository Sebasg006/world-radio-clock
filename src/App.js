import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import CITIES from "./cities";
import AnalogClock from "./AnalogClock";
import { getStations, reportClick } from "./radio";
import { formatDate, formatTime, isDaytime, offsetFromLocal } from "./time";

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const STALL_MS = 8000; // si una emisora no suena en este tiempo, se pasa a la siguiente

// Hora que se actualiza cada segundo para la lista y los textos
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Equalizer({ active }) {
  return (
    <span className={`eq ${active ? "eq-on" : ""}`} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

const icons = {
  play: <path d="M8 5.5v13l11-6.5z" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />,
  prev: <path d="M6 6h2v12H6zM9.5 12 18 18V6z" />,
  next: <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />,
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

export default function App() {
  const now = useNow();
  const [cityId, setCityId] = useState("tokyo");
  const [stationsByCode, setStationsByCode] = useState({});
  const [failedCodes, setFailedCodes] = useState({});
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | loading | playing | paused | error
  const [volume, setVolume] = useState(0.8);

  const audioRef = useRef(null);
  const wantsPlay = useRef(false); // el usuario quiere oír la radio
  const failures = useRef(0);
  const stallTimer = useRef(null);
  const current = useRef({ list: null, index: 0 }); // para los callbacks del audio y los temporizadores

  const city = CITIES.find((c) => c.id === cityId);
  const stations = stationsByCode[city.code] ?? null; // null = todavía cargando
  const station = stations?.[index];
  const day = isDaytime(now, city.tz);

  current.current = { list: stations, index };

  // Precargar las emisoras de todas las ciudades (primero la elegida), para que al hacer
  // clic el audio arranque dentro del mismo gesto. Safari bloquea play() si llega después.
  useEffect(() => {
    let cancelled = false;
    const codes = [...new Set(CITIES.map((c) => c.code))];
    const queue = [codes.splice(codes.indexOf("JP"), 1)[0], ...codes];
    const worker = async () => {
      while (queue.length && !cancelled) {
        const code = queue.shift();
        try {
          const list = await getStations(code);
          if (!cancelled) setStationsByCode((prev) => ({ ...prev, [code]: list }));
        } catch {
          if (!cancelled) setFailedCodes((prev) => ({ ...prev, [code]: true }));
        }
      }
    };
    worker();
    worker();
    worker();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const clearStall = () => clearTimeout(stallTimer.current);

  const stopAudio = () => {
    const audio = audioRef.current;
    clearStall();
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  };

  // Sintoniza una emisora. Se llama directamente desde los clics.
  const tune = useCallback((list, i) => {
    const audio = audioRef.current;
    const st = list[i];
    clearStall();
    setStatus("loading");
    audio.src = st.url;
    audio.play().catch(() => {});
    reportClick(st.id);
    stallTimer.current = setTimeout(() => skip(), STALL_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pasa a la siguiente emisora cuando una falla o no arranca
  const skip = () => {
    const { list, index: i } = current.current;
    if (!wantsPlay.current || !list?.length) return;
    failures.current += 1;
    if (failures.current >= list.length) {
      wantsPlay.current = false;
      stopAudio();
      setStatus("error");
      return;
    }
    const next = (i + 1) % list.length;
    setIndex(next);
    tune(list, next);
  };

  // Si la ciudad elegida termina de cargar mientras el usuario quiere oír, arrancar
  useEffect(() => {
    if (wantsPlay.current && stations?.length && audioRef.current && !audioRef.current.getAttribute("src")) {
      tune(stations, 0);
    }
  }, [stations, tune]);

  const selectCity = (c) => {
    if (c.id === cityId) return;
    setCityId(c.id);
    setIndex(0);
    failures.current = 0;
    stopAudio();
    const list = stationsByCode[c.code];
    if (wantsPlay.current) {
      if (list?.length) tune(list, 0);
      else setStatus("loading");
    } else {
      setStatus("idle");
    }
  };

  const step = (dir) => {
    if (!stations?.length) return;
    const next = (index + dir + stations.length) % stations.length;
    setIndex(next);
    failures.current = 0;
    if (wantsPlay.current) tune(stations, next);
  };

  const toggle = () => {
    if (!station) return;
    if (wantsPlay.current) {
      wantsPlay.current = false;
      clearStall();
      audioRef.current.pause();
      setStatus("paused");
    } else {
      wantsPlay.current = true;
      failures.current = 0;
      tune(stations, index);
    }
  };

  // Barra espaciadora para reproducir o pausar
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => clearStall, []);

  const failed = failedCodes[city.code];
  const empty = stations && !stations.length;
  const statusKey = failed ? "error" : empty ? "empty" : status;
  const statusText = {
    idle: "Press play to tune in",
    loading: "Tuning in…",
    playing: "Live",
    paused: "Paused",
    error: "Couldn't reach a station, try another city",
    empty: "No live stations found here",
  }[statusKey];

  return (
    <div className={`app ${day ? "app-day" : "app-night"}`}>
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => {
          clearStall();
          failures.current = 0;
          setStatus("playing");
        }}
        onWaiting={() => wantsPlay.current && setStatus("loading")}
        onError={() => audioRef.current.getAttribute("src") && skip()}
      />

      <header className="topbar">
        <span className="brand">
          <svg className="brand-mark" width="30" height="30" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="3.2" />
            <ellipse cx="24" cy="24" rx="7.5" ry="17" stroke="currentColor" strokeWidth="2.4" opacity=".4" />
            <path d="M7 24h34" stroke="currentColor" strokeWidth="2.4" opacity=".4" />
            <path d="M24 24 33 13" stroke="#34d399" strokeWidth="3.6" strokeLinecap="round" />
            <circle cx="24" cy="24" r="3.2" fill="#34d399" />
          </svg>
          <span className="brand-word">
            World Radio Clock
            <small>live radio · local time</small>
          </span>
        </span>
        <span className="local">
          you · {formatTime(now, LOCAL_TZ)} · {LOCAL_TZ.split("/").pop().replace(/_/g, " ")}
        </span>
      </header>

      <main className="layout">
        <section className="stage" aria-live="polite">
          <p className="eyebrow">
            <span className={`sun ${day ? "sun-day" : "sun-night"}`} aria-hidden="true" />
            {day ? "daytime" : "night"} in {city.country}
          </p>
          <h1 className="city-name">{city.name}</h1>

          <AnalogClock tz={city.tz} day={day} />

          <p className="digital">{formatTime(now, city.tz, true)}</p>
          <p className="date">
            {formatDate(now, city.tz)} <span>· {offsetFromLocal(now, city.tz)}</span>
          </p>
        </section>

        <aside className="cities" aria-label="Choose a city">
          <p className="eyebrow">choose a city</p>
          <ul>
            {CITIES.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`city ${c.id === cityId ? "city-active" : ""}`}
                  onClick={() => selectCity(c)}
                  aria-pressed={c.id === cityId}
                >
                  <span className={`city-dot ${isDaytime(now, c.tz) ? "dot-day" : "dot-night"}`} />
                  <span className="city-label">
                    <strong>{c.name}</strong>
                    <small>{c.country}</small>
                  </span>
                  <span className="city-time">{formatTime(now, c.tz)}</span>
                  {c.id === cityId && <Equalizer active={status === "playing"} />}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </main>

      <footer className="player">
        <div className="station">
          <div className="station-art">
            {station?.favicon ? (
              <img
                key={station.id}
                src={station.favicon}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            <span>{(station?.name ?? city.name).charAt(0)}</span>
          </div>
          <div className="station-info">
            <p className="station-name">{station?.name ?? (stations ? city.name : "Searching stations…")}</p>
            <p className={`station-status status-${statusKey}`}>
              {statusKey === "playing" && <span className="live-dot" />}
              {statusText}
              {station?.tags.length ? <span className="tags"> · {station.tags.join(" · ")}</span> : null}
            </p>
          </div>
        </div>

        <div className="controls">
          <button type="button" className="ctrl" onClick={() => step(-1)} aria-label="Previous station" disabled={!stations?.length}>
            <Icon name="prev" />
          </button>
          <button
            type="button"
            className={`ctrl ctrl-main ${statusKey === "loading" ? "is-loading" : ""}`}
            onClick={toggle}
            aria-label={wantsPlay.current ? "Pause" : "Play"}
            disabled={!station}
          >
            <Icon name={wantsPlay.current ? "pause" : "play"} />
          </button>
          <button type="button" className="ctrl" onClick={() => step(1)} aria-label="Next station" disabled={!stations?.length}>
            <Icon name="next" />
          </button>
        </div>

        <div className="volume">
          <span className="station-count">
            {stations?.length ? `${index + 1} / ${stations.length}` : "–"}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            style={{ "--fill": `${volume * 100}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
