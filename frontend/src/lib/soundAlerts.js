/**
 * Web Audio API Sound Alert Utility for Water System
 * Plays distinct synthesized audio alerts for New Orders, Assignments, and Completed Deliveries.
 */

// Helper to synthesize multi-frequency chime tones using Web Audio API
function playChime(frequencies, duration = 0.15, type = "sine", delayGap = 0.12) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * delayGap);

      gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * delayGap);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * delayGap + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * delayGap);
      osc.stop(ctx.currentTime + idx * delayGap + duration);
    });
  } catch (error) {
    console.error("Audio playback error:", error);
  }
}

/**
 * Urgent Red Alert Sound for Admin when New Water Order is Placed
 */
export const playNewOrderSound = () => {
  // Rapid alert chime sequence (C5, G5, C6)
  playChime([523.25, 783.99, 1046.50], 0.25, "triangle", 0.15);
};

/**
 * Assignment Alert Sound for Driver when assigned new work
 */
export const playAssignmentSound = () => {
  // Pleasant notification chime (E5, B5, E6)
  playChime([659.25, 987.77, 1318.51], 0.2, "sine", 0.12);
};

/**
 * Green Success Sound for Admin when Order is Successfully Delivered
 */
export const playDeliverySuccessSound = () => {
  // Victory / Success fanfare sequence (G4, C5, E5, G5)
  playChime([392.00, 523.25, 659.25, 783.99], 0.3, "sine", 0.1);
};
