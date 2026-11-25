const zlib = require('node:zlib');

// Node < 22.15 lacks zlib.createZstdDecompress, which undici@8 (used by jsdom@31) binds at import time.
if (typeof zlib.createZstdDecompress !== 'function') {
  zlib.createZstdDecompress = () => {
    throw new Error('Zstd decompression is not supported in this Node.js runtime');
  };
}
