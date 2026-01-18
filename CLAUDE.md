# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Goose Tap is a Telegram Mini App built with Next.js 16. It runs inside Telegram as a WebApp accessible via @goosetap_bot.

## Commands

```bash
pnpm dev      # Start development server at localhost:3000
pnpm build    # Production build
pnpm lint     # Run ESLint
```

## Architecture

- **Next.js 16 App Router** with React 19 and Tailwind CSS 4
- **Telegram WebApp SDK** loaded via `<Script>` in `app/layout.tsx`
- **shadcn/ui** configured (radix-vega style, lucide icons)

## ВАЖНО: Правило использования shadcn/ui

**Всегда используй компоненты из shadcn/ui, если они существуют.** Не создавай кастомные компоненты для UI, который уже есть в библиотеке.

Перед созданием нового компонента:
1. Проверь наличие в shadcn: `mcp__shadcn__search_items_in_registries`
2. Если компонент существует — установи и используй его
3. Если нужна кастомизация — расширяй shadcn компонент, а не пиши с нуля

Установленные shadcn компоненты находятся в `components/ui/`.

### Item vs Card

- **Item** (`@shadcn/item`) — для простых списков без сложного контента (меню, настройки)
- **Card** — для карточек со сложным layout (прогресс-бары, множественные действия, вложенный контент)

Item не подходит когда есть: Progress, несколько строк actions, контент который должен занимать всю ширину.

### Key Directories

- `docs/` — Markdown files with reports and documentation
- `hooks/` — React hooks (e.g., `useTelegram.ts` for Telegram WebApp API)
- `types/` — TypeScript definitions (e.g., `telegram.d.ts` for `window.Telegram.WebApp`)

### Path Aliases

```
@/components  → ./components
@/components/ui → ./components/ui
@/lib         → ./lib
@/hooks       → ./hooks
```

## Telegram Integration

The app initializes Telegram WebApp on load:
- Calls `tg.ready()` and `tg.expand()` automatically
- Subscribes to `viewportChanged` and `themeChanged` events
- Access user data via `useTelegram()` hook

## Environment Variables

- `TELEGRAM_BOT_TOKEN` — Bot token from @BotFather (stored in Vercel, not committed)

## Language

**UI language: English only.** All user-facing text in the app must be in English. This includes:
- Labels, buttons, titles
- Level names (Newbie, Beginner, Skilled, etc.)
- Status messages (MAX, not МАКС)
- Drawer/modal content

сейчас 2026 год
