// Procedural Dhaka Audio Synthesizer & Voice Line System
import { VehicleTelemetry } from '../types';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private voiceVolume: number = 1.0;

  // Master Gain Nodes
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;

  // CNG Engine Synthesizer Nodes
  private engineRunning: boolean = false;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineNoiseNode: AudioBufferSourceNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Ambient City Rumble
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;

  // Active Horn
  private hornOsc1: OscillatorNode | null = null;
  private hornOsc2: OscillatorNode | null = null;
  private hornGain: GainNode | null = null;

  // Speech synthesis voice
  private banglaVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.initSpeechVoices();
  }

  // AudioContext requires user gesture to start
  public ensureContext(): void {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) {
          console.warn('[AudioManager] Web Audio API is not supported on this device.');
          return;
        }
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.masterVolume;
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 1.0;
        this.sfxGain.connect(this.masterGain);

        this.voiceGain = this.ctx.createGain();
        this.voiceGain.gain.value = this.voiceVolume;
        this.voiceGain.connect(this.masterGain);

        this.startEngineAudio();
        this.startAmbientTrafficAudio();
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (err) {
      console.warn('[AudioManager] Could not initialize or resume AudioContext:', err);
    }
  }

  // Setup Web Speech API for Bengali voice synthesis
  private initSpeechVoices(): void {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Look for bn-BD or bn-IN or general bn
        const bnVoice = voices.find(v => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali'));
        if (bnVoice) {
          this.banglaVoice = bnVoice;
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  // 1. Synthesize 4-Stroke Bangladeshi CNG Engine
  private startEngineAudio(): void {
    if (!this.ctx || !this.sfxGain || this.engineRunning) return;
    this.engineRunning = true;

    // Dual pulse/triangle oscillators for 4-stroke thumping
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(32, this.ctx.currentTime); // ~900 RPM idle

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(48, this.ctx.currentTime);

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sine';
    this.engineSubOsc.frequency.setValueAtTime(16, this.ctx.currentTime);

    // Bandpass filter for mechanical exhaust resonance
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    // Connect engine nodes
    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSubOsc.start();
  }

  // Update engine frequency & volume based on RPM and throttle
  public updateEngineSound(telemetry: VehicleTelemetry): void {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;

    // RPM 900 -> 35 Hz; RPM 4500 -> 135 Hz
    const targetFreq = 28 + (telemetry.rpm / 4800) * 110;
    const filterFreq = 220 + (telemetry.rpm / 4800) * 800 + telemetry.throttle * 400;
    const volume = 0.22 + telemetry.throttle * 0.2 + (telemetry.speedKmh / 60) * 0.15;

    const time = this.ctx.currentTime + 0.05;
    this.engineOsc1.frequency.linearRampToValueAtTime(targetFreq, time);
    this.engineOsc2.frequency.linearRampToValueAtTime(targetFreq * 1.5, time);
    if (this.engineSubOsc) this.engineSubOsc.frequency.linearRampToValueAtTime(targetFreq * 0.5, time);
    this.engineFilter.frequency.linearRampToValueAtTime(filterFreq, time);
    this.engineGain.gain.linearRampToValueAtTime(volume, time);
  }

  // 2. Signature Dhaka CNG Electric Horn (Pee-peep!)
  public startHorn(): void {
    if (!this.ctx || !this.sfxGain || this.hornOsc1) return;

    // Characteristic Dhaka dual-tone (approx 440 Hz + 554 Hz)
    this.hornOsc1 = this.ctx.createOscillator();
    this.hornOsc1.type = 'sawtooth';
    this.hornOsc1.frequency.setValueAtTime(440, this.ctx.currentTime);

    this.hornOsc2 = this.ctx.createOscillator();
    this.hornOsc2.type = 'square';
    this.hornOsc2.frequency.setValueAtTime(554, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.hornGain = this.ctx.createGain();
    this.hornGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.hornOsc1.connect(filter);
    this.hornOsc2.connect(filter);
    filter.connect(this.hornGain);
    this.hornGain.connect(this.sfxGain);

    this.hornOsc1.start();
    this.hornOsc2.start();
  }

  public stopHorn(): void {
    if (!this.hornOsc1 || !this.hornGain || !this.ctx) return;
    this.hornGain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    setTimeout(() => {
      if (this.hornOsc1) {
        this.hornOsc1.stop();
        this.hornOsc1.disconnect();
        this.hornOsc1 = null;
      }
      if (this.hornOsc2) {
        this.hornOsc2.stop();
        this.hornOsc2.disconnect();
        this.hornOsc2 = null;
      }
      this.hornGain = null;
    }, 60);
  }

  // 3. Cycle Rickshaw Dual Chime Bell (Tring-tring!)
  public playRickshawBell(): void {
    if (!this.ctx || !this.sfxGain) return;

    const playChime = (freq: number, delay: number) => {
      setTimeout(() => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      }, delay);
    };

    // Traditional double ring
    playChime(1980, 0);
    playChime(2350, 110);
    playChime(1980, 260);
    playChime(2350, 370);
  }

  // 4. Ambient Dhaka City Traffic Rumble
  private startAmbientTrafficAudio(): void {
    if (!this.ctx || !this.masterGain) return;

    // Synthesize low urban traffic noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.ambientNoiseSource = this.ctx.createBufferSource();
    this.ambientNoiseSource.buffer = noiseBuffer;
    this.ambientNoiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime); // Low distant roar

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.ambientNoiseSource.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.ambientNoiseSource.start();
  }

  // 5. Bump Thud (Passing over speed breaker / pothole)
  public playBumpThud(): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(85, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // 6. Cash / Fare Collected Chime (+৳১২০)
  public playCashChime(): void {
    if (!this.ctx || !this.sfxGain) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      }, i * 75);
    });
  }

  // 7. Spoken Bengali Dialogue Audio Voice Line
  public speakBanglaDialogue(
    textBangla: string,
    voiceType: 'young_male' | 'young_female' | 'adult_male' | 'elderly_male'
  ): void {
    if (this.isMuted) return;

    // Method A: Web Speech API if Bengali voice is installed
    if ('speechSynthesis' in window && this.banglaVoice) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textBangla);
      utterance.voice = this.banglaVoice;
      utterance.rate = 1.05;

      if (voiceType === 'adult_male') utterance.pitch = 0.95;
      else if (voiceType === 'elderly_male') utterance.pitch = 0.8;
      else if (voiceType === 'young_female') utterance.pitch = 1.3;
      else utterance.pitch = 1.1;

      utterance.volume = this.voiceVolume;
      window.speechSynthesis.speak(utterance);
      return;
    }

    // Method B: Rich Procedural Phonetic Syllable Synthesizer for Guaranteed Spoken Audio Cadence
    this.synthesizeDhakaSpeechCadence(textBangla, voiceType);
  }

  // Guaranteed procedural vocal tone generation with pitch inflection
  private synthesizeDhakaSpeechCadence(
    text: string,
    voiceType: 'young_male' | 'young_female' | 'adult_male' | 'elderly_male'
  ): void {
    if (!this.ctx || !this.voiceGain) return;

    const syllables = Math.max(3, Math.min(text.length / 2, 12));
    let basePitch = 130; // Adult male CNG driver base frequency (Hz)
    if (voiceType === 'young_female') basePitch = 230;
    else if (voiceType === 'elderly_male') basePitch = 105;
    else if (voiceType === 'young_male') basePitch = 160;

    const isQuestion = text.includes('?');

    for (let i = 0; i < syllables; i++) {
      const delay = i * 90;
      setTimeout(() => {
        if (!this.ctx || !this.voiceGain) return;
        const osc = this.ctx.createOscillator();
        const formant = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        // Inflect pitch upwards at end of questions
        const pitchBend = isQuestion && i > syllables - 3 ? (i - (syllables - 3)) * 25 : (Math.random() - 0.5) * 15;
        osc.frequency.setValueAtTime(basePitch + pitchBend, this.ctx.currentTime);

        // Vocal tract formant filter
        formant.type = 'bandpass';
        formant.frequency.setValueAtTime(650 + (i % 3) * 350, this.ctx.currentTime);
        formant.Q.setValueAtTime(3.5, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.18 * this.voiceVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.08);

        osc.connect(formant);
        formant.connect(gain);
        gain.connect(this.voiceGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      }, delay);
    }
  }

  // Volume & Settings
  public setMasterVolume(vol: number): void {
    this.masterVolume = THREE_Math_clamp(vol, 0, 1);
    if (this.masterGain) this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
  }

  public setVoiceVolume(vol: number): void {
    this.voiceVolume = THREE_Math_clamp(vol, 0, 1);
    if (this.voiceGain) this.voiceGain.gain.value = this.voiceVolume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain) this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    return this.isMuted;
  }
}

function THREE_Math_clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
