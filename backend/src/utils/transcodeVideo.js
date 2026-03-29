import { spawn } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
/** Path to bundled ffmpeg binary (linux/mac/win); falls back to PATH `ffmpeg`. */
let ffmpegStaticPath;
try {
  ffmpegStaticPath = require("ffmpeg-static");
} catch {
  ffmpegStaticPath = null;
}

function getFfmpegBin() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  if (ffmpegStaticPath) return ffmpegStaticPath;
  return "ffmpeg";
}

/**
 * Normalize any uploaded video to MP4 (H.264 Baseline + AAC, yuv420p) for HTML5 playback.
 * Baseline + level 4.0 + even dimensions avoids Safari / mobile decode issues with High Profile,
 * HEVC-in-MP4, or odd-sized frames.
 */
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const bin = getFfmpegBin();
    const ff = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    ff.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    ff.on("error", (e) => {
      if (e.code === "ENOENT") {
        reject(new Error("ffmpeg not found: install ffmpeg or ensure ffmpeg-static installed"));
      } else {
        reject(e);
      }
    });
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-1200)}`));
    });
  });
}

/** Video filter: even dimensions + yuv420p (required for broad browser support). */
const VF_EVEN_420 =
  "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p";

/**
 * @param {string} inputPath
 * @param {string} outputPath - should end in .mp4
 */
export async function transcodeToWebCompatibleMp4(inputPath, outputPath) {
  const withAudio = [
    "-y",
    "-i",
    inputPath,
    "-vf",
    VF_EVEN_420,
    "-c:v",
    "libx264",
    "-profile:v",
    "baseline",
    "-level",
    "4.0",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-ar",
    "48000",
    "-movflags",
    "+faststart",
    outputPath,
  ];
  try {
    await runFfmpeg(withAudio);
  } catch {
    const videoOnly = [
      "-y",
      "-i",
      inputPath,
      "-vf",
      VF_EVEN_420,
      "-c:v",
      "libx264",
      "-profile:v",
      "baseline",
      "-level",
      "4.0",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-an",
      "-movflags",
      "+faststart",
      outputPath,
    ];
    await runFfmpeg(videoOnly);
  }
}
