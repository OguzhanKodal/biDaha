// App Store tanıtım görselleri: ekran görüntüsü + başlık. Çıktı 1320×2868 (6.9" iPhone).
// Kullanım: swift scripts/store/compose-screenshots.swift <ham görüntü klasörü> <çıktı klasörü>
// Ham görüntüler: 1-today.png, 2-review.png, ... (iPhone 17 Pro Max simülatörü, 1320×2868).
import AppKit

struct Slide {
  let input: String
  let title: String
  let subtitle: String
  let dark: Bool
}

let slides = [
  Slide(input: "1-today", title: "Bugün neyi tekrar\nedeceğini bil", subtitle: "Sınav geri sayımı, bugünkü soruların\nve serin tek ekranda.", dark: false),
  Slide(input: "2-review", title: "Kaydır: çözdün mü,\nçözemedin mi?", subtitle: "Sorular tam unutmak üzereyken\nkarşına çıkar.", dark: false),
  Slide(input: "3-question", title: "Çözemediğin soruyu\nfotoğrafla", subtitle: "Doğru şık, hata nedeni, not ve\nçözümüyle birlikte.", dark: false),
  Slide(input: "4-stats", title: "Hatalarını tanı", subtitle: "İlerlemeni ve en sık yaptığın\nhata türünü gör.", dark: false),
  Slide(input: "5-folders", title: "Derslerin hazır,\nsoruların düzenli", subtitle: "YKS, DGS, KPSS dersleri hazır;\nkonu klasörleri ve renkler.", dark: false),
  Slide(input: "6-dark", title: "Hesap yok,\nveriler telefonunda", subtitle: "İnternet gerekmez. Koyu mod ve\nbüyük yazı desteği.", dark: true),
]

func color(_ hex: UInt32) -> NSColor {
  NSColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
}

let width: CGFloat = 1320, height: CGFloat = 2868
let args = CommandLine.arguments
let inputDir = args.count > 1 ? args[1] : "."
let outputDir = args.count > 2 ? args[2] : "."

for (index, slide) in slides.enumerated() {
  guard let shot = NSImage(contentsOfFile: "\(inputDir)/\(slide.input).png") else {
    print("✗ eksik: \(slide.input).png")
    continue
  }
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width), pixelsHigh: Int(height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  let gc = NSGraphicsContext(bitmapImageRep: rep)!
  NSGraphicsContext.current = NSGraphicsContext(cgContext: gc.cgContext, flipped: true)
  let ctx = gc.cgContext
  ctx.translateBy(x: 0, y: height); ctx.scaleBy(x: 1, y: -1)

  let background = slide.dark ? color(0x1C1A17) : color(0xFBF8F1)
  let titleColor = slide.dark ? color(0xF2EDE3) : color(0x2B2721)
  let subtitleColor = slide.dark ? color(0xB3AA9B) : color(0x6B6357)
  background.setFill(); NSRect(x: 0, y: 0, width: width, height: height).fill()

  // Arka planda hafif hardal leke (marka dokunuşu)
  let accent = slide.dark ? color(0xB88A1E).withAlphaComponent(0.18) : color(0xE8C468).withAlphaComponent(0.35)
  accent.setFill()
  NSBezierPath(ovalIn: NSRect(x: index % 2 == 0 ? 760 : -320, y: 1300, width: 900, height: 900)).fill()

  let center = NSMutableParagraphStyle(); center.alignment = .center; center.lineSpacing = 6
  let title = NSAttributedString(string: slide.title, attributes: [
    .font: NSFont.systemFont(ofSize: 104, weight: .heavy), .foregroundColor: titleColor, .paragraphStyle: center, .kern: -1.5,
  ])
  let subtitle = NSAttributedString(string: slide.subtitle, attributes: [
    .font: NSFont.systemFont(ofSize: 50, weight: .medium), .foregroundColor: subtitleColor, .paragraphStyle: center,
  ])
  // Başlık + açıklama bloğu, ekran görüntüsünün üstündeki alanda dikey ortalanır (tek ya da iki satır fark etmez).
  let titleSize = title.boundingRect(with: CGSize(width: width - 160, height: 600), options: [.usesLineFragmentOrigin]).size
  let subtitleSize = subtitle.boundingRect(with: CGSize(width: width - 220, height: 300), options: [.usesLineFragmentOrigin]).size
  let gap: CGFloat = 36
  let blockTop = 110 + (600 - (titleSize.height + gap + subtitleSize.height)) / 2
  title.draw(with: NSRect(x: 80, y: blockTop, width: width - 160, height: titleSize.height + 10), options: [.usesLineFragmentOrigin])
  subtitle.draw(
    with: NSRect(x: 110, y: blockTop + titleSize.height + gap, width: width - 220, height: subtitleSize.height + 10),
    options: [.usesLineFragmentOrigin])

  // Ekran görüntüsü: yuvarlak köşe, gölge, ince çerçeve; alt kısım tuvalden taşar.
  let shotWidth: CGFloat = 1060
  let shotHeight = shotWidth * shot.size.height / shot.size.width
  let shotRect = NSRect(x: (width - shotWidth) / 2, y: 740, width: shotWidth, height: shotHeight)
  let radius: CGFloat = 96
  ctx.saveGState()
  ctx.setShadow(offset: CGSize(width: 0, height: 30), blur: 80, color: NSColor.black.withAlphaComponent(slide.dark ? 0.6 : 0.22).cgColor)
  (slide.dark ? color(0x2E2A24) : NSColor.white).setFill()
  NSBezierPath(roundedRect: shotRect.insetBy(dx: -14, dy: -14), xRadius: radius + 14, yRadius: radius + 14).fill()
  ctx.restoreGState()
  ctx.saveGState()
  NSBezierPath(roundedRect: shotRect, xRadius: radius, yRadius: radius).addClip()
  shot.draw(in: shotRect, from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: true, hints: nil)
  ctx.restoreGState()

  NSGraphicsContext.restoreGraphicsState()

  // App Store görselleri saydamlık içermemeli: opak RGB olarak yeniden çiz.
  let opaque = CGContext(
    data: nil, width: Int(width), height: Int(height), bitsPerComponent: 8, bytesPerRow: 0,
    space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  opaque.draw(rep.cgImage!, in: CGRect(x: 0, y: 0, width: width, height: height))
  let output = NSBitmapImageRep(cgImage: opaque.makeImage()!)
  let path = "\(outputDir)/\(String(format: "%02d", index + 1))-\(slide.input).png"
  try! output.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
  print("✓ \(path)")
}
