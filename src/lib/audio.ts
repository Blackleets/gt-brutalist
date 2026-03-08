// audio.ts
// Semantic UI Audio Engine using Web Audio API (Zero external assets)

class UIAudioEngine {
    private ctx: AudioContext | null = null;
    private enabled = false;

    private init() {
        if (!this.ctx) {
            const AudioContextClass = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
            this.ctx = new AudioContextClass();
        }
    }

    public toggle(state: boolean) {
        this.enabled = state;
        if (state) this.init();
    }

    private playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // High pitched terminal blip
    public blip() {
        this.playTone(880, "square", 0.05, 0.05);
    }

    // Mechanical click for buttons
    public click() {
        this.playTone(150, "sine", 0.02, 0.1);
    }

    // Alert sound (two-tone)
    public alert() {
        if (!this.enabled || !this.ctx) return;
        this.playTone(660, "square", 0.1, 0.05);
        setTimeout(() => this.playTone(440, "square", 0.2, 0.05), 100);
    }

    // Success chime
    public success() {
        this.playTone(523.25, "sine", 0.1, 0.1);
        setTimeout(() => this.playTone(659.25, "sine", 0.15, 0.08), 80);
    }

    // Error buzz
    public error() {
        this.playTone(110, "sawtooth", 0.3, 0.1);
    }
}

export const audio = new UIAudioEngine();
