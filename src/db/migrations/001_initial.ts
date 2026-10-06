import type { Migration } from './types';

/**
 * İlk şema (SPEC §13).
 * BU DOSYA YAYINLANDIKTAN SONRA ASLA DEĞİŞTİRİLMEZ — değişiklik için yeni migration ekle.
 *
 * Kurallar:
 * - `*_date` sütunları yerel gün (`YYYY-MM-DD`), `*_at` sütunları ISO 8601 zaman damgası.
 * - Fotoğraf sütunları uygulama klasörüne göre GÖRELİ dosya yolu tutar;
 *   iOS uygulama klasörünün mutlak yolu güncellemelerde değişebilir.
 * - Boolean sütunlar 0/1.
 */
export const migration001Initial: Migration = {
  version: 1,
  name: 'initial',
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT,
        exam_type TEXT CHECK (exam_type IN ('YKS', 'DGS', 'KPSS', 'OTHER')),
        target_repetitions INTEGER NOT NULL DEFAULT 5 CHECK (target_repetitions BETWEEN 3 AND 10),
        exam_date TEXT,
        notifications_enabled INTEGER NOT NULL DEFAULT 0 CHECK (notifications_enabled IN (0, 1)),
        notification_time TEXT NOT NULL DEFAULT '20:00',
        last_backup_at TEXT,
        onboarding_done INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_done IN (0, 1))
      );

      INSERT INTO settings (id) VALUES (1);

      CREATE TABLE folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER REFERENCES folders (id) ON DELETE RESTRICT,
        color TEXT NOT NULL DEFAULT 'blue',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE INDEX idx_folders_parent ON folders (parent_id, sort_order);

      CREATE TABLE questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        folder_id INTEGER NOT NULL REFERENCES folders (id) ON DELETE RESTRICT,
        question_image TEXT NOT NULL,
        solution_image TEXT,
        correct_answer TEXT CHECK (correct_answer IN ('A', 'B', 'C', 'D', 'E')),
        note TEXT,
        source_name TEXT,
        source_page TEXT,
        success_count INTEGER NOT NULL DEFAULT 0 CHECK (success_count >= 0),
        next_review_date TEXT NOT NULL,
        last_result TEXT CHECK (last_result IN ('success', 'fail')),
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_questions_folder ON questions (folder_id);
      CREATE INDEX idx_questions_next_review ON questions (next_review_date);

      CREATE TABLE error_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1))
      );

      INSERT INTO error_tags (name, is_default) VALUES
        ('Dikkatsizlik', 1),
        ('Bilgi eksikliği', 1),
        ('Süre yetmedi', 1),
        ('Soruyu yanlış okuma', 1),
        ('İşlem hatası', 1),
        ('Yorumlayamadım', 1);

      CREATE TABLE question_tags (
        question_id INTEGER NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES error_tags (id) ON DELETE CASCADE,
        PRIMARY KEY (question_id, tag_id)
      );

      CREATE INDEX idx_question_tags_tag ON question_tags (tag_id);

      CREATE TABLE review_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
        reviewed_at TEXT NOT NULL,
        review_date TEXT NOT NULL,
        result TEXT NOT NULL CHECK (result IN ('success', 'fail')),
        counted INTEGER NOT NULL CHECK (counted IN (0, 1))
      );

      CREATE INDEX idx_review_logs_date ON review_logs (review_date);
      CREATE INDEX idx_review_logs_question ON review_logs (question_id);
    `);
  },
};
