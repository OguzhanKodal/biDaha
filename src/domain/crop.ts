/**
 * Serbest kırpma ekranının saf hesapları. Kırpma çerçevesi ekranda gösterilen
 * (sığdırılmış) görüntünün koordinatlarında tutulur, kaydederken piksele çevrilir.
 */

export type Size = { width: number; height: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/** SPEC §4: uzun kenar en fazla ~1600 px. */
export const maxPhotoLongEdge = 1600;
export const photoJpegQuality = 0.7;

/** Görüntüyü kutuya oranını bozmadan sığdırır (contain). */
export function fitInside(image: Size, container: Size): Rect & { scale: number } {
  if (image.width <= 0 || image.height <= 0 || container.width <= 0 || container.height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0, scale: 0 };
  }
  const scale = Math.min(container.width / image.width, container.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (container.width - width) / 2, y: (container.height - height) / 2, width, height, scale };
}

export function fullRect(bounds: Size): Rect {
  return { x: 0, y: 0, width: bounds.width, height: bounds.height };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Bir köşeyi (başlangıç çerçevesine göre) dx/dy kadar taşır; çerçeve sınır içinde ve en az minSize kalır. */
export function moveCorner(start: Rect, corner: Corner, dx: number, dy: number, bounds: Size, minSize: number): Rect {
  let left = start.x;
  let top = start.y;
  let right = start.x + start.width;
  let bottom = start.y + start.height;
  const min = Math.min(minSize, bounds.width, bounds.height);

  if (corner === 'topLeft' || corner === 'bottomLeft') left = clamp(left + dx, 0, right - min);
  if (corner === 'topRight' || corner === 'bottomRight') right = clamp(right + dx, left + min, bounds.width);
  if (corner === 'topLeft' || corner === 'topRight') top = clamp(top + dy, 0, bottom - min);
  if (corner === 'bottomLeft' || corner === 'bottomRight') bottom = clamp(bottom + dy, top + min, bounds.height);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** Çerçeveyi boyutunu koruyarak kaydırır; sınırların dışına çıkmaz. */
export function moveRect(start: Rect, dx: number, dy: number, bounds: Size): Rect {
  return {
    ...start,
    x: clamp(start.x + dx, 0, bounds.width - start.width),
    y: clamp(start.y + dy, 0, bounds.height - start.height),
  };
}

/** Ekrandaki çerçeveyi görüntü piksel koordinatlarına çevirir (tam sayı, görüntü içinde). */
export function toImageRect(display: Rect, displayScale: number, image: Size): Rect {
  if (displayScale <= 0) return fullRect(image);
  const x = clamp(Math.round(display.x / displayScale), 0, image.width - 1);
  const y = clamp(Math.round(display.y / displayScale), 0, image.height - 1);
  const width = clamp(Math.round(display.width / displayScale), 1, image.width - x);
  const height = clamp(Math.round(display.height / displayScale), 1, image.height - y);
  return { x, y, width, height };
}

/** Çerçeve görüntünün tamamını kaplıyorsa kırpmaya gerek yok. */
export function coversWholeImage(rect: Rect, image: Size): boolean {
  return rect.x === 0 && rect.y === 0 && rect.width === image.width && rect.height === image.height;
}

/** Uzun kenarı sınıra indirmek için hedef boyut; zaten küçükse null. */
export function resizeTarget(size: Size, maxLongEdge: number = maxPhotoLongEdge): Size | null {
  const longEdge = Math.max(size.width, size.height);
  if (longEdge <= maxLongEdge) return null;
  const ratio = maxLongEdge / longEdge;
  return { width: Math.round(size.width * ratio), height: Math.round(size.height * ratio) };
}
