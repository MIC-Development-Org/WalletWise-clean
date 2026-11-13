/** Profile photos are resized here, on the device, to a small square JPEG before they are stored or synced. */

export const PHOTO_SIZE = 256;
export const MAX_PHOTO_FILE_BYTES = 12 * 1024 * 1024;

export class PhotoError extends Error {}

/**
 * Crops the middle square, scales it to 256px and returns a JPEG data URL (roughly 10 to 30 KB).
 * Rejects things that are not images, and files too big to be worth decoding.
 */
export async function photoFromFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new PhotoError('Choose an image file, like a JPEG or PNG.');
  if (file.size > MAX_PHOTO_FILE_BYTES) throw new PhotoError('That image is too large. Choose one under 12 MB.');

  let bitmap: ImageBitmap;
  try {
    // imageOrientation applies the camera's rotation so phone photos are not sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new PhotoError('That image could not be read. Try a JPEG or PNG.');
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PhotoError('Your browser could not process the image.');
  // White behind transparent PNGs, since JPEG has no transparency.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  bitmap.close();

  const url = canvas.toDataURL('image/jpeg', 0.85);
  // The server accepts up to 70,000 characters. A 256px JPEG is far below that.
  if (url.length > 70_000) throw new PhotoError('That image is too detailed to use. Try a simpler photo.');
  return url;
}
