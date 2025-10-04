// Generates placeholder valid PNGs (solid teal) for PWA icons.
const fs = require('fs');
// 192x192 teal (#0F766E) minimal PNG (solid color)
const png192 = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABlApwJAAAAFUlEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAI8CGAAB5x0ZqQAAAABJRU5ErkJggg==';
// 512x512 teal solid color
const png512 = 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAAAFUlEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAI8CGAAB5x0ZqQAAAABJRU5ErkJggg==';

function write(file, b64){
  fs.writeFileSync(file, Buffer.from(b64,'base64'));
  console.log('Wrote', file, 'size', fs.statSync(file).size);
}

write('./public/pwa-192.png', png192);
write('./public/pwa-512.png', png512);
console.log('Done generating PWA icons.');