const ALLOWED_BRIDAL_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const BRIDAL_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

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

