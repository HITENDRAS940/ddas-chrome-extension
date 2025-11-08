#!/bin/bash
# Create icon files for DDAS Chrome Extension

cd "$(dirname "$0")"

echo "Creating icon files..."

# Create icon16.png (16x16 blue square)
python3 << 'EOF'
import struct, zlib
def create_png(filename, size):
    sig = b'\x89PNG\r\n\x1a\n'
    blue = b'\x42\x85\xf4'
    raw = b''.join([b'\x00' + blue * size for _ in range(size)])
    compressed = zlib.compress(raw, 9)
    def chunk(t, d):
        cd = t + d
        return struct.pack('>I', len(d)) + cd + struct.pack('>I', zlib.crc32(cd) & 0xffffffff)
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')
    with open(filename, 'wb') as f:
        f.write(sig + ihdr + idat + iend)
    return filename

for s in [16, 48, 128]:
    print(f"Created {create_png(f'icon{s}.png', s)}")
EOF

echo "Icon files created successfully!"
ls -lh icon*.png

