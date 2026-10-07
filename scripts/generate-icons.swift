// biDaha ikon üretici. Çalıştır: swift scripts/generate-icons.swift
// Tasarım: köşesi kıvrık soru kâğıdı + "bir daha" dönen ok rozeti. Renkler src/theme/colors.ts ile uyumlu.
import AppKit
import CoreGraphics

struct Palette {
  let background: CGColor?
  let paper: CGColor
  let lines: CGColor
  let highlight: CGColor
  let fold: CGColor
  let badge: CGColor
  let arrow: CGColor
  let shadow: CGColor
}

func rgb(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
  CGColor(
    red: CGFloat((hex >> 16) & 0xFF) / 255,
    green: CGFloat((hex >> 8) & 0xFF) / 255,
    blue: CGFloat(hex & 0xFF) / 255,
    alpha: alpha)
}

let light = Palette(
  background: rgb(0xFBF8F1), paper: rgb(0xFFFFFF), lines: rgb(0xDDD3BF), highlight: rgb(0xE8C468),
  fold: rgb(0xE3BE5C), badge: rgb(0xA67C00), arrow: rgb(0xFFFFFF), shadow: rgb(0x5A4310, 0.18))

let dark = Palette(
  background: rgb(0x1C1A17), paper: rgb(0x2E2A24), lines: rgb(0x4B453B), highlight: rgb(0xB88A1E),
  fold: rgb(0xB88A1E), badge: rgb(0xE3C06A), arrow: rgb(0x231F18), shadow: rgb(0x000000, 0.45))

/// Glif 1024'lük tasarım alanında, sol üst köşe başlangıçlı koordinatlarla çizilir.
func drawGlyph(_ ctx: CGContext, _ p: Palette, monochrome: CGColor? = nil) {
  let paperColor = monochrome ?? p.paper
  // Kâğıt: hafif eğik, köşesi kıvrık.
  ctx.saveGState()
  ctx.translateBy(x: 470, y: 500)
  ctx.rotate(by: -6 * .pi / 180)
  let w: CGFloat = 470, h: CGFloat = 600, r: CGFloat = 44, fold: CGFloat = 130
  let x = -w / 2, y = -h / 2
  let paper = CGMutablePath()
  paper.move(to: CGPoint(x: x + r, y: y))
  paper.addLine(to: CGPoint(x: x + w - fold, y: y))
  paper.addLine(to: CGPoint(x: x + w, y: y + fold))
  paper.addLine(to: CGPoint(x: x + w, y: y + h - r))
  paper.addArc(tangent1End: CGPoint(x: x + w, y: y + h), tangent2End: CGPoint(x: x + w - r, y: y + h), radius: r)
  paper.addLine(to: CGPoint(x: x + r, y: y + h))
  paper.addArc(tangent1End: CGPoint(x: x, y: y + h), tangent2End: CGPoint(x: x, y: y + h - r), radius: r)
  paper.addLine(to: CGPoint(x: x, y: y + r))
  paper.addArc(tangent1End: CGPoint(x: x, y: y), tangent2End: CGPoint(x: x + r, y: y), radius: r)
  paper.closeSubpath()

  if monochrome == nil {
    ctx.setShadow(offset: CGSize(width: 0, height: 18), blur: 40, color: p.shadow)
  }
  ctx.setFillColor(paperColor)
  ctx.addPath(paper)
  ctx.fillPath()
  ctx.setShadow(offset: .zero, blur: 0, color: nil)

  if monochrome == nil {
    // Kıvrık köşe
    let corner = CGMutablePath()
    corner.move(to: CGPoint(x: x + w - fold, y: y))
    corner.addLine(to: CGPoint(x: x + w - fold, y: y + fold - 22))
    corner.addQuadCurve(to: CGPoint(x: x + w - fold + 22, y: y + fold), control: CGPoint(x: x + w - fold, y: y + fold))
    corner.addLine(to: CGPoint(x: x + w, y: y + fold))
    corner.closeSubpath()
    ctx.setFillColor(p.fold)
    ctx.addPath(corner)
    ctx.fillPath()

    // Soru satırları: ilki vurgulu kısa satır (soru numarası), sonra metin satırları.
    func line(_ ly: CGFloat, _ lw: CGFloat, _ color: CGColor) {
      let rect = CGRect(x: x + 60, y: y + ly, width: lw, height: 30)
      ctx.setFillColor(color)
      ctx.addPath(CGPath(roundedRect: rect, cornerWidth: 15, cornerHeight: 15, transform: nil))
      ctx.fillPath()
    }
    line(90, 120, p.highlight)
    line(190, 330, p.lines)
    line(260, 300, p.lines)
    line(330, 340, p.lines)
    line(400, 200, p.lines)
  }
  ctx.restoreGState()

  // "Bir daha" rozeti: dönen ok.
  let center = CGPoint(x: 712, y: 742)
  let badgeRadius: CGFloat = 158
  if monochrome == nil {
    ctx.setShadow(offset: CGSize(width: 0, height: 12), blur: 30, color: p.shadow)
  }
  ctx.setFillColor(monochrome ?? p.badge)
  ctx.fillEllipse(in: CGRect(x: center.x - badgeRadius, y: center.y - badgeRadius, width: badgeRadius * 2, height: badgeRadius * 2))
  ctx.setShadow(offset: .zero, blur: 0, color: nil)

  // Monokrom ikonda ok, rozetten oyularak gösterilir.
  if monochrome != nil { ctx.setBlendMode(.clear) }
  let arcRadius: CGFloat = 82
  let start: CGFloat = -150 * .pi / 180
  let end: CGFloat = 150 * .pi / 180
  ctx.setStrokeColor(p.arrow)
  ctx.setLineWidth(34)
  ctx.setLineCap(.round)
  ctx.addArc(center: center, radius: arcRadius, startAngle: start, endAngle: end, clockwise: false)
  ctx.strokePath()
  // Ok ucu: yayın sonunda, teğet yönünde.
  let tip = CGPoint(x: center.x + arcRadius * cos(end), y: center.y + arcRadius * sin(end))
  let tangent = CGPoint(x: -sin(end), y: cos(end))
  let normal = CGPoint(x: cos(end), y: sin(end))
  let head = CGMutablePath()
  head.move(to: CGPoint(x: tip.x + tangent.x * 58, y: tip.y + tangent.y * 58))
  head.addLine(to: CGPoint(x: tip.x + normal.x * 48 - tangent.x * 10, y: tip.y + normal.y * 48 - tangent.y * 10))
  head.addLine(to: CGPoint(x: tip.x - normal.x * 48 - tangent.x * 10, y: tip.y - normal.y * 48 - tangent.y * 10))
  head.closeSubpath()
  ctx.setFillColor(p.arrow)
  ctx.addPath(head)
  ctx.fillPath()
  ctx.setBlendMode(.normal)
}

func render(size: Int, palette: Palette, background: Bool, glyphScale: CGFloat = 1, monochrome: CGColor? = nil, to path: String) {
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  let ctx = CGContext(
    data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0, space: space,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  let s = CGFloat(size)
  // Sol üst başlangıçlı koordinatlar.
  ctx.translateBy(x: 0, y: s)
  ctx.scaleBy(x: 1, y: -1)
  if background, let bg = palette.background {
    ctx.setFillColor(bg)
    ctx.fill(CGRect(x: 0, y: 0, width: s, height: s))
  }
  ctx.saveGState()
  ctx.translateBy(x: s / 2, y: s / 2)
  ctx.scaleBy(x: s / 1024 * glyphScale, y: s / 1024 * glyphScale)
  ctx.translateBy(x: -512, y: -512)
  drawGlyph(ctx, palette, monochrome: monochrome)
  ctx.restoreGState()

  var image = ctx.makeImage()!
  if background {
    // App Store ikonu alfa kanalı içermemeli: opak RGB olarak yeniden çiz.
    let opaque = CGContext(
      data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0, space: space,
      bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
    opaque.draw(image, in: CGRect(x: 0, y: 0, width: s, height: s))
    image = opaque.makeImage()!
  }
  let rep = NSBitmapImageRep(cgImage: image)
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: path))
  print("✓ \(path)")
}

let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "assets/images"
render(size: 1024, palette: light, background: true, to: "\(out)/icon.png")
render(size: 1024, palette: dark, background: true, to: "\(out)/icon-dark.png")
render(size: 600, palette: light, background: false, glyphScale: 1.1, to: "\(out)/splash-icon.png")
render(size: 600, palette: dark, background: false, glyphScale: 1.1, to: "\(out)/splash-icon-dark.png")
render(size: 512, palette: light, background: false, glyphScale: 0.62, to: "\(out)/android-icon-foreground.png")
render(size: 512, palette: light, background: true, glyphScale: 0.0001, to: "\(out)/android-icon-background.png")
render(size: 432, palette: light, background: false, glyphScale: 0.62, monochrome: rgb(0xFFFFFF), to: "\(out)/android-icon-monochrome.png")
