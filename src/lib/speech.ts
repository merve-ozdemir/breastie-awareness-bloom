// Browser voice capture: MediaRecorder (audio kept in memory only, discarded after confirm),
// a live level meter, auto-stop after ~3 s of silence, and browser speech recognition for the transcript.
// The transcript seam is replaceable by the "process-zone" service later.

type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSR(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  return !!getSR() && typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export type Capture = { stop: () => void; done: Promise<{ transcript: string; audio: Blob | null }> };

export async function startCapture(opts: {
  lang: string;
  onLevel: (v: number) => void;
  silenceMs?: number;
}): Promise<Capture> {
  const SRC = getSR();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 512;
  src.connect(an);
  const buf = new Uint8Array(an.fftSize);

  const chunks: Blob[] = [];
  let rec: MediaRecorder | null = null;
  try {
    rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.start();
  } catch {
    rec = null;
  }

  let finalText = "";
  let interim = "";
  const sr = SRC ? new SRC() : null;
  if (sr) {
    sr.lang = opts.lang;
    sr.continuous = true;
    sr.interimResults = true;
    sr.onresult = (e) => {
      let f = "";
      let i = "";
      for (let k = 0; k < e.results.length; k++) {
        const r = e.results[k];
        if (!r || !r[0]) continue;
        if (r.isFinal) f += r[0].transcript + " ";
        else i += r[0].transcript + " ";
      }
      finalText = f;
      interim = i;
    };
    try {
      sr.start();
    } catch {
      /* ignore */
    }
  }

  let stopped = false;
  let resolveDone!: (v: { transcript: string; audio: Blob | null }) => void;
  const done = new Promise<{ transcript: string; audio: Blob | null }>((r) => (resolveDone = r));
  let lastVoice = performance.now();
  let raf = 0;

  const tick = () => {
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = ((buf[i] ?? 128) - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buf.length);
    opts.onLevel(Math.min(1, rms * 6));
    if (rms > 0.04) lastVoice = performance.now();
    if (performance.now() - lastVoice > (opts.silenceMs ?? 3000)) stop();
    else raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  function stop() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    const finish = () => {
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
      const audio = chunks.length ? new Blob(chunks) : null;
      resolveDone({ transcript: (finalText + interim).trim(), audio });
    };
    if (rec && rec.state !== "inactive") rec.stop();
    if (sr) {
      sr.onend = () => setTimeout(finish, 50);
      try {
        sr.stop();
      } catch {
        finish();
      }
      setTimeout(finish, 1500);
    } else finish();
  }

  return { stop, done };
}
