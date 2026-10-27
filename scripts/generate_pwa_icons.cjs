const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a valid PNG file in pure Node without external native dependencies
function createPNG(width, height, r, g, b, withBadge = true) {
  // A simple PNG generator using zlib
  // PNG file structure:
  // Signature (8 bytes)
  // IHDR chunk (13 bytes data)
  // IDAT chunk (zlib compressed scanlines)
  // IEND chunk (0 bytes data)

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth: 8
  ihdrData[9] = 6; // color type: 6 (RGBA)
  ihdrData[10] = 0; // compression method: 0
  ihdrData[11] = 0; // filter method: 0
  ihdrData[12] = 0; // interlace method: 0
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data: height rows, each starting with filter byte 0 followed by width * 4 bytes (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.44; // circular logo background
  const tagSize = width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if inside central circle
      if (dist <= radius) {
        // Check if inside tag icon area
        const inTag = Math.abs(dx) <= tagSize && Math.abs(dy) <= tagSize && (dx + dy <= tagSize * 0.9);
        const inHole = Math.sqrt(Math.pow(dx + tagSize * 0.35, 2) + Math.pow(dy + tagSize * 0.35, 2)) <= tagSize * 0.2;

        if (inTag && !inHole) {
          // White tag
          rawData[pixelOffset] = 255;
          rawData[pixelOffset + 1] = 255;
          rawData[pixelOffset + 2] = 255;
          rawData[pixelOffset + 3] = 255;
        } else {
          // Blue brand color (#2563eb = 37, 99, 235)
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        // Transparent outside
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(len, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Pre-computed CRC table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

// Generate files in public/
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// 1. Copy icon.svg
const faviconSvg = fs.readFileSync(path.resolve(__dirname, '../favicon.svg'));
fs.writeFileSync(path.join(publicDir, 'icon.svg'), faviconSvg);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);

// 2. Generate 192x192, 512x512, apple-touch-icon (180x180), and maskable 512x512
const png192 = createPNG(192, 192, 37, 99, 235);
const png512 = createPNG(512, 512, 37, 99, 235);
const applePng = createPNG(180, 180, 37, 99, 235);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), applePng);

console.log('Successfully generated PWA icon assets in public/');
