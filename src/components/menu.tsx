import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, AudioLinesIcon, Mic } from "lucide-react";
import "./menu.css";

export type Mode = "tts" | "stt";

interface ModeMenuProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

const OPTIONS: { value: Mode; label: string; icon: React.ReactNode }[] = [
  { value: "tts", label: "Malagasy TTS Engine", icon: <AudioLinesIcon size={13} /> },
  { value: "stt", label: "Malagasy STT Engine", icon: <Mic size={13} /> },
];

const ModeMenu: React.FC<ModeMenuProps> = ({ mode, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.value === mode) ?? OPTIONS[0];

  /* close on outside click */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const select = (value: Mode) => {
    onChange(value);
    setOpen(false);
  };

  return (
    <div className="mode-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`mode-menu-trigger${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="badge-dot">{current.icon}</span>
        
        <span>{current.label}</span>
        <ChevronDown size={12} className="mode-menu-chevron" />
      </button>

      {open && (
        <ul className="mode-menu-list" role="listbox">
          {OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === mode}
                className={`mode-menu-item${opt.value === mode ? " active" : ""}`}
                onClick={() => select(opt.value)}
              >
                <span className="mode-menu-item-icon">{opt.icon}</span>
                <span>{opt.label}</span>
                {opt.value === mode && <span className="mode-menu-dot" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModeMenu;