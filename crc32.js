/**
 * Copyright (C) 2014-present SheetJS LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function crc32SignedTable() {
  const table = new Array(256);
  let c = 0;

  for (let n = 0; n != 256; ++n) {
    c = n;
    c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
    c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
    c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
    c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
    c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
    c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
    c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
    c = ((c&1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
    table[n] = c;
  }

  return new Int32Array(table);
}

const CRC32_TABLE = crc32SignedTable();

function crc32Buf8(buf, seed) {
  let C = seed ^ -1, L = buf.length - 7;
  let i = 0;
  for (; i < L;) {
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
  }
  while (i < L+7) C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
  return C ^ -1;
}

export function crc32Buf(buf, seed) {
  if(buf.length > 10000) return crc32Buf8(buf, seed);
  let C = seed ^ -1, L = buf.length - 3;
  let i = 0;
  for (; i < L;) {
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
    C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
  }
  while (i < L+3) C = (C>>>8) ^ CRC32_TABLE[(C^buf[i++])&0xFF];
  return C ^ -1;
}
