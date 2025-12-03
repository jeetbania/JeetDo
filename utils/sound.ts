// Simple audio synth to avoid external file dependencies
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

export const playPop = (volume = 0.1) => {
  try {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playSuccess = (volume = 0.1) => {
  try {
    const ctx = getContext();
    
    // Chord for success
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + i * 0.05 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.4);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime + i * 0.05);
      oscillator.stop(ctx.currentTime + i * 0.05 + 0.4);
    });

  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const playCelebration = (volume = 0.15) => {
  try {
    const ctx = getContext();
    
    // Simulate applause/cheering with multiple noise bursts
    const bufferSize = ctx.sampleRate * 2; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Create pink/brown noise
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; 
    }

    // Increased loop count and duration for longer applause
    for (let i = 0; i < 40; i++) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 500 + Math.random() * 1000;
        filter.Q.value = 1;

        const gainNode = ctx.createGain();
        // Spread out the start times more for a longer effect
        const start = ctx.currentTime + Math.random() * 0.6; 
        const duration = 0.2 + Math.random() * 0.8;

        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(volume * (0.5 + Math.random()), start + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(start);
        source.stop(start + duration + 0.1);
    }
    
    // Add a cheering swell
    playSuccess(volume);

  } catch (e) {
    /* ignore */
  }
}

export const playNotification = () => {
   try {
    const ctx = getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (e) { /* ignore */ }
}