/**
 * Basit TAR (ustar) okuyucu/yazıcı. Sadece düz dosyalar; dosya içerikleri sırayla akıtılır,
 * böylece yüzlerce fotoğraf aynı anda belleğe alınmaz. Dosya erişimi ByteWriter/ByteReader ile soyutlanır.
 */
import { utf8Decode, utf8Encode } from './utf8';

const BLOCK = 512;

export interface ByteWriter {
  write(bytes: Uint8Array): void;
}

export interface ByteReader {
  /** En fazla length bayt okur; dosya sonunda daha az döner. */
  read(length: number): Uint8Array;
}

function writeString(block: Uint8Array, offset: number, length: number, value: string): void {
  const bytes = utf8Encode(value);
  if (bytes.length > length) throw new Error(`TAR alanı çok uzun: ${value}`);
  block.set(bytes, offset);
}

function writeOctal(block: Uint8Array, offset: number, length: number, value: number): void {
  // length-1 basamak + NUL
  writeString(block, offset, length, value.toString(8).padStart(length - 1, '0'));
}

function checksum(block: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < BLOCK; i++) sum += i >= 148 && i < 156 ? 0x20 : block[i];
  return sum;
}

export function encodeHeader(name: string, size: number, mtimeSeconds: number): Uint8Array {
  if (utf8Encode(name).length > 100) throw new Error(`Dosya adı çok uzun: ${name}`);
  const block = new Uint8Array(BLOCK);
  writeString(block, 0, 100, name);
  writeOctal(block, 100, 8, 0o644);
  writeOctal(block, 108, 8, 0);
  writeOctal(block, 116, 8, 0);
  writeOctal(block, 124, 12, size);
  writeOctal(block, 136, 12, Math.floor(mtimeSeconds));
  block[156] = 0x30; // '0' = düz dosya
  writeString(block, 257, 6, 'ustar');
  writeString(block, 263, 2, '00');
  const sum = checksum(block);
  writeString(block, 148, 8, `${sum.toString(8).padStart(6, '0')}\0 `);
  return block;
}

function readString(block: Uint8Array, offset: number, length: number): string {
  const slice = block.subarray(offset, offset + length);
  const end = slice.indexOf(0);
  return utf8Decode(end === -1 ? slice : slice.subarray(0, end));
}

function readOctal(block: Uint8Array, offset: number, length: number): number {
  const text = readString(block, offset, length).trim();
  return text === '' ? 0 : parseInt(text, 8);
}

export type TarHeader = { name: string; size: number; isFile: boolean };

/** Başlığı çözer; arşiv sonu (sıfır blok) için null. Bozuk başlıkta hata verir. */
export function decodeHeader(block: Uint8Array): TarHeader | null {
  if (block.length < BLOCK) throw new Error('Yedek dosyası eksik ya da bozuk.');
  if (block.every((b) => b === 0)) return null;
  const stored = readOctal(block, 148, 8);
  if (stored !== checksum(block)) throw new Error('Yedek dosyası bozuk (sağlama hatası).');
  const type = block[156];
  return { name: readString(block, 0, 100), size: readOctal(block, 124, 12), isFile: type === 0x30 || type === 0 };
}

function paddingFor(size: number): number {
  return (BLOCK - (size % BLOCK)) % BLOCK;
}

export function writeEntry(writer: ByteWriter, name: string, data: Uint8Array, mtimeSeconds: number): void {
  writer.write(encodeHeader(name, data.length, mtimeSeconds));
  writer.write(data);
  const pad = paddingFor(data.length);
  if (pad > 0) writer.write(new Uint8Array(pad));
}

export function writeEnd(writer: ByteWriter): void {
  writer.write(new Uint8Array(BLOCK * 2));
}

function readExactly(reader: ByteReader, length: number): Uint8Array {
  const bytes = reader.read(length);
  if (bytes.length !== length) throw new Error('Yedek dosyası eksik ya da bozuk.');
  return bytes;
}

/** Arşivdeki düz dosyaları sırayla verir; her içerik yalnızca kendi çağrısı sırasında bellekte durur. */
export function readEntries(reader: ByteReader, onEntry: (name: string, data: Uint8Array) => void): void {
  for (;;) {
    const header = decodeHeader(readExactly(reader, BLOCK));
    if (!header) return;
    const data = readExactly(reader, header.size);
    const pad = paddingFor(header.size);
    if (pad > 0) readExactly(reader, pad);
    if (header.isFile) onEntry(header.name, data);
  }
}
