import React, { useState, useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import {
  Play,
  Pause,
  Download,
  // Mic,
  AudioLinesIcon,
  ChevronDown,
} from "lucide-react";
import "./TextToSpeechPro.css";
import ModeMenu, { Mode } from "./components/menu";
import SpeachToText from "./SpeachToText";

const MODELS = [
  { value: "mms", label: "Malagasy V1" },
  //{ value: "mms_v2", label: "MMS v2" },
  //{ value: "tacotron", label: "Tacotron-MG" },
];

const TextToSpeechPro: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("mms");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  /* ── helpers ── */
  const base64ToBlob = (base64: any, mime: any) => {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mime });
  };

  /* ── WaveSurfer init (re-runs when audioUrl changes) ── */
  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "rgba(57, 255, 122, 0.35)",
        progressColor: "#39ff7a",
        cursorColor: "#ff6b2b",
        barWidth: 2,
        barRadius: 3,
        barGap: 1,
        height: 58,
      });

      wavesurfer.current.on("finish", () => setIsPlaying(false));

      return () => {
        wavesurfer.current?.destroy();
      };
    }
  }, [audioUrl]);

  /* ── load audio into WaveSurfer ── */
  useEffect(() => {
    if (audioUrl && wavesurfer.current) {
      wavesurfer.current.load(audioUrl);
      return () => {
        if (audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
      };
    }
  }, [audioUrl]);

  // come back generate button when edit text
  useEffect(() => {
    if (audioUrl) {
      wavesurfer.current?.destroy();
      wavesurfer.current = null;
      setAudioUrl("");
      setIsPlaying(false);
    }
  }, [text]);

  /* ── generate TTS ── */
  const handleSpeak = async () => {
    if (!text.trim()) {
      setAudioUrl("/default.mp3");
      if (wavesurfer.current) {
        wavesurfer.current.playPause();
        setIsPlaying(!isPlaying);
      }
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        // `http://localhost:8000/model/${selectedModel}/?text=` + text,
        `http://localhost:8000/model/mms?text=` + text,
        { headers: { "Content-Type": "application/json" }, method: "POST" },
      );
      const result = await response.json();
      const audioBlob = base64ToBlob(result.output, "audio/wav");
      setAudioUrl(URL.createObjectURL(audioBlob));
    } catch (error) {
      console.error("TTS Failed, falling back to default file", error);
      setAudioUrl("/default.mp3");
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── play / pause ── */
  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  /* ── reset to new generation ── */
  const handleReset = () => {
    wavesurfer.current?.destroy();
    wavesurfer.current = null;
    setText("");
    setAudioUrl("");
    setIsPlaying(false);
  };

  /* ── status dot colour ── */
  const dotColor = isPlaying ? "#39ff7a" : audioUrl ? "#ff6b2b" : "#283a2c";

  /* ════════════════════════════════════════ */
  // ------- Menu ---------
  const [mode, setMode] = useState<Mode>("tts");

  return (
    <div className="root">
      {/* ── HERO ── */}
      <section className="head">
        
      </section>
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob blob-1" />
          <div className="hero-blob blob-2" />
          <div className="hero-blob blob-3" />
        </div>

        <div className="hero-content hpad">
          {/* <div className="flex justify-between"> */}
            <div className="flex items-center mb-10! gap-4">
              <img src="assets/img/icon.png" width={60} alt="" />
              {/* <div className="hero-badge mb-0!">
                <span className="badge-dot" />
                Malagasy TTS Engine
              </div> */}
              <ModeMenu mode={mode} onChange={setMode} />
            </div>

          {/* </div> */}

          <h1 className="hero-title">
            <span className="hero-title-line">{mode === "tts" ? "Text-To-Speech" : "Speech-To-Text"}</span>
            <span className="hero-title-accent">Malagasy</span>
          </h1>

          <p className="hero-sub">
            Manorata, ka omeo feo ny hevitrao, ary omeo aina ny hafatrao. <br />
            Ampiasao ny teknolojia STT sy TTS-MG hanovana ny lahatsoratra malagasy ho
            feo madio sy mazava ary manintona.
            {/* Convert Malagasy text to natural, expressive speech in seconds. */}
          </p>

          <div className="hero-stats">
            <div>
              <img
                src="assets/img/logo_ispm.png"
                alt=""
                className="ispm-logo"
                width={100}
              />
            </div>
            <div className="stat-divider" />
            <span className="stat-val">
              Institut Supérieur Polytechnique de Madagascar
            </span>
          </div>
        </div>
      </section>

      {/* ── MAIN TTS ZONE ── */}
      {mode === "tts" ? (
        <main className="main-zone hpad">
            {/* brand bar */}
            <div className="topbar">
              <div className="brand-row">
                {/* <div className="icon-wrap">
                <Mic size={17} color="#050d08" strokeWidth={2.2} />
              </div> */}
              <img src="assets/img/icon.png" width={40} alt="" />

              <span className="brand-name">
                TTS-<span className="brand-accent">MG</span>
              </span>
            </div>

            <div className="status-pill">
              <span
                className="status-dot"
                style={{
                  backgroundColor: dotColor,
                  boxShadow: isPlaying ? `0 0 7px ${dotColor}` : "none",
                }}
              />
              <span className="status-label">
                {isPlaying ? "Playing" : audioUrl ? "Ready" : "Idle"}
              </span>
            </div>
          </div>

          {/* input zone */}
          <div className="input-zone">
            <div className="input-header">
              <span className="section-label">Input text</span>

              {/* model selector — top right of input */}
              <div className="model-select-wrap">
                <span className="section-label">Model</span>
                <div className="model-select-box">
                  <select
                    className="model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {MODELS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="select-arrow" />
                </div>
              </div>
            </div>

            <div className="textarea-wrap">
              <textarea
                className="textarea"
                placeholder="Manorata ary mihainoa teny malagasy..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <span className="char-badge">{text.length}</span>
            </div>
          </div>

          {/* ── Generate button OR inline player ── */}
          {!audioUrl ? (
            <div className="action-zone">
              <button
                className={`btn-gen-full${isGenerating ? " loading" : ""}`}
                onClick={handleSpeak}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner" /> Generating…
                  </>
                ) : (
                  <>
                    <AudioLinesIcon size={16} /> Generate Speech
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* play/pause — waveform — download, all inline */}
              <div className="player-zone">
                <button
                  className="btn-play"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause fill="currentColor" size={16} strokeWidth={0} />
                  ) : (
                    <Play fill="currentColor" size={16} strokeWidth={0} />
                  )}
                </button>

                {/* wavesurfer mounts here — no bg / no border from CSS */}
                <div ref={waveformRef} className="wave-inline" />

                <a
                  className="btn-export"
                  href={audioUrl}
                  download="speech.wav"
                  aria-label="Download WAV"
                >
                  <Download size={13} strokeWidth={1.8} />
                  <span>WAV</span>
                </a>
              </div>

              <div className="regen-zone">
                <button className="btn-regen" onClick={handleReset}>
                  ↺ New generation
                </button>
              </div>
            </>
          )}
        </main>)
      : 
        <SpeachToText />
      
      }

      {/* ── FOOTER ── */}
      <footer className="footer hpad">
        <div className="footer-inner">
          <div className="footer-brand">
            {/* <div className="icon-wrap-sm"> */}
            {/* <Mic size={12} color="#050d08" strokeWidth={2.2} /> */}
            <img src="assets/img/icon.png" width={25} alt="" />
            {/* </div> */}
            TTS-MG
          </div>

          <span className="footer-copy">
            © 2026 TeamSharpMG — All rights reserved
          </span>

          <span className="footer-version">v2.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default TextToSpeechPro;
