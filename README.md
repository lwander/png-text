# PNG-TEXT

A small library for reading and writing arbitrary [PNG tEXt chunks](https://www.w3.org/TR/PNG-Chunks.html).

The PNG specification allows for key/value strings to be attached to an image (the strings must be ASCII, and the key cannot exceed 79 characters).

## Installation

```
npm i @larswander/png-text
```

## Usage

```js

import {writeTextToBlob, readTextFromBlob} from 'png-text';

// Say we want to write these entries to a PNG file.
const metadata = {author: 'me', hash: '123'};

// If you have a canvas object....
canvas.toBlob(blob => {
  const newBlob = await writeTextToBlob(blob, metadata);
  const newMetadata = await readTextFromBlob(newBlob);
  console.log(newMetadata) // author: me, hash: 123
}, 'image/png');

// If you have an image you load remotely...
fetch('my-image.png')
  .then(response => response.blob())
  .then(blob => {
    const newBlob = await writeTextToBlob(blob, metadata);
    const newMetadata = await readTextFromBlob(newBlob);
    console.log(newMetadata) // author: me, hash: 123
  });
```

## Reading entries with PIL

You can easily read these PNG chunks with PIL (Python Image Library)

```py
from PIL import Image

image = Image.open('myimage.png');
for k, v image.text.items():
    print(f'{k}: {v}')
```
