const ALLOWED_BRIDAL_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const BRIDAL_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
export const BRIDAL_UPLOAD_MIN_DIMENSION = 256;

export function isAllowedBridalImageType(contentType: string) {
  return ALLOWED_BRIDAL_IMAGE_TYPES.includes(contentType);
}

export function getBridalUploadExtension(contentType: string) {
  if (contentType === "image/jpeg") {
    return "jpg";
  }

  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  return "bin";
}

export function createBridalUploadKey({
  sessionId,
  photoId,
  contentType,
}: {
  sessionId: string;
  photoId: string;
  contentType: string;
}) {
  return `bridal/uploads/${sessionId}/${photoId}/original.${getBridalUploadExtension(contentType)}`;
}

function readPngDimensions(buffer: Buffer) {
  const isPng =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;

  if (!isPng) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      return null;
    }

    const marker = buffer[offset + 1];
    const segmentLength = buffer.readUInt16BE(offset + 2);

    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function readWebpDimensions(buffer: Buffer) {
  const isWebp =
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (!isWebp) {
    return null;
  }

  const chunkType = buffer.toString("ascii", 12, 16);
  if (chunkType === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunkType === "VP8 " && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }

  if (chunkType === "VP8L" && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

export function getBridalImageDimensions(buffer: Buffer, contentType: string) {
  if (contentType === "image/png") {
    return readPngDimensions(buffer);
  }

  if (contentType === "image/jpeg") {
    return readJpegDimensions(buffer);
  }

  if (contentType === "image/webp") {
    return readWebpDimensions(buffer);
  }

  return null;
}

export function isBridalImageLargeEnough(buffer: Buffer, contentType: string) {
  const dimensions = getBridalImageDimensions(buffer, contentType);

  if (!dimensions) {
    return true;
  }

  return dimensions.width >= BRIDAL_UPLOAD_MIN_DIMENSION && dimensions.height >= BRIDAL_UPLOAD_MIN_DIMENSION;
}
