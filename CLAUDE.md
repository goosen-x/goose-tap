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
