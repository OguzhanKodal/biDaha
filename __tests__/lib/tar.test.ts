import { decodeHeader, encodeHeader, readEntries, writeEnd, writeEntry, type ByteReader, type ByteWriter } from '@/lib/tar';
import { utf8Decode, utf8Encode } from '@/lib/utf8';

class MemoryWriter implements ByteWriter {
  chunks: Uint8Array[] = [];
  write(bytes: Uint8Array) {
    this.chunks.push(bytes.slice());
  }
  bytes(): Uint8Array {
    const total = this.chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of this.chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return out;
  }
}

class MemoryReader implements ByteReader {
  private offset = 0;
  constructor(private readonly data: Uint8Array) {}
  read(length: number): Uint8Array {
    const out = this.data.subarray(this.offset, this.offset + length);
    this.offset += out.length;
    return out;
  }
}

describe('utf8', () => {
  it('Türkçe karakterleri ve emojiyi gidiş-dönüş korur', () => {
    const text = 'İşlem hatası, çğıöşü ÇĞİÖŞÜ — 📚';
    expect(utf8Decode(utf8Encode(text))).toBe(text);
    expect(Array.from(utf8Encode('ş'))).toEqual([0xc5, 0x9f]);
  });
});

describe('tar', () => {
  it('başlık 512 bayttır ve çözülür', () => {
    const header = encodeHeader('photos/a.jpg', 1234, 1_700_000_000);
    expect(header).toHaveLength(512);
    expect(decodeHeader(header)).toEqual({ name: 'photos/a.jpg', size: 1234, isFile: true });
  });

  it('dosyaları yazıp aynı sırayla ve içerikle okur', () => {
    const writer = new MemoryWriter();
    const files: [string, Uint8Array][] = [
      ['manifest.json', utf8Encode('{"a":"Türkçe"}')],
      ['photos/empty.jpg', new Uint8Array(0)],
      ['photos/exact.jpg', new Uint8Array(512).fill(7)],
      ['photos/big.jpg', Uint8Array.from({ length: 1300 }, (_, i) => i % 251)],
    ];
    for (const [name, data] of files) writeEntry(writer, name, data, 1_700_000_000);
    writeEnd(writer);

    const archive = writer.bytes();
    expect(archive.length % 512).toBe(0);

    const read: [string, Uint8Array][] = [];
    readEntries(new MemoryReader(archive), (name, data) => read.push([name, data.slice()]));
    expect(read.map(([n]) => n)).toEqual(files.map(([n]) => n));
    read.forEach(([, data], i) => expect(Array.from(data)).toEqual(Array.from(files[i][1])));
  });

  it('bozuk başlığı reddeder', () => {
    const header = encodeHeader('a.json', 3, 0);
    header[0] = 'b'.charCodeAt(0);
    expect(() => decodeHeader(header)).toThrow(/bozuk/);
  });

  it('yarıda kesilmiş dosyayı reddeder', () => {
    const writer = new MemoryWriter();
    writeEntry(writer, 'data.json', new Uint8Array(2000), 0);
    const truncated = writer.bytes().subarray(0, 1000);
    expect(() => readEntries(new MemoryReader(truncated), () => {})).toThrow(/eksik/);
  });

  it('çok uzun dosya adını reddeder', () => {
    expect(() => encodeHeader('x'.repeat(101), 0, 0)).toThrow();
  });
});
