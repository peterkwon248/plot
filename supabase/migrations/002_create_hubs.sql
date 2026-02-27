-- =====================================================
-- Plot v0.2 — Hub (프로젝트/공간)
-- =====================================================

CREATE TABLE hubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  color       TEXT NOT NULL DEFAULT 'purple'
              CHECK (color IN ('purple','blue','green','yellow','orange','red','pink','gray')),
  icon        TEXT DEFAULT NULL,
  sort_order  FLOAT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_hubs_user ON hubs(user_id) WHERE archived_at IS NULL;
CREATE INDEX idx_hubs_sort ON hubs(user_id, sort_order) WHERE archived_at IS NULL;

-- RLS
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own hubs"
  ON hubs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- updated_at 트리거
CREATE TRIGGER hubs_updated_at
  BEFORE UPDATE ON hubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE hubs;

-- items 테이블에 hub_id 추가 (nullable — 허브에 속하지 않는 노드 허용)
ALTER TABLE items ADD COLUMN hub_id UUID REFERENCES hubs(id) ON DELETE SET NULL;
CREATE INDEX idx_items_hub ON items(hub_id) WHERE deleted_at IS NULL;
