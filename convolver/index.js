import { el } from '@elemaudio/core';
import OfflineRenderer from '@elemaudio/offline-renderer';
import Speaker from 'speaker';

async function initializeRenderer() {
  let core = new OfflineRenderer();

  await core.initialize({
    numInputChannels: 0,
    numOutputChannels: 1,
    blockSize: 32,
    sampleRate: 44100
  });

  // Graph
  let [volume, setVolumeProps] = core.createRef("const", { value: 0.5 }, []);
  setInterval(() => { setVolumeProps({ value: 0.0 }); }, 4000);
  core.render(
    el.mul(volume, el.cycle(440))
  );

  return core;
}

async function playSound() {
  const core = await initializeRenderer();

  const speaker = new Speaker({
    channels: 1,
    bitDepth: 32,
    sampleRate: 44100,
    float: true
  });

  let inps = [];
  let outs = [new Float32Array(44100 * 10)];

  function processAudio() {
    core.process(inps, outs);
    const buffer = Buffer.from(outs[0].buffer);
    speaker.write(buffer);
  }

  // Process audio continuously
  setInterval(processAudio, 1000); // Adjust the interval as needed
  console.log("Sound is playing...");
}

playSound().catch(err => {
  console.error("Error playing sound:", err);
});