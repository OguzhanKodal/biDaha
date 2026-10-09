// Google Play tanıtım görseli (feature graphic): 1024×500, saydamlıksız PNG.
// Kullanım: swiftc -O -o fg scripts/store/feature-graphic.swift && ./fg <ikon.png> <çıktı.png>
import AppKit

let width: CGFloat = 1024, height: CGFloat = 500
let args = CommandLine.arguments
let iconPath = args.count > 1 ? args[1] : "assets/images/icon.png"
let outPath = args.count > 2 ? args[2] : "feature-graphic.png"

func color(_ hex: UInt32, _ alpha: CGFloat = 1) -> NSColor {
  NSColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255, blue: CGFloat(hex & 0xFF) / 255, alpha: alpha)
}

let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width), pixelsHigh: Int(height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
let gc = NSGraphicsContext(bitmapImageRep: rep)!
NSGraphicsContext.current = NSGraphicsContext(cgContext: gc.cgContext, flipped: true)
let ctx = gc.cgContext
ctx.translateBy(x: 0, y: height); ctx.scaleBy(x: 1, y: -1)

// Zemin: krem, sağda hafif hardal leke
color(0xFBF8F1).setFill(); NSRect(x: 0, y: 0, width: width, height: height).fill()
color(0xE8C468, 0.35).setFill(); NSBezierPath(ovalIn: NSRect(x: 700, y: -160, width: 520, height: 520)).fill()
color(0xE8C468, 0.22).setFill(); NSBezierPath(ovalIn: NSRect(x: -120, y: 330, width: 340, height: 340)).fill()

// İkon (yuvarlatılmış kare, gölgeli)
if let icon = NSImage(contentsOfFile: iconPath) {
  let iconRect = NSRect(x: 84, y: 110, width: 280, height: 280)
  ctx.saveGState()
  ctx.setShadow(offset: CGSize(width: 0, height: 14), blur: 36, color: color(0x5A4310, 0.25).cgColor)
  color(0xFBF8F1).setFill()
  NSBezierPath(roundedRect: iconRect, xRadius: 64, yRadius: 64).fill()
  ctx.restoreGState()
  ctx.saveGState()
  NSBezierPath(roundedRect: iconRect, xRadius: 64, yRadius: 64).addClip()
  icon.draw(in: iconRect, from: .zero, operation: .sourceOver, fraction: 1, respectFlipped: true, hints: nil)
  ctx.restoreGState()
}

// Yazılar
let ink = color(0x2B2721), muted = color(0x6B6357), accent = color(0x7A5D0C)
NSAttributedString(string: "biDaha", attributes: [.font: NSFont.systemFont(ofSize: 92, weight: .heavy), .foregroundColor: ink, .kern: -2])
  .draw(at: CGPoint(x: 412, y: 112))
NSAttributedString(string: "Yanlış Soru Defteri", attributes: [.font: NSFont.systemFont(ofSize: 44, weight: .bold), .foregroundColor: accent])
  .draw(at: CGPoint(x: 416, y: 222))
NSAttributedString(string: "Çözemediğin soruyu fotoğrafla,\nunutmadan önce tekrar et.", attributes: [
  .font: NSFont.systemFont(ofSize: 30, weight: .medium), .foregroundColor: muted,
  .paragraphStyle: { let p = NSMutableParagraphStyle(); p.lineSpacing = 6; return p }(),
]).draw(with: NSRect(x: 416, y: 290, width: 560, height: 120), options: [.usesLineFragmentOrigin])
NSAttributedString(string: "YKS · DGS · KPSS", attributes: [.font: NSFont.systemFont(ofSize: 24, weight: .semibold), .foregroundColor: muted, .kern: 1])
  .draw(at: CGPoint(x: 416, y: 392))

NSGraphicsContext.restoreGraphicsState()
// Saydamlıksız RGB
let opaque = CGContext(data: nil, width: Int(width), height: Int(height), bitsPerComponent: 8, bytesPerRow: 0,
  space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
opaque.draw(rep.cgImage!, in: CGRect(x: 0, y: 0, width: width, height: height))
try! NSBitmapImageRep(cgImage: opaque.makeImage()!).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: outPath))
print("✓ \(outPath)")
