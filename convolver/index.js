import { el } from '@elemaudio/core';
import OfflineRenderer from '@elemaudio/offline-renderer';
import Speaker from 'speaker';
import http from 'http';
import url from 'url';

let setVolumeProps;

async function initializeRenderer() {
  let core = new OfflineRenderer();

  await core.initialize({
    numInputChannels: 0,
    numOutputChannels: 1,
    blockSize: 32,
    sampleRate: 44100
  });

  // Graph
  let volumeRef;
  [volumeRef, setVolumeProps] = core.createRef("const", { value: 0.5 }, []);
  core.render(
    el.mul(volumeRef, el.cycle(440))
  );

  return core;
}
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

async function playSound() {





  

  // Process audio continuously
  //setInterval(processAudio, 1000); // Adjust the interval as needed
  console.log("Sound is playing...");
}

playSound().catch(err => {
  console.error("Error playing sound:", err);
});

// Set up the HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Volume Control</title>
      </head>
      <body>
        <h1>Volume Control</h1>
        <input type="range" id="volumeSlider" min="0" max="1" step="0.01" value="0.5">
        <script>
          const slider = document.getElementById('volumeSlider');
          slider.addEventListener('input', () => {
            fetch(\`/setVolume?value=\${slider.value}\`)
              .then(response => response.text())
              .then(data => console.log(data))
              .catch(error => console.error('Error:', error));
          });
        </script>
      </body>
      </html>
    `);
  } else if (parsedUrl.pathname === '/setVolume') {
    const volume = parseFloat(parsedUrl.query.value);
    if (!isNaN(volume) && setVolumeProps) {
      setVolumeProps({ value: volume });
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Volume set to ${volume}`);
      processAudio();
    } else {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid volume value');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});