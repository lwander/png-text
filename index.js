/**
 * MIT License
 *
 * Copyright (c) 2024 Lars Wander
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import {encodeChunks, decodeChunks} from './png-chunks';

// Adapted from https://github.com/hometlt/png-metadata

function textToChunk(key, value) {
  key = String(key)
  value = String(value)

  const isValidAscii = (v) => /^[\x01-\xFF]+$/.test(v);

  if (!isValidAscii(key) || !isValidAscii(value)) throw new Error('Only ASCII chars permitted')
  if (key.length >= 80) throw new Error(`Key may not exceed 79 chars, got: ${key}, ${key.length} chars`);

  const totalSize = key.length + value.length + 1;
  const data = new Uint8Array(totalSize);
  let idx = 0;

  function write(val) {
    for (let i = 0; i < val.length; i++) {
      data[idx++] = val.charCodeAt(i);
    }
  }

  write(key);
  data[idx++] = 0;
  write(value);

  return { name: 'tEXt', data };
}

function chunkToText(chunk) {
  if (chunk.name !== 'tEXt') throw new Error(`Expected a tEXt chunk, got: ${chunk.name}`);
  let key = '';
  let value = '';
  let hasKey = false;
  for (const v of chunk.data) {
    if (hasKey) {
      if (v === 0) throw new Error("At most one null character permitted per chunk");
      value += String.fromCharCode(v);
    } else {
      if (v === 0) hasKey = true;
      else key += String.fromCharCode(v);
    }
  }
  return [key, value];
}

function blobToArrayBuffer(blob) {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      resolve(event.target.result);
    };
    fileReader.readAsArrayBuffer(blob);
  });
}

/**
 * Returns a promise that creates a copy of the input PNG, with a new tEXt 
 * entry for every key/value pair in the input metadata.
 * @param {Blob} png - the input PNG-encoded input image.
 * @param {Map<string, string>} metadata - key/value pairs representing the 
 *                                         new tEXt entries to be written.
 */
export async function writeTextToBlob(png, metadata) {
  const arrayBuffer = await blobToArrayBuffer(png);
  const uint8Array = new Uint8Array(arrayBuffer);
  const chunks = decodeChunks(uint8Array);
  const entries = (metadata instanceof Map) ? metadata.entries() : Object.entries(metadata);
  for (const [key, value] of entries) chunks.unshift(textToChunk(key, value));
  const content = encodeChunks(chunks)
  return new Blob([content], {type : blob.type});
}

/**
 * Returns a Map<string, string> containing all tEXt key/value pairs in the 
 * input PNG blob.
 * @param {Blob} png - the PNG-encoded image to read tEXt from.
 */
export async function readTextFromBlob(png) {
  const metadata = new Map();
  const arrayBuffer = await blobToArrayBuffer(png);
  const uint8Array = new Uint8Array(arrayBuffer);
  const chunks = decodeChunks(uint8Array);
  for (const chunk of chunks) {
    if (chunk.name === 'tEXt') {
      const [key, value] = chunkToText(chunk);
      metadata.set(key, value);
    }
  }
  return metadata;
}
