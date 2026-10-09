const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const folders = fs.readdirSync(path.join(__dirname, '..')).filter((name) => /^ejercicio-\d-/.test(name));
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}
const digits = {
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111']
};
function iconColor(u, v, number) {
  let rgb = [18, 60, 105];
  const ring = Math.hypot(u - .5, v - .47);
  if (ring > .32 && ring < .355) rgb = [133, 228, 212];
  const col = Math.floor((u - .395) / .07);
  const row = Math.floor((v - .295) / .07);
  if (col >= 0 && col < 3 && row >= 0 && row < 5 && digits[number][row][col] === '1') rgb = [255, 255, 255];
  if (v > .87 && v < .91 && u > .28 && u < .72) rgb = [239, 173, 54];
  return rgb;
}
function encode(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))
  ]);
}
function png(size, number) {
  const rowBytes = size * 3 + 1;
  const pixels = Buffer.alloc(rowBytes * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) pixels.set(iconColor(x / size, y / size, number), y * rowBytes + 1 + x * 3);
  }
  return encode(size, size, pixels);
}
// Imagen de arranque de iOS: fondo del manifiesto con el icono centrado.
function splash(width, height, number) {
  const rowBytes = width * 3 + 1;
  const pixels = Buffer.alloc(rowBytes * height);
  const side = Math.round(width * .32);
  const left = Math.round((width - side) / 2);
  const top = Math.round((height - side) / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside = x >= left && x < left + side && y >= top && y < top + side;
      pixels.set(inside ? iconColor((x - left) / side, (y - top) / side, number) : [238, 244, 250], y * rowBytes + 1 + x * 3);
    }
  }
  return encode(width, height, pixels);
}
const iphoneSplash = [
  [1320, 2868], [1206, 2622], [1290, 2796], [1179, 2556], [1284, 2778],
  [1170, 2532], [1125, 2436], [1242, 2688], [828, 1792], [1242, 2208], [750, 1334], [640, 1136]
];
for (const folder of folders) {
  const number = Number(folder.match(/^ejercicio-(\d)/)[1]);
  const directory = path.join(__dirname, '..', folder, 'icons');
  fs.mkdirSync(directory, { recursive: true });
  for (const size of [192, 512]) fs.writeFileSync(path.join(directory, `icon-${size}.png`), png(size, number));
  console.log(`Iconos PNG generados: ${folder}`);
  if (number === 2) {
    const splashDirectory = path.join(__dirname, '..', folder, 'splash');
    fs.mkdirSync(splashDirectory, { recursive: true });
    for (const [width, height] of iphoneSplash) fs.writeFileSync(path.join(splashDirectory, `iphone-${width}x${height}.png`), splash(width, height, number));
    console.log(`Imágenes de arranque para iPhone generadas: ${iphoneSplash.length}`);
  }
}
