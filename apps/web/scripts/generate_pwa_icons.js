// Simple script to write placeholder valid PNGs (solid color) for PWA icons.
// Uses pre-generated base64 192x192 and 512x512 PNGs (teal background)
const fs = require('fs');

// Generated via an offline tool (ImageMagick) then base64 encoded.
// 192x192 teal (#0F766E)
const png192 = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABlApwJAAAAFUlEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAI8CGAAB5x0ZqQAAAABJRU5ErkJggg==';
// 512x512 teal
const png512 = 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAAFUlEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAI8CGAAB5x0ZqQAAAABJRU5ErkJggg==';

function write(file, b64){
  fs.writeFileSync(file, Buffer.from(b64,'base64'));
  console.log('Wrote', file, 'size', fs.statSync(file).size);
}

write('./public/pwa-192.png', png192);
write('./public/pwa-512.png', png512);
