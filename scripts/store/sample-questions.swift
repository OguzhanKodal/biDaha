// Mağaza ekran görüntüleri için ÖRNEK soru fotoğrafları (özgün sorular; telifli kaynak içermez).
// Çalıştır: swift scripts/store/sample-questions.swift <çıktı klasörü>
import AppKit

struct Question {
  let file: String
  let header: String
  let body: String
  let options: [String]
  let drawing: ((CGContext, CGRect) -> Void)?
}

let ink = NSColor(calibratedRed: 0.13, green: 0.12, blue: 0.11, alpha: 1)
let paper = NSColor(calibratedRed: 0.992, green: 0.988, blue: 0.972, alpha: 1)

func triangle(_ ctx: CGContext, _ rect: CGRect) {
  let a = CGPoint(x: rect.midX, y: rect.minY + 10)
  let b = CGPoint(x: rect.midX - 190, y: rect.maxY - 40)
  let c = CGPoint(x: rect.midX + 190, y: rect.maxY - 40)
  ctx.setStrokeColor(ink.cgColor)
  ctx.setLineWidth(4)
  ctx.move(to: a); ctx.addLine(to: b); ctx.addLine(to: c); ctx.closePath()
  ctx.strokePath()
  let font = NSFont(name: "Georgia-Italic", size: 38)!
  let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: ink]
  ("A" as NSString).draw(at: CGPoint(x: a.x - 12, y: a.y - 50), withAttributes: attrs)
  ("B" as NSString).draw(at: CGPoint(x: b.x - 44, y: b.y - 10), withAttributes: attrs)
  ("C" as NSString).draw(at: CGPoint(x: c.x + 16, y: c.y - 10), withAttributes: attrs)
  ("40°" as NSString).draw(at: CGPoint(x: a.x - 30, y: a.y + 50), withAttributes: [.font: NSFont(name: "Georgia", size: 30)!, .foregroundColor: ink])
  // Eşit kenar işaretleri
  for (p, q) in [(a, b), (a, c)] {
    let m = CGPoint(x: (p.x + q.x) / 2, y: (p.y + q.y) / 2)
    ctx.move(to: CGPoint(x: m.x - 14, y: m.y - 8)); ctx.addLine(to: CGPoint(x: m.x + 14, y: m.y + 8))
  }
  ctx.strokePath()
}

let questions: [Question] = [
  Question(file: "q-turev", header: "12.", body: "f(x) = x³ − 3x² + 2 fonksiyonunun grafiğine x = 2 apsisli noktasından çizilen teğetin eğimi kaçtır?", options: ["A) −2", "B) 0", "C) 2", "D) 4", "E) 6"], drawing: nil),
  Question(file: "q-denklem", header: "7.", body: "Bir sayının 3 katının 5 fazlası, aynı sayının 7 katından 11 eksiktir.\nBuna göre bu sayı kaçtır?", options: ["A) 2", "B) 3", "C) 4", "D) 5", "E) 6"], drawing: nil),
  Question(file: "q-ucgen", header: "18.", body: "Şekildeki ABC üçgeninde |AB| = |AC| ve m(BAC) = 40° dir.\nBuna göre m(ABC) kaç derecedir?", options: ["A) 50", "B) 60", "C) 70", "D) 80", "E) 90"], drawing: triangle),
  Question(file: "q-ivme", header: "4.", body: "Durgun hâlden harekete geçen bir araç, düzgün hızlanarak 4 saniyede 20 m/s hıza ulaşıyor.\nAracın ivmesi kaç m/s² dir?", options: ["A) 2", "B) 4", "C) 5", "D) 8", "E) 10"], drawing: nil),
  Question(file: "q-element", header: "21.", body: "Aşağıdakilerden hangisi bir element değildir?", options: ["A) Demir", "B) Oksijen", "C) Su", "D) Azot", "E) Bakır"], drawing: nil),
  Question(file: "q-yazim", header: "9.", body: "Aşağıdaki cümlelerin hangisinde yazım yanlışı vardır?", options: ["A) Herşey planladığımız gibi gidiyor.", "B) Bu akşam bize gelecek misin?", "C) Kitabı bir haftada bitirdi.", "D) Yarın sabah erkenden yola çıkacağız.", "E) Toplantı saat üçte başlayacak."], drawing: nil),
  Question(file: "q-hucre", header: "15.", body: "Fotosentez, bitki hücresinin hangi organelinde gerçekleşir?", options: ["A) Mitokondri", "B) Ribozom", "C) Kloroplast", "D) Lizozom", "E) Golgi cisimciği"], drawing: nil),
  Question(file: "q-tarih", header: "3.", body: "Anadolu'nun kapılarını Türklere açan Malazgirt Savaşı hangi yıl yapılmıştır?", options: ["A) 1040", "B) 1071", "C) 1176", "D) 1243", "E) 1299"], drawing: nil),
]

func save(_ rep: NSBitmapImageRep, _ path: String) {
  let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.85])!
  try! data.write(to: URL(fileURLWithPath: path))
  print("✓ \(path)")
}

func render(_ q: Question, to dir: String) {
  let width: CGFloat = 1200
  let margin: CGFloat = 70
  let bodyFont = NSFont(name: "Georgia", size: 40)!
  let optionFont = NSFont(name: "Georgia", size: 38)!
  let para = NSMutableParagraphStyle(); para.lineSpacing = 12
  let bodyAttrs: [NSAttributedString.Key: Any] = [.font: bodyFont, .foregroundColor: ink, .paragraphStyle: para]
  let textWidth = width - margin * 2 - 70
  let bodyHeight = (q.body as NSString).boundingRect(with: CGSize(width: textWidth, height: 2000), options: [.usesLineFragmentOrigin], attributes: bodyAttrs).height
  let drawingHeight: CGFloat = q.drawing == nil ? 0 : 380
  let height = margin + bodyHeight + 40 + drawingHeight + CGFloat(q.options.count) * 66 + margin

  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width), pixelsHigh: Int(height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  let gc = NSGraphicsContext(bitmapImageRep: rep)!
  NSGraphicsContext.current = NSGraphicsContext(cgContext: gc.cgContext, flipped: true)
  let ctx = gc.cgContext
  ctx.translateBy(x: 0, y: height); ctx.scaleBy(x: 1, y: -1)
  paper.setFill(); NSRect(x: 0, y: 0, width: width, height: height).fill()

  (q.header as NSString).draw(at: CGPoint(x: margin, y: margin), withAttributes: [.font: NSFont(name: "Georgia-Bold", size: 40)!, .foregroundColor: ink])
  (q.body as NSString).draw(with: CGRect(x: margin + 70, y: margin, width: textWidth, height: bodyHeight + 20), options: [.usesLineFragmentOrigin], attributes: bodyAttrs)
  var y = margin + bodyHeight + 40
  if let drawing = q.drawing {
    drawing(ctx, CGRect(x: margin + 70, y: y, width: textWidth, height: drawingHeight - 20))
    y += drawingHeight
  }
  for option in q.options {
    (option as NSString).draw(at: CGPoint(x: margin + 70, y: y), withAttributes: [.font: optionFont, .foregroundColor: ink])
    y += 66
  }
  NSGraphicsContext.restoreGraphicsState()
  save(rep, "\(dir)/\(q.file).jpg")
}

/// Türev sorusunun çözüm fotoğrafı: çizgili kâğıda elle yazılmış gibi.
func renderSolution(to dir: String) {
  let width: CGFloat = 1200, height: CGFloat = 700
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(width), pixelsHigh: Int(height), bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  let gc = NSGraphicsContext(bitmapImageRep: rep)!
  NSGraphicsContext.current = NSGraphicsContext(cgContext: gc.cgContext, flipped: true)
  let ctx = gc.cgContext
  ctx.translateBy(x: 0, y: height); ctx.scaleBy(x: 1, y: -1)
  NSColor(calibratedRed: 0.99, green: 0.98, blue: 0.94, alpha: 1).setFill(); NSRect(x: 0, y: 0, width: width, height: height).fill()
  ctx.setStrokeColor(NSColor(calibratedRed: 0.62, green: 0.75, blue: 0.88, alpha: 1).cgColor); ctx.setLineWidth(2)
  for line in stride(from: CGFloat(120), to: height, by: 90) { ctx.move(to: CGPoint(x: 0, y: line)); ctx.addLine(to: CGPoint(x: width, y: line)) }
  ctx.strokePath()
  let pen = NSColor(calibratedRed: 0.10, green: 0.20, blue: 0.55, alpha: 1)
  let hand = NSFont(name: "Noteworthy-Bold", size: 52) ?? NSFont.systemFont(ofSize: 52)
  let lines = ["f'(x) = 3x² − 6x", "f'(2) = 3·4 − 6·2", "        = 12 − 12 = 0   ⟹  B", "(teğet yatay!)"]
  for (i, text) in lines.enumerated() {
    (text as NSString).draw(at: CGPoint(x: 90, y: 52 + CGFloat(i) * 90), withAttributes: [.font: hand, .foregroundColor: pen])
  }
  NSGraphicsContext.restoreGraphicsState()
  save(rep, "\(dir)/s-turev.jpg")
}

let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."
for q in questions { render(q, to: out) }
renderSolution(to: out)
