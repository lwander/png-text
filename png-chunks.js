/**
 * The MIT License (MIT) Copyright (c) 2015 Hugh Kennedy
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

import {crc32Buf} from './crc32';

// Used for fast-ish conversion between uint8s and uint32s/int32s.
const uint8 = new Uint8Array(4)
const int32 = new Int32Array(uint8.buffer)
const uint32 = new Uint32Array(uint8.buffer)

export function decodeChunks(data) {
  if (data[0] !== 0x89) throw new Error('Invalid .png file header');
  if (data[1] !== 0x50) throw new Error('Invalid .png file header');
  if (data[2] !== 0x4E) throw new Error('Invalid .png file header');
  if (data[3] !== 0x47) throw new Error('Invalid .png file header');
  if (data[4] !== 0x0D) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?');
  if (data[5] !== 0x0A) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?');
  if (data[6] !== 0x1A) throw new Error('Invalid .png file header');
  if (data[7] !== 0x0A) throw new Error('Invalid .png file header: possibly caused by DOS-Unix line ending conversion?');

  let ended = false;
  let idx = 8;
  const chunks = [];

  while (idx < data.length) {
    // Read the length of the current chunk,
    // which is stored as a Uint32.
    uint8[3] = data[idx++];
    uint8[2] = data[idx++];
    uint8[1] = data[idx++];
    uint8[0] = data[idx++];

    // Chunk includes name/type for CRC check (see below).
    const length = uint32[0] + 4;
    const chunk = new Uint8Array(length);
    chunk[0] = data[idx++];
    chunk[1] = data[idx++];
    chunk[2] = data[idx++];
    chunk[3] = data[idx++];

    // Get the name in ASCII for identification.
    const name = (
      String.fromCharCode(chunk[0]) +
      String.fromCharCode(chunk[1]) +
      String.fromCharCode(chunk[2]) +
      String.fromCharCode(chunk[3])
    );

    // The IHDR header MUST come first.
    if (!chunks.length && name !== 'IHDR') {
      throw new Error('IHDR header missing');
    }

    // The IEND header marks the end of the file,
    // so on discovering it break out of the loop.
    if (name === 'IEND') {
      ended = true;
      chunks.push({
        name: name,
        data: new Uint8Array(0),
      });

      break;
    }

    // Read the contents of the chunk out of the main buffer.
    for (let i = 4; i < length; i++) chunk[i] = data[idx++];

    uint8[3] = data[idx++];
    uint8[2] = data[idx++];
    uint8[1] = data[idx++];
    uint8[0] = data[idx++];

    const crcActual = int32[0];
    const crcExpect = crc32Buf(chunk);
    if (crcExpect !== crcActual) throw new Error(`CRC values for ${name} header do not match, PNG file is likely corrupted`);

    const newData = new Uint8Array(chunk.buffer.slice(4));
    chunks.push({ name, data: newData });
  }

  if (!ended) throw new Error('.png file ended prematurely: no IEND header was found');

  return chunks;
}

export function encodeChunks(chunks) {
  let totalSize = 8;
  let idx = totalSize;
  let i;

  for (i = 0; i < chunks.length; i++) {
    // 4 bytes name, 4 bytes size, 4 bytes CRC32
    totalSize += (chunks[i].data.length + 12);
  }

  const output = new Uint8Array(totalSize);

  output[0] = 0x89;
  output[1] = 0x50;
  output[2] = 0x4E;
  output[3] = 0x47;
  output[4] = 0x0D;
  output[5] = 0x0A;
  output[6] = 0x1A;
  output[7] = 0x0A;

  for (i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const name = chunk.name;
    const data = chunk.data;
    const size = data.length;
    const nameChars = [
      name.charCodeAt(0),
      name.charCodeAt(1),
      name.charCodeAt(2),
      name.charCodeAt(3),
    ];

    uint32[0] = size;
    output[idx++] = uint8[3];
    output[idx++] = uint8[2];
    output[idx++] = uint8[1];
    output[idx++] = uint8[0];

    output[idx++] = nameChars[0];
    output[idx++] = nameChars[1];
    output[idx++] = nameChars[2];
    output[idx++] = nameChars[3];

    for (let j = 0; j < size;) {
      output[idx++] = data[j++];
    }

    const crcCheck = nameChars.concat(Array.prototype.slice.call(data));
    int32[0] = crc32Buf(crcCheck);
    output[idx++] = uint8[3];
    output[idx++] = uint8[2];
    output[idx++] = uint8[1];
    output[idx++] = uint8[0];
  }

  return output;
}
