import { Plugin } from "obsidian";
import { Timer } from "src/Timer";
import { Controls } from "src/Controls";
import { AudioHandler } from "src/AudioHandler";
import { WhisperSettingsTab } from "src/WhisperSettingsTab";
import { SettingsManager, WhisperSettings } from "src/SettingsManager";
import { NativeAudioRecorder } from "src/AudioRecorder";

// ... (other imports)

export enum RecordingStatus {
    Idle = "idle",
    Recording = "recording",
    Processing = "processing",
}



export default class Whisper extends Plugin {
    settings: WhisperSettings;
    settingsManager: SettingsManager;
    timer: Timer;
    recorder: NativeAudioRecorder
    audioHandler: AudioHandler;
    controls: Controls | null = null;
    statusBarItem: HTMLElement | null = null;
    status: RecordingStatus = RecordingStatus.Idle;


    async onload() {
        this.settingsManager = new SettingsManager(this);
        this.settings = await this.settingsManager.loadSettings();

        this.addRibbonIcon("activity", "Open recording controls", (evt) => {
            if (!this.controls) {
                this.controls = new Controls(this);
            }
            this.controls.open();
        });

        this.addSettingTab(new WhisperSettingsTab(this.app, this));

        this.timer = new Timer()
        this.audioHandler = new AudioHandler(this);
        this.recorder = new NativeAudioRecorder()


        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBarItem(); // Call this method to set the initial status bar text and color
        this.addCommands();
    }

    updateStatus(status: RecordingStatus) {
        this.status = status;
        this.updateStatusBarItem();
    }

    updateStatusBarItem() {
        if (this.statusBarItem) {
            switch (this.status) {
                case RecordingStatus.Recording:
                    this.statusBarItem.textContent = "Recording...";
                    this.statusBarItem.style.color = "red";
                    break;
                case RecordingStatus.Processing:
                    this.statusBarItem.textContent = "Processing audio...";
                    this.statusBarItem.style.color = "orange";
                    break;
                case RecordingStatus.Idle:
                default:
                    this.statusBarItem.textContent = "Whisper Idle";
                    this.statusBarItem.style.color = "green";
                    break;
            }
        }
    }



    onunload() {
        if (this.controls) {
            this.controls.close();
        }


        if (this.statusBarItem) {
            this.statusBarItem.remove();
        }
    }

    addCommands() {

        this.addCommand({
            id: "start-stop-recording",
            name: "Start/Stop recording",
            callback: async () => {
                if (this.status !== RecordingStatus.Recording) {
                    this.updateStatus(RecordingStatus.Recording);
                    await this.recorder.startRecording();
                } else {
                    this.updateStatus(RecordingStatus.Processing);
                    const audioBlob = await this.recorder.stopRecording();
                    // Use audioBlob to send or save the recorded audio as needed
                    await this.audioHandler.sendAudioData(audioBlob);
                    this.updateStatus(RecordingStatus.Idle);
                }
            },
            hotkeys: [
                {
                    modifiers: ["Alt"],
                    key: "Q",
                },
            ],
        });
    }
}
