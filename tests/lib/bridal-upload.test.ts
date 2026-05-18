import {
  BRIDAL_UPLOAD_MAX_BYTES,
  BRIDAL_UPLOAD_MIN_DIMENSION,
  createBridalUploadKey,
  getBridalImageDimensions,
  getBridalUploadExtension,
  isBridalImageLargeEnough,
  isAllowedBridalImageType,
} from "@/lib/bridal/upload";

const oneByOnePng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

describe("bridal upload helpers", () => {
  it("allows only supported image types", () => {
    expect(isAllowedBridalImageType("image/jpeg")).toBe(true);
    expect(isAllowedBridalImageType("image/png")).toBe(true);
    expect(isAllowedBridalImageType("image/webp")).toBe(true);
    expect(isAllowedBridalImageType("image/gif")).toBe(false);
  });

  it("maps content types to stable extensions", () => {
    expect(getBridalUploadExtension("image/jpeg")).toBe("jpg");
    expect(getBridalUploadExtension("image/png")).toBe("png");
    expect(getBridalUploadExtension("image/webp")).toBe("webp");
  });

  it("creates private bridal upload keys", () => {
    expect(
      createBridalUploadKey({
        sessionId: "session-1",
        photoId: "photo-1",
        contentType: "image/jpeg",
      })
    ).toBe("bridal/uploads/session-1/photo-1/original.jpg");
  });

  it("keeps the upload limit at 8MB", () => {
    expect(BRIDAL_UPLOAD_MAX_BYTES).toBe(8 * 1024 * 1024);
  });

  it("reads PNG dimensions from the upload buffer", () => {
    expect(getBridalImageDimensions(oneByOnePng, "image/png")).toEqual({
      width: 1,
      height: 1,
    });
  });

  it("rejects tiny images before paid generation", () => {
    expect(BRIDAL_UPLOAD_MIN_DIMENSION).toBe(256);
    expect(isBridalImageLargeEnough(oneByOnePng, "image/png")).toBe(false);
  });
});
