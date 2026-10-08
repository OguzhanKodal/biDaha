#!/usr/bin/env python3
"""Mağaza ekran görüntüleri için ÖRNEK veri: uygulamanın SQLite veritabanına yazılacak SQL üretir.

Kullanım: python3 scripts/store/seed-demo.py YYYY-MM-DD > seed.sql
Tarih "bugün" kabul edilir. Fotoğraf yolları photos/demo-*.jpg (sample-questions.swift çıktıları).
Sadece simülatördeki demo kurulumu için; gerçek kullanıcı verisine uygulanmaz.
"""
from __future__ import annotations

import random
import sys
from datetime import date, timedelta

random.seed(7)
today = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date.today()
now = f"{today.isoformat()}T09:00:00.000Z"


def day(offset: int) -> str:
    return (today + timedelta(days=offset)).isoformat()


def q(s: str | None) -> str:
    return "NULL" if s is None else "'" + s.replace("'", "''") + "'"


subjects = [
    "TYT Türkçe", "TYT Matematik", "TYT Geometri", "TYT Fizik", "TYT Kimya", "TYT Biyoloji",
    "TYT Tarih", "TYT Coğrafya", "TYT Felsefe", "TYT Din Kültürü", "AYT Matematik", "AYT Geometri",
    "AYT Fizik", "AYT Kimya", "AYT Biyoloji", "AYT Edebiyat", "AYT Tarih", "AYT Coğrafya", "AYT Felsefe Grubu",
]
colors = ["blue", "teal", "green", "yellow", "orange", "red", "pink", "purple"]

out = ["BEGIN;", "DELETE FROM review_logs; DELETE FROM question_tags; DELETE FROM questions;",
       "DELETE FROM folders WHERE parent_id IS NOT NULL; DELETE FROM folders;",
       "DELETE FROM error_tags WHERE is_default = 0;"]
out.append(
    "UPDATE settings SET name = 'Zeynep', exam_type = 'YKS', target_repetitions = 5, "
    f"exam_date = {q(day(255))}, notifications_enabled = 1, notification_time = '20:00', "
    f"last_backup_at = {q(day(-3) + 'T18:00:00.000Z')}, onboarding_done = 1 WHERE id = 1;")

folder_id = {}
for i, name in enumerate(subjects, start=1):
    folder_id[name] = i
    out.append(f"INSERT INTO folders (id, name, parent_id, color, sort_order, created_at) "
               f"VALUES ({i}, {q(name)}, NULL, '{colors[(i - 1) % 8]}', {i - 1}, {q(now)});")
topics = [("Türev", "AYT Matematik"), ("Limit", "AYT Matematik"), ("Problemler", "TYT Matematik"), ("Üçgenler", "TYT Geometri")]
for j, (name, parent) in enumerate(topics):
    fid = 100 + j
    folder_id[name] = fid
    out.append(f"INSERT INTO folders (id, name, parent_id, color, sort_order, created_at) "
               f"VALUES ({fid}, {q(name)}, {folder_id[parent]}, '{colors[(folder_id[parent] - 1) % 8]}', {j}, {q(now)});")

out.append("INSERT INTO error_tags (id, name, is_default) VALUES (7, 'Formülü unuttum', 0);")

# (klasör, fotoğraf, doğru şık, not, kaynak, etiketler)
pool = [
    ("Türev", "q-turev", "B", "Türevi alınca x=2'yi yerine koymayı unuttum.", "AYT Deneme 3", [1, 7]),
    ("Problemler", "q-denklem", "C", "Denklemi kurarken 'eksik' kelimesini ters okudum.", "TYT Problemler Fasikülü", [4, 1]),
    ("Üçgenler", "q-ucgen", "C", "İkizkenar üçgende taban açıları eşit!", "Geometri Soru Bankası", [2]),
    ("TYT Fizik", "q-ivme", "C", None, "TYT Deneme 5", [5]),
    ("TYT Kimya", "q-element", "C", "Su bir bileşik, element değil.", None, [2, 4]),
    ("TYT Türkçe", "q-yazim", "A", "'Her şey' ayrı yazılır.", "Paragraf ve Dil Bilgisi", [1]),
    ("TYT Biyoloji", "q-hucre", "C", None, "TYT Deneme 2", [2]),
    ("TYT Tarih", "q-tarih", "B", "1071 — Malazgirt.", None, [2, 3]),
]

questions = []
qid = 0
# 12 tanesi bugün tekrar edilecek, 8'i ileride, 6'sı tamamlanmış.
plan = [("due", 12), ("later", 8), ("done", 6)]
for kind, count in plan:
    for _ in range(count):
        qid += 1
        folder, photo, answer, note, source, tags = pool[(qid - 1) % len(pool)]
        created = -random.randint(10, 40)
        if kind == "due":
            success, nxt, last, completed = random.randint(0, 3), day(-random.randint(0, 3)), random.choice(["fail", "success", None]), None
        elif kind == "later":
            success, nxt, last, completed = random.randint(1, 4), day(random.randint(1, 20)), "success", None
        else:
            success, nxt, last, completed = 5, day(-1), "success", day(-random.randint(1, 9)) + "T19:00:00.000Z"
        solution = "photos/demo-s-turev.jpg" if photo == "q-turev" else None
        questions.append(qid)
        out.append(
            "INSERT INTO questions (id, folder_id, question_image, solution_image, correct_answer, note, source_name, "
            "source_page, success_count, next_review_date, last_result, completed_at, created_at, updated_at) VALUES "
            f"({qid}, {folder_id[folder]}, 'photos/demo-{photo}.jpg', {q(solution)}, '{answer}', {q(note)}, {q(source)}, "
            f"{q(str(random.randint(12, 240)))}, {success}, {q(nxt)}, {q(last)}, {q(completed)}, "
            f"{q(day(created) + 'T17:00:00.000Z')}, {q(now)});")
        for tag in tags:
            out.append(f"INSERT INTO question_tags (question_id, tag_id) VALUES ({qid}, {tag});")

# Tekrar geçmişi: son 30 günde 22 gün; son 6 gün kesintisiz (seri = 6, bugün dahil).
log_id = 0
active_days = set(range(0, 6)) | set(random.sample(range(7, 30), 16))
for offset in sorted(active_days, reverse=True):
    for _ in range(random.randint(3, 11) if offset else 4):
        log_id += 1
        result = "success" if random.random() < 0.72 else "fail"
        out.append(
            "INSERT INTO review_logs (id, question_id, reviewed_at, review_date, result, counted) VALUES "
            f"({log_id}, {random.choice(questions)}, {q(day(-offset) + 'T18:30:00.000Z')}, {q(day(-offset))}, '{result}', 1);")

out.append("COMMIT;")
print("\n".join(out))
