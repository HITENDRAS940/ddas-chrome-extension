import struct
import zlib
def create_png(width, height, filename):
    """Create a simple purple PNG file"""
    # Purple color RGB
    r, g, b = 102, 126, 234
    # Create pixel data (purple for all pixels)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type (none)
        for x in range(width):
            raw_data += bytes([r, g, b])
    # Compress pixel data
    compressed_data = zlib.compress(raw_data, 9)
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png += struct.pack('>I', len(ihdr_data))
    png += b'IHDR' + ihdr_data
    png += struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    # IDAT chunk
    png += struct.pack('>I', len(compressed_data))
    png += b'IDAT' + compressed_data
    png += struct.pack('>I', zlib.crc32(b'IDAT' + compressed_data) & 0xffffffff)
   import struct
import zlib
def create_png(width, height, filename):
    """Create a simple pu, import zlib
'Idef createff    """Create a simple purple PNG file"s     # Purple color RGB
    r, g, b = 102Cr    r, g, b = 102, 12dt    # Create pixel data (pl     raw_data = b''
    for y in range(height):g'    for y in rang48        raw_data += b'\x00(1        for x in range(width):
            raw_dcr           ssfully!')
