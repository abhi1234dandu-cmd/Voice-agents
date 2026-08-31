"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
} from "lucide-react";
import { voiceProfiles, type VoiceProfile } from "@votell/shared-types";

type FilterKey = "language" | "tone" | "genderPresentation" | "industry";

function uniqueValues(key: FilterKey) {
  return [
    "All",
    ...Array.from(new Set(voiceProfiles.map((voice) => voice[key]))),
  ] as string[];
}

export function VoiceGallery({ compact = false }: { compact?: boolean }) {
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    language: "All",
    tone: "All",
    genderPresentation: "All",
    industry: "All",
  });
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const progressRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("votell-volume");
    if (stored) {
      setVolume(Number(stored));
    }
    return () => {
      window.speechSynthesis?.cancel();
      if (progressRef.current) {
        window.clearInterval(progressRef.current);
      }
    };
  }, []);

  const filtered = useMemo(
    () =>
      voiceProfiles.filter((voice) =>
        (Object.keys(filters) as FilterKey[]).every(
          (key) =>
            filters[key] === "All" || String(voice[key]) === filters[key],
        ),
      ),
    [filters],
  );

  function startProgress(durationMs: number) {
    if (progressRef.current) {
      window.clearInterval(progressRef.current);
    }
    const startedAt = Date.now();
    progressRef.current = window.setInterval(() => {
      const next = Math.min(100, ((Date.now() - startedAt) / durationMs) * 100);
      setProgress(next);
      if (next >= 100 && progressRef.current) {
        window.clearInterval(progressRef.current);
      }
    }, 160);
  }

  function playVoice(voice: VoiceProfile) {
    window.speechSynthesis.cancel();
    setPaused(false);
    setProgress(0);
    setActiveVoiceId(voice.id);

    const utterance = new SpeechSynthesisUtterance(voice.sampleScript);
    utterance.lang = voice.languageCode;
    utterance.rate = voice.speakingRate;
    utterance.volume = volume;
    utterance.onend = () => {
      setProgress(100);
      setActiveVoiceId(null);
      setPaused(false);
    };
    utterance.onerror = () => {
      setActiveVoiceId(null);
      setPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    startProgress(Math.max(3200, voice.sampleScript.split(" ").length * 430));
  }

  function pauseOrResume() {
    if (!activeVoiceId) {
      return;
    }
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function replay() {
    const active =
      voiceProfiles.find((voice) => voice.id === activeVoiceId) ?? filtered[0];
    if (active) {
      playVoice(active);
    }
  }

  function updateVolume(next: number) {
    setVolume(next);
    window.localStorage.setItem("votell-volume", String(next));
  }

  return (
    <section
      id="voice-gallery"
      className={compact ? "" : "mx-auto max-w-7xl px-4 py-16 sm:px-6"}
      aria-labelledby="voice-gallery-title"
    >
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase text-teal-signal">
            Meet the voices of Votell
          </p>
          <h2
            id="voice-gallery-title"
            className="mt-2 text-3xl font-black tracking-normal text-white sm:text-4xl"
          >
            Choose a voice only after the visitor asks to hear it.
          </h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            Local demo previews use browser speech synthesis as a mock TTS
            provider. No production voice licensing claim is made.
          </p>
        </div>
        <div className="panel flex items-center gap-3 rounded-lg p-3">
          <Volume2 aria-hidden="true" size={18} className="text-teal-signal" />
          <label className="sr-only" htmlFor="voice-volume">
            Voice preview volume
          </label>
          <input
            id="voice-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => updateVolume(Number(event.target.value))}
            aria-label="Voice preview volume"
          />
        </div>
      </div>

      <div className="glass-rail mb-6 rounded-lg p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
          <SlidersHorizontal
            aria-hidden="true"
            size={18}
            className="text-teal-signal"
          />
          Voice filters
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {(Object.keys(filters) as FilterKey[]).map((key) => (
            <label key={key} className="text-sm font-semibold text-slate-300">
              <span className="mb-2 block capitalize">
                {key.replace("genderPresentation", "gender presentation")}
              </span>
              <select
                className="field"
                value={filters[key]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              >
                {uniqueValues(key).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((voice) => {
          const isActive = activeVoiceId === voice.id;
          return (
            <article
              key={voice.id}
              className="surface premium-card rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-white">
                    {voice.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {voice.tone} · {voice.language} · {voice.industry}
                  </p>
                </div>
                <span className="rounded-full border border-teal-signal/30 px-2.5 py-1 text-xs font-bold text-teal-signal">
                  {voice.provider}
                </span>
              </div>
              <p className="mt-4 min-h-24 text-sm leading-6 text-slate-300">
                {voice.sampleScript}
              </p>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#19d3c5,#8b5cf6,#f6b84b)] transition-all"
                  style={{ width: `${isActive ? progress : 0}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  className="btn-secondary"
                  onClick={() => playVoice(voice)}
                  aria-label={`Play ${voice.name} preview`}
                >
                  <Play aria-hidden="true" size={17} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={pauseOrResume}
                  disabled={!isActive}
                  aria-label={paused ? "Resume preview" : "Pause preview"}
                >
                  <Pause aria-hidden="true" size={17} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={replay}
                  disabled={!isActive && !filtered.length}
                  aria-label="Replay preview"
                >
                  <RotateCcw aria-hidden="true" size={17} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
