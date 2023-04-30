import { Plugin } from "obsidian";
import { Timer } from "src/Timer";
import { Controls } from "src/Controls";
import { AudioHandler } from "src/AudioHandler";
import { WhisperSettingsTab } from "src/WhisperSettingsTab";
import { SettingsManager, WhisperSettings } from "src/SettingsManager";
import { NativeAudioRecorder } from "src/AudioRecorder";

export default class Whisper extends Plugin {
    settings: WhisperSettings;
    settingsManager: SettingsManager;
    timer: Timer;
    recorder: NativeAudioRecorder
    audioHandler: AudioHandler;
    controls: Controls | null = null;
    statusBarItem: HTMLElement | null = null;


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
        this.updateStatusBarItem(false);
        this.addCommands();
    }
    updateStatusBarItem(recording: boolean) {
        if (this.statusBarItem) {
            this.statusBarItem.textContent = recording ? "Recording..." : "";
            this.statusBarItem.style.color = recording ? "red" : "";
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
        let recording = false;

        this.addCommand({
            id: "start-stop-recording",
            name: "Start/Stop recording",
            callback: async () => {
                if (!recording) {
                    recording = true;
                    await this.recorder.startRecording();
                } else {
                    recording = false;
                    const audioBlob = await this.recorder.stopRecording();
                    // Use audioBlob to send or save the recorded audio as needed
                    await this.audioHandler.sendAudioData(audioBlob);
                }
                this.updateStatusBarItem(recording);

            },
            hotkeys: [
                {
                    modifiers: ["Alt"],
                    key: "`",
                },
            ],
        });
    }
}
