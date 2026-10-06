import {
  coversWholeImage,
  fitInside,
  moveCorner,
  moveRect,
  resizeTarget,
  toImageRect,
} from '@/domain/crop';

describe('fitInside', () => {
  it('dikey fotoğrafı yükseklikten sığdırıp yatayda ortalar', () => {
    const fit = fitInside({ width: 3000, height: 4000 }, { width: 400, height: 400 });
    expect(fit.scale).toBeCloseTo(0.1);
    expect(fit).toMatchObject({ width: 300, height: 400, x: 50, y: 0 });
  });

  it('geçersiz boyutta sıfır döner', () => {
    expect(fitInside({ width: 0, height: 10 }, { width: 100, height: 100 }).scale).toBe(0);
  });
});

describe('moveCorner', () => {
  const bounds = { width: 300, height: 400 };
  const start = { x: 0, y: 0, width: 300, height: 400 };

  it('sol üst köşeyi içeri çeker', () => {
    expect(moveCorner(start, 'topLeft', 50, 30, bounds, 60)).toEqual({ x: 50, y: 30, width: 250, height: 370 });
  });

  it('sağ alt köşeyi içeri çeker', () => {
    expect(moveCorner(start, 'bottomRight', -100, -50, bounds, 60)).toEqual({ x: 0, y: 0, width: 200, height: 350 });
  });

  it('sınırların dışına çıkmaz', () => {
    expect(moveCorner(start, 'topLeft', -50, -50, bounds, 60)).toEqual(start);
    expect(moveCorner(start, 'bottomRight', 80, 80, bounds, 60)).toEqual(start);
  });

  it('en küçük boyutun altına inmez', () => {
    const r = moveCorner(start, 'topRight', -1000, 1000, bounds, 60);
    expect(r.width).toBe(60);
    expect(r.height).toBe(60);
    expect(r.x).toBe(0);
    expect(r.y).toBe(340);
  });
});

describe('moveRect', () => {
  it('çerçeveyi sınırlar içinde kaydırır', () => {
    const bounds = { width: 300, height: 400 };
    const rect = { x: 50, y: 50, width: 100, height: 100 };
    expect(moveRect(rect, 20, -10, bounds)).toEqual({ x: 70, y: 40, width: 100, height: 100 });
    expect(moveRect(rect, 1000, 1000, bounds)).toEqual({ x: 200, y: 300, width: 100, height: 100 });
    expect(moveRect(rect, -1000, -1000, bounds)).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });
});

describe('toImageRect', () => {
  const image = { width: 3000, height: 4000 };

  it('ekran koordinatlarını piksele çevirir', () => {
    expect(toImageRect({ x: 30, y: 40, width: 150, height: 200 }, 0.1, image)).toEqual({
      x: 300,
      y: 400,
      width: 1500,
      height: 2000,
    });
  });

  it('tam çerçeve tüm görüntüyü verir ve taşmaz', () => {
    const r = toImageRect({ x: 0, y: 0, width: 300.04, height: 400.04 }, 0.1, image);
    expect(r).toEqual({ x: 0, y: 0, width: 3000, height: 4000 });
    expect(coversWholeImage(r, image)).toBe(true);
  });
});

describe('resizeTarget', () => {
  it('uzun kenarı 1600 pikselle sınırlar, oranı korur', () => {
    expect(resizeTarget({ width: 3000, height: 4000 })).toEqual({ width: 1200, height: 1600 });
    expect(resizeTarget({ width: 4032, height: 3024 })).toEqual({ width: 1600, height: 1200 });
  });

  it('zaten küçükse dokunmaz', () => {
    expect(resizeTarget({ width: 1200, height: 1600 })).toBeNull();
  });
});
