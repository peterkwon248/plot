-- =====================================================
-- Plot MVP — items 테이블 생성
-- Supabase SQL Editor에서 실행하세요
-- =====================================================

-- 1. items 테이블
CREATE TABLE items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  title         TEXT NOT NULL,
  body          JSONB DEFAULT '{}',
  body_plain    TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'inbox'
                CHECK (status IN ('inbox', 'todo', 'in_progress', 'done')),
  priority      TEXT NOT NULL DEFAULT 'none'
                CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')),
  item_type     TEXT NOT NULL DEFAULT 'auto'
                CHECK (item_type IN ('auto', 'note', 'task')),
  tags          JSONB DEFAULT '[]',
  sort_order    FLOAT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ
);

-- 2. 인덱스
CREATE INDEX idx_items_user_active
  ON items(user_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_items_sort
  ON items(user_id, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_items_search
  ON items USING gin(to_tsvector('simple', title || ' ' || body_plain));

CREATE INDEX idx_items_tags
  ON items USING gin(tags);

CREATE INDEX idx_items_updated
  ON items(user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- 3. 트리거: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4. 트리거: completed_at 자동 설정
CREATE OR REPLACE FUNCTION update_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_completed_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_completed_at();

-- 5. RLS (Row Level Security)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own items"
  ON items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON items FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE items;
