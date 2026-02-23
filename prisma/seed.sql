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

INSERT INTO "Subscribe" (
  "id",
  "userId",
  "name",
  "imgLink",
  "category",
  "price",
  "period",
  "nextPaymentAt",
  "paymentMethodLabel"
)
VALUES
  ('20000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Yandex Plus', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Yandex_Music_icon.svg/256px-Yandex_Music_icon.svg.png', 'streaming', 449.00, 1, '2026-03-12', 'Visa **** 4242'),
  ('20000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'T-Bank Pro', 'https://www.tbank.ru/static/images/share/tinkoff_black.png', 'finance', 299.00, 1, '2026-03-07', 'T-Bank Black'),
  ('20000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'ChatGPT Plus', 'https://cdn.simpleicons.org/openai/ffffff', 'ai', 1889.00, 1, '2026-03-04', 'Mastercard **** 1420'),
  ('20000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'VK Combo', 'https://cdn.simpleicons.org/vk/0077FF', 'streaming', 349.00, 1, '2026-03-17', 'Mir **** 7781'),
  ('20000000-0000-4000-8000-000000000005', '22222222-2222-4222-8222-222222222222', 'KION', 'https://avatars.mds.yandex.net/get-site-logo/988126/228bf61b-b46b-4e9a-912b-f172f76e765e/orig', 'streaming', 399.00, 3, '2026-04-01', 'SberCard **** 6077'),
  ('20000000-0000-4000-8000-000000000006', '22222222-2222-4222-8222-222222222222', 'Netflix', 'https://cdn.simpleicons.org/netflix/E50914', 'streaming', 1299.00, 1, '2026-03-21', 'Visa **** 4100'),
  ('20000000-0000-4000-8000-000000000007', '22222222-2222-4222-8222-222222222222', 'Spotify Premium', 'https://cdn.simpleicons.org/spotify/1DB954', 'music', 199.00, 6, '2026-06-10', 'Mastercard **** 2003'),
  ('20000000-0000-4000-8000-000000000008', '33333333-3333-4333-8333-333333333333', 'YouTube Premium', 'https://cdn.simpleicons.org/youtube/FF0000', 'streaming', 299.00, 1, '2026-03-28', 'Alfa Bank **** 9402'),
  ('20000000-0000-4000-8000-000000000009', '33333333-3333-4333-8333-333333333333', 'ChatGPT Plus', 'https://cdn.simpleicons.org/openai/ffffff', 'ai', 1889.00, 12, '2026-12-02', 'Visa **** 5101'),
  ('20000000-0000-4000-8000-000000000010', '44444444-4444-4444-8444-444444444444', 'Yandex Plus', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Yandex_Music_icon.svg/256px-Yandex_Music_icon.svg.png', 'streaming', 449.00, 12, '2026-11-20', 'Mir **** 0105'),
  ('20000000-0000-4000-8000-000000000011', '44444444-4444-4444-8444-444444444444', 'T-Bank Pro', 'https://www.tbank.ru/static/images/share/tinkoff_black.png', 'finance', 299.00, 6, '2026-08-12', 'T-Bank Black'),
  ('20000000-0000-4000-8000-000000000012', '44444444-4444-4444-8444-444444444444', 'KION', 'https://avatars.mds.yandex.net/get-site-logo/988126/228bf61b-b46b-4e9a-912b-f172f76e765e/orig', 'streaming', 349.00, 1, '2026-03-15', 'SberCard **** 4402')
ON CONFLICT ("id") DO UPDATE
SET
  "userId" = EXCLUDED."userId",
  "name" = EXCLUDED."name",
  "imgLink" = EXCLUDED."imgLink",
  "category" = EXCLUDED."category",
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
    'Оплата прошла успешно',
    'Яндекс Плюс (449₽) был успешно продлен.',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'info',
    'Скоро списание',
    'Завтра будет списано 299₽ за T-Bank Pro.',
    NOW() - INTERVAL '5 hours'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'warning',
    'Карта просрочена',
    'Срок действия вашей карты Visa истекает в марте.',
    NOW() - INTERVAL '1 day'
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111111',
    'neutral',
    'Новая подписка',
    'Вы успешно добавили ChatGPT Plus в список.',
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
