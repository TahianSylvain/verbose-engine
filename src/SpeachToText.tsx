import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, ChevronDown } from "lucide-react";
import "./Stt.css";

type Mode = "stt" | "tts";
// type Model = "stt" | "stt_speecht5";

const MODELS = [
  { value: "stt", label: "Whisper" },
  { value: "stt_speecht5", label: "Speech T5" },
  {value: "stt_speecht5_2", label: "Speech T5 V1.2"}
]

const SpeachToText: React.FC = () => {
  /* ── shared ── */
  const [mode, setMode] = useState<Mode>("stt");
  const [isBusy, setIsBusy] = useState<boolean>(false);

  /* ── STT state ── */
  const [selectedModel, setSelectedModel] = useState<string>("stt")

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [recordedUrl, setRecordedUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      console.log("Selected Model = ", selectedModel)
  }, [selectedModel])

  /* ══════════ STT logic ══════════ */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunks.current = [];

      // clear any previous take before recording a new one
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      setRecordedUrl("");
      setIsPlaying(false);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
        setRecordedUrl(URL.createObjectURL(blob));
        await sendForTranscription(blob);
      };

      mediaRecorder.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied or unavailable", err);
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const sendForTranscription = async (blob: Blob) => {
    setIsBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "speech.wav"); // must match `file: UploadFile` param name

      const response = await fetch(`http://localhost:8000/${selectedModel}/transcribe`, {
        method: "POST",
        body: formData,
        // no Content-Type header — the browser sets the multipart boundary itself
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("STT error body:", errBody);
        throw new Error(`STT failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);

      setTranscript(result.output ?? result.text ?? "");
    } catch (error) {
      console.error("STT failed", error);
      setTranscript("(transcription failed — check the backend)");
    } finally {
      setIsBusy(false);
    }
  };

  /* ══════════ playback logic ══════════ */
  const togglePlayback = () => {
    if (!playbackRef.current) return;
    if (isPlaying) playbackRef.current.pause();
    else playbackRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const clearRecording = () => {
    if (playbackRef.current) {
      playbackRef.current.pause();
    }
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl("");
    setIsPlaying(false);
    setTranscript("");
  };

  /* ══════════ render ══════════ */
  return (
    <div className="lite-root">
      <div className="lite-card">
        <div className="topbar">
          <div className="brand-row">
            {/* <div className="icon-wrap">
                <Mic size={17} color="#050d08" strokeWidth={2.2} />
                </div> */}
            <img src="assets/img/icon.png" width={40} alt="" />

            <span className="brand-name">
              STT-<span className="brand-accent">MG</span>
            </span>
          </div>
        </div>


        <div className="lite-body">
          <div className="input-header">
            
          <span className="lite-label">Speech → Text</span>
          
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

          <div className="lite-mic-zone">
            <button
              className={`lite-mic-btn${isRecording ? " recording" : ""}`}
              onClick={toggleRecording}
              disabled={isBusy}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <Square size={18} fill="currentColor" />
              ) : (
                <Mic size={20} />
              )}
            </button>
            <span className="lite-mic-status">
              {isBusy
                ? "Transcribing…"
                : isRecording
                  ? "Listening… tap to stop"
                  : "Tap the mic to speak"}
            </span>
          </div>

          {/* ── replay the take you just recorded ── */}
          {recordedUrl && (
            <div className="lite-player">
              <button
                className="lite-play-btn"
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pause" : "Play recording"}
              >
                {isPlaying ? (
                  <Pause size={14} fill="currentColor" strokeWidth={0} />
                ) : (
                  <Play size={14} fill="currentColor" strokeWidth={0} />
                )}
              </button>

              <span className="lite-player-label">Your recording</span>

              <audio
                ref={playbackRef}
                src={recordedUrl}
                onEnded={() => setIsPlaying(false)}
              />

              <button
                className="lite-clear-btn"
                onClick={clearRecording}
                aria-label="Delete recording"
                title="Delete recording"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}

          <textarea
            className="lite-textarea"
            placeholder="Ny lahatsoratra avy amin'ny feonao dia haseho eto..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SpeachToText;