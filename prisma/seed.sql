BEGIN;

INSERT INTO "User" ("id", "email", "password", "name")
VALUES
  ('11111111-1111-4111-8111-111111111111', 'ivan.petrov@subtrack.local', '$2b$10$qMLHPPE7.KqKCWYmzD4JE.qy2Rsk5tF6kh4LgLU9J47yEIMrvIOa6', 'Ivan Petrov'),
  ('22222222-2222-4222-8222-222222222222', 'anna.smirnova@subtrack.local', '$2b$10$qMLHPPE7.KqKCWYmzD4JE.qy2Rsk5tF6kh4LgLU9J47yEIMrvIOa6', 'Anna Smirnova'),
  ('33333333-3333-4333-8333-333333333333', 'dmitry.ivanov@subtrack.local', '$2b$10$qMLHPPE7.KqKCWYmzD4JE.qy2Rsk5tF6kh4LgLU9J47yEIMrvIOa6', 'Dmitry Ivanov'),
  ('44444444-4444-4444-8444-444444444444', 'maria.volkova@subtrack.local', '$2b$10$qMLHPPE7.KqKCWYmzD4JE.qy2Rsk5tF6kh4LgLU9J47yEIMrvIOa6', 'Maria Volkova')
ON CONFLICT ("id") DO UPDATE
SET
  "email" = EXCLUDED."email",
  "name" = EXCLUDED."name",
  "password" = EXCLUDED."password";

INSERT INTO "Category" ("slug", "name")
VALUES
  ('streaming', 'РЎС‚СЂРёРјРёРЅРі'),
  ('music', 'РњСѓР·С‹РєР°'),
  ('games', 'РРіСЂС‹'),
  ('shopping', 'РЁРѕРїРёРЅРі'),
  ('ai', 'AI'),
  ('finance', 'Р¤РёРЅР°РЅСЃС‹'),
  ('other', 'РџСЂРѕС‡РµРµ')
ON CONFLICT DO NOTHING;

WITH seeded_types AS (
  SELECT *
  FROM (VALUES
    ('10000000-0000-4000-8000-000000000001', 'Yandex Plus', 'streaming', 'https://plus.yandex.ru/', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Yandex_Music_icon.svg/256px-Yandex_Music_icon.svg.png'),
    ('10000000-0000-4000-8000-000000000002', 'T-Bank Pro', 'finance', 'https://www.tbank.ru/cards/debit-cards/tinkoff-black/pro/', 'https://www.tbank.ru/static/images/share/tinkoff_black.png'),
    ('10000000-0000-4000-8000-000000000003', 'ChatGPT Plus', 'ai', 'https://chat.openai.com/', 'https://cdn.simpleicons.org/openai/ffffff'),
    ('10000000-0000-4000-8000-000000000004', 'VK Combo', 'streaming', 'https://combo.vk.com/', 'https://cdn.simpleicons.org/vk/0077FF'),
    ('10000000-0000-4000-8000-000000000005', 'KION', 'streaming', 'https://kion.ru/', 'https://avatars.mds.yandex.net/get-site-logo/988126/228bf61b-b46b-4e9a-912b-f172f76e765e/orig'),
    ('10000000-0000-4000-8000-000000000006', 'YouTube Premium', 'streaming', 'https://www.youtube.com/premium', 'https://cdn.simpleicons.org/youtube/FF0000'),
    ('10000000-0000-4000-8000-000000000007', 'Spotify Premium', 'music', 'https://www.spotify.com/premium/', 'https://cdn.simpleicons.org/spotify/1DB954'),
    ('10000000-0000-4000-8000-000000000008', 'Netflix', 'streaming', 'https://www.netflix.com/manageaccount', 'https://cdn.simpleicons.org/netflix/E50914')
  ) AS v(id, name, category_slug, link, img_link)
)
INSERT INTO "Type" ("id", "name", "categoryId", "link", "imgLink")
SELECT
  v.id::uuid,
  v.name,
  COALESCE(
    (SELECT c."id" FROM "Category" c WHERE c."slug" = v.category_slug LIMIT 1),
    (SELECT c."id" FROM "Category" c WHERE c."slug" = 'other' LIMIT 1)
  ) AS "categoryId",
  v.link,
  v.img_link
FROM seeded_types v
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "categoryId" = EXCLUDED."categoryId",
  "link" = EXCLUDED."link",
  "imgLink" = EXCLUDED."imgLink";

INSERT INTO "Subscribe" (
  "id",
  "typeId",
  "userId",
  "price",
  "period",
  "nextPaymentAt",
  "paymentMethodLabel"
)
VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 449.00, 1, '2026-03-12', 'Visa **** 4242'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 299.00, 1, '2026-03-07', 'T-Bank Black'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 1889.00, 1, '2026-03-04', 'Mastercard **** 1420'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 349.00, 1, '2026-03-17', 'Mir **** 7781'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', 399.00, 3, '2026-04-01', 'SberCard **** 6077'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000008', '22222222-2222-4222-8222-222222222222', 1299.00, 1, '2026-03-21', 'Visa **** 4100'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', 199.00, 6, '2026-06-10', 'Mastercard **** 2003'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000006', '33333333-3333-4333-8333-333333333333', 299.00, 1, '2026-03-28', 'Alfa Bank **** 9402'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 1889.00, 12, '2026-12-02', 'Visa **** 5101'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 449.00, 12, '2026-11-20', 'Mir **** 0105'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 299.00, 6, '2026-08-12', 'T-Bank Black'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000005', '44444444-4444-4444-8444-444444444444', 349.00, 1, '2026-03-15', 'SberCard **** 4402')
ON CONFLICT ("id") DO UPDATE
SET
  "typeId" = EXCLUDED."typeId",
  "userId" = EXCLUDED."userId",
  "price" = EXCLUDED."price",
  "period" = EXCLUDED."period",
  "nextPaymentAt" = EXCLUDED."nextPaymentAt",
  "paymentMethodLabel" = EXCLUDED."paymentMethodLabel";

INSERT INTO "Notification" (
  "id",
  "userId",
  "kind",
  "title",
  "message",
  "createdAt"
)
VALUES
  (
    '50000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'success',
    'РћРїР»Р°С‚Р° РїСЂРѕС€Р»Р° СѓСЃРїРµС€РЅРѕ',
    'РЇРЅРґРµРєСЃ РџР»СЋСЃ (449в‚Ѕ) Р±С‹Р» СѓСЃРїРµС€РЅРѕ РїСЂРѕРґР»РµРЅ.',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'info',
    'РЎРєРѕСЂРѕ СЃРїРёСЃР°РЅРёРµ',
    'Р—Р°РІС‚СЂР° Р±СѓРґРµС‚ СЃРїРёСЃР°РЅРѕ 299в‚Ѕ Р·Р° T-Bank Pro.',
    NOW() - INTERVAL '5 hours'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'warning',
    'РљР°СЂС‚Р° РїСЂРѕСЃСЂРѕС‡РµРЅР°',
    'РЎСЂРѕРє РґРµР№СЃС‚РІРёСЏ РІР°С€РµР№ РєР°СЂС‚С‹ Visa РёСЃС‚РµРєР°РµС‚ РІ РјР°СЂС‚Рµ.',
    NOW() - INTERVAL '1 day'
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'neutral',
    'РќРѕРІР°СЏ РїРѕРґРїРёСЃРєР°',
    'Р’С‹ СѓСЃРїРµС€РЅРѕ РґРѕР±Р°РІРёР»Рё ChatGPT Plus РІ СЃРїРёСЃРѕРє.',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT ("id") DO UPDATE
SET
  "userId" = EXCLUDED."userId",
  "kind" = EXCLUDED."kind",
  "title" = EXCLUDED."title",
  "message" = EXCLUDED."message",
  "createdAt" = EXCLUDED."createdAt";

COMMIT;
