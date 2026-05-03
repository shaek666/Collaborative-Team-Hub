// Generate minimal PNG icons for PWA
// This creates simple blue square icons with a "T" in the center

function createPNG(size) {
  const png = require('pngjs').PNG;
  const image = new png({ width: size, height: size });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Blue background
      image.data[idx] = 59;     // R
      image.data[idx + 1] = 130; // G
      image.data[idx + 2] = 246; // B
      image.data[idx + 3] = 255; // A

      // White "T" shape in center (simplified)
      const cx = size / 2;
      const cy = size / 2;
      const w = size * 0.6;
      const h = size * 0.6;

      // Top bar of T
      if (y >= cy - h * 0.35 && y <= cy - h * 0.1 &&
          x >= cx - w * 0.4 && x <= cx + w * 0.4) {
        image.data[idx] = 255;
        image.data[idx + 1] = 255;
        image.data[idx + 2] = 255;
      }
      // Vertical bar of T
      if (y >= cy - h * 0.35 && y <= cy + h * 0.35 &&
          x >= cx - w * 0.1 && x <= cx + w * 0.1) {
        image.data[idx] = 255;
        image.data[idx + 1] = 255;
        image.data[idx + 2] = 255;
      }
    }
  }

  return image.pack();
}

// Create 192x192 icon
const fs = require('fs');
const path = require('path');

const { PNG } = require('pngjs');

function createIcon(size) {
  return new Promise((resolve, reject) => {
    const png = new PNG({ width: size, height: size });
    const cx = size / 2;
    const cy = size / 2;
    const w = size * 0.6;
    const h = size * 0.6;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // Blue background
        png.data[idx] = 59;
        png.data[idx + 1] = 130;
        png.data[idx + 2] = 246;
        png.data[idx + 3] = 255;

        // White "T"
        if ((y >= cy - h * 0.35 && y <= cy - h * 0.1 &&
             x >= cx - w * 0.4 && x <= cx + w * 0.4) ||
            (y >= cy - h * 0.35 && y <= cy + h * 0.35 &&
             x >= cx - w * 0.1 && x <= cx + w * 0.1)) {
          png.data[idx] = 255;
          png.data[idx + 1] = 255;
          png.data[idx + 2] = 255;
        }
      }
    }

    png.pack().pipe(fs.createWriteStream(path.join(__dirname, `icon-${size}.png`)))
      .on('finish', resolve)
      .on('error', reject);
  });
}

(async () => {
  await createIcon(192);
  console.log('Created icon-192.png');
  await createIcon(512);
  console.log('Created icon-512.png');
})();
