import { Notice } from "obsidian";

export interface AudioRecorder {
  startRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;
}

function getSupportedMimeType(): string | undefined {
    const mimeTypes = [
      "audio/webm; codecs=opus",
      "audio/mpeg",
      "audio/ogg; codecs=opus",
    ];
  
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
  
    return undefined;
  }

export class AudioRecorder implements AudioRecorder {
  private chunks: BlobPart[] = [];
  private recorder: MediaRecorder | null = null;

  getRecordingState(): "inactive" | "recording" | "paused" | undefined {
    return this.recorder?.state;
  }

  async startRecording(): Promise<void> {
    if (!this.recorder) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = getSupportedMimeType();

        if (!mimeType) {
          throw new Error("No supported mimeType found");
        }

        const options = { mimeType };
        const recorder = new MediaRecorder(stream, options);

        recorder.addEventListener("dataavailable", (e: BlobEvent) => {
          console.log("dataavailable", e.data.size);
          this.chunks.push(e.data);
        });

        this.recorder = recorder;
      } catch (err) {
        new Notice("Error initializing recorder: " + err);
        console.error("Error initializing recorder:", err);
        return;
      }
    }

    this.recorder.start(100);
  }

  async pauseRecording(): Promise<void> {
    if (!this.recorder) {
      return;
    }

    if (this.recorder.state === "recording") {
      this.recorder.pause();
    } else if (this.recorder.state === "paused") {
      this.recorder.resume();
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.recorder || this.recorder.state === "inactive") {
        const blob = new Blob(this.chunks, { type: "audio/webm" });
        this.chunks.length = 0;

        console.log("Stop recording (no active recorder):", blob);

        resolve(blob);
      } else {
        this.recorder.addEventListener("stop", () => {
          const blob = new Blob(this.chunks, { type: "audio/webm" });
          this.chunks.length = 0;

          console.log("Stop recording (active recorder):", blob);

          resolve(blob);
        }, { once: true });

        this.recorder.stop();
      }
    });
  }
}
