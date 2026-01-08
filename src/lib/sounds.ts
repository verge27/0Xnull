// Audio context for generating sounds
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Trigger vibration on mobile devices
export const triggerVibration = (pattern: number | number[] = 200) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    console.warn('Could not trigger vibration:', e);
  }
};

// Play a success/confirmation sound (ascending chime)
export const playConfirmationSound = (withVibration = true) => {
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

    // Vibrate on mobile
    if (withVibration) {
      triggerVibration([100, 50, 100, 50, 200]); // Success pattern
    }
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
export const playErrorSound = (withVibration = true) => {
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

    // Vibrate on mobile
    if (withVibration) {
      triggerVibration([300, 100, 300]); // Error pattern
    }
  } catch (e) {
    console.warn('Could not play error sound:', e);
  }
};

// Play a subtle warning sound (for closing soon / market closed alerts)
export const playWarningSound = (withVibration = true) => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Two-tone warning beep
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, now); // A4
    oscillator.frequency.setValueAtTime(349.23, now + 0.15); // F4 (descending = warning)
    oscillator.frequency.setValueAtTime(440, now + 0.3); // A4

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.setValueAtTime(0.2, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.17);
    gainNode.gain.setValueAtTime(0.15, now + 0.3);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.45);

    oscillator.start(now);
    oscillator.stop(now + 0.45);

    // Vibrate on mobile - short warning pattern
    if (withVibration) {
      triggerVibration([100, 50, 100]); // Warning pattern
    }
  } catch (e) {
    console.warn('Could not play warning sound:', e);
  }
};

// Play a countdown tick sound (for final seconds)
export const playCountdownTick = (secondsLeft: number, withVibration = true) => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Higher pitch as countdown approaches zero
    const baseFreq = 440 + (5 - secondsLeft) * 100;
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(baseFreq, now);

    // Louder on final second
    const volume = secondsLeft === 1 ? 0.35 : 0.2;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);

    // Short vibration tick
    if (withVibration) {
      triggerVibration(50);
    }
  } catch (e) {
    console.warn('Could not play countdown tick:', e);
  }
};

// Play a round resolution sound (dramatic reveal)
export const playResolutionSound = (withVibration = true) => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Dramatic two-tone reveal
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(880, now); // A5
    oscillator1.frequency.setValueAtTime(1046.5, now + 0.15); // C6

    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(440, now); // A4
    oscillator2.frequency.setValueAtTime(523.25, now + 0.15); // C5

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.setValueAtTime(0.3, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.4);

    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + 0.4);
    oscillator2.stop(now + 0.4);

    if (withVibration) {
      triggerVibration([100, 50, 200]);
    }
  } catch (e) {
    console.warn('Could not play resolution sound:', e);
  }
};
