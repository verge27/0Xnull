// Audio context for generating sounds
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Play a success/confirmation sound (ascending chime)
export const playConfirmationSound = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Create oscillator for the chime
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // Connect nodes
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configure oscillators (ascending pleasant tones)
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(523.25, now); // C5
    oscillator1.frequency.setValueAtTime(659.25, now + 0.1); // E5
    oscillator1.frequency.setValueAtTime(783.99, now + 0.2); // G5

    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(659.25, now); // E5
    oscillator2.frequency.setValueAtTime(783.99, now + 0.1); // G5
    oscillator2.frequency.setValueAtTime(1046.5, now + 0.2); // C6

    // Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.setValueAtTime(0.3, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

    // Play
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + 0.5);
    oscillator2.stop(now + 0.5);
  } catch (e) {
    console.warn('Could not play confirmation sound:', e);
  }
};

// Play a subtle notification beep
export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now); // A5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
};

// Play an error/warning sound
export const playErrorSound = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.setValueAtTime(150, now + 0.1);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  } catch (e) {
    console.warn('Could not play error sound:', e);
  }
};
