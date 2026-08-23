# CI workflow (ручная установка)

GitHub App, через который v0 пушит код, **не имеет права `workflows`** и не может
создавать/изменять файлы в `.github/workflows/`. Поэтому готовый workflow лежит
здесь как обычный файл — добавьте его в репозиторий вручную одним движением:

```bash
mkdir -p .github/workflows
cp ops/ci/ci.yml.txt .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow"
git push
```

## Что делает workflow

Два джоба, запускаются на каждый push и pull request:

1. **quality** — поднимает PostgreSQL 18 как сервис, затем:
   - `tsc --noEmit` (проверка типов),
   - `vitest` (юнит-тесты),
   - полный прогон selfcheck-скриптов (`--all-selfcheck`, с БД),
   - `next build --webpack` (production-сборка).
2. **e2e** — Playwright (Chromium) против поднятого dev-сервера с той же БД.

Окружение повторяет рабочую песочницу: `BUSTOUR_DEPLOY_ENV=local`,
`BUSTOUR_SKIP_PREFLIGHT=1`, `BYPASS_RECAPTCHA=1`, локальный `DATABASE_URL`.

Это закрывает известную дыру «пуш в `main` = автодеплой без проверок»:
теперь любой push прогоняется через те же ворота, что и локальный preflight.
