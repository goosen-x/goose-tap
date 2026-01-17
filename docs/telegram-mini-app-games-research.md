# Исследование Open-Source Telegram Mini App игр (Tap-to-Earn)

> Дата исследования: 17 января 2026

## Обзор

Данный документ содержит анализ 20 open-source репозиториев Telegram Mini App игр типа tap-to-earn (клоны Notcoin, Hamster Kombat, TapSwap и подобные).

---

## 1. Hamster-Kombat-Telegram-Mini-App-Clone

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/nikandr-surkov/Hamster-Kombat-Telegram-Mini-App-Clone |
| **Stars** | 262 |
| **Стек** | Vite, TypeScript (91%), Tailwind CSS |
| **Лицензия** | - |

### Ключевые фичи
- Полнофункциональный клон Hamster Kombat
- Две ветки: `initial-setup` (шаблон) и `final-version` (готовое приложение)
- Clicker-механика с анимациями
- Адаптивный дизайн

### Структура проекта
```
├── public/          # Статические ресурсы
├── src/             # Исходный код приложения
├── vite.config.ts   # Конфигурация сборки
├── tailwind.config.js
├── tsconfig.json
├── postcss.config.js
├── package.json
└── index.html
```

---

## 2. Notcoin-Telegram-Mini-App-Clone

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/nikandr-surkov/Notcoin-Telegram-Mini-App-Clone |
| **Stars** | 175 |
| **Стек** | Vite, TypeScript (75%), Tailwind CSS |
| **Лицензия** | - |

### Ключевые фичи
- Клон популярной игры Notcoin
- Две ветки разработки (starter и final)
- Механика кликера
- Интеграция с Telegram WebApp API

### Структура проекта
```
├── public/          # Иконки и ассеты
├── src/             # React компоненты и логика
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .eslintrc.cjs
└── package.json
```

---

## 3. MasterCryptoFarmBot

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/masterking32/MasterCryptoFarmBot |
| **Stars** | 232 |
| **Стек** | Python 3, Flask, SQLite, TailwindCSS |
| **Лицензия** | - |

### Ключевые фичи
- Модульная архитектура для фарминг-ботов
- Web-based GUI для управления
- Поддержка 13+ мини-приложений (Hamster Kombat, Blum, NotPixel и др.)
- Автообновление системы и модулей
- Многопоточность
- Поддержка Pyrogram и Telethon

### Структура проекта
```
├── .github/                 # CI/CD workflows
├── Docker/                  # Контейнеризация
├── database_migrations/     # Миграции БД
├── mcf_utils/              # Утилиты
├── telegram_accounts/      # Управление аккаунтами
├── web/                    # Web-интерфейс
└── launcher scripts        # Скрипты запуска
```

---

## 4. Telegram-Mini-Apps React Template (Official)

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/Telegram-Mini-Apps/reactjs-template |
| **Stars** | 400 |
| **Стек** | React, TypeScript, Vite, @tma.js SDK, TON Connect |
| **Лицензия** | MIT |

### Ключевые фичи
- Официальный шаблон от Telegram
- Интеграция TON Connect для крипто-функционала
- Telegram UI компоненты
- HTTPS dev-сервер
- Mock Telegram среда для локальной разработки
- Автодеплой на GitHub Pages

### Структура проекта
```
├── .github/         # Workflows для деплоя
├── assets/          # Статические ресурсы
├── public/          # TON Connect manifest
├── src/             # React приложение
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
└── package.json
```

---

## 5. softstack/telegram-mini-app

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/softstack/telegram-mini-app |
| **Stars** | 210 |
| **Стек** | React, TypeScript, Vite, Tailwind CSS |
| **Лицензия** | - |

### Ключевые фичи
- Демо-проект для Telegram Mini Apps
- Интеграция с Telegram WebApp SDK
- Поддержка menu button и inline button
- GitHub Pages хостинг
- Подробная документация по настройке

### Структура проекта
```
├── .github/workflows/
├── public/
├── src/
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── webpack.config.cjs
└── package.json
```

---

## 6. tamimattafi/telegram-mini-app

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/tamimattafi/telegram-mini-app |
| **Stars** | 114 |
| **Стек** | Node.js, Express, React, Telegraf |
| **Лицензия** | - |

### Ключевые фичи
- Полный пример бота и мини-приложения
- Main button и Back button реализации
- Haptic feedback
- REST API примеры
- Серверная коммуникация

### Структура проекта
```
├── sample/          # Рабочий пример (backend + frontend)
├── template/        # Starter шаблон
├── gifs/            # Демонстрации функционала
└── README.md
```

---

## 7. lowdigital/crypto-clicker-miniapp

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/lowdigital/crypto-clicker-miniapp |
| **Stars** | 55 |
| **Стек** | PHP 7.4+, MySQL 5.7+, JavaScript, CSS |
| **Лицензия** | MIT |

### Ключевые фичи
- Tap-to-earn механика (BOMJ COIN)
- Система лидербордов
- Бустеры и апгрейды
- Ежедневные награды
- Мини-игры
- CRON jobs для автоматизации

### Структура проекта
```
├── api/              # API endpoints
├── assets/           # Статические ресурсы
├── cron/             # Фоновые задачи
├── log/              # Логи
├── webhook.php       # Telegram webhook
├── _dbconnect.php    # Подключение к БД
├── _boosters.php     # Конфигурация бустеров
├── app.js            # Frontend JS
├── app.css           # Стили
└── app.php           # Главный файл
```

---

## 8. tonusdev/mini-content

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/tonusdev/mini-content |
| **Stars** | 56 |
| **Стек** | NestJS, Next.js, MongoDB, GraphQL, TypeScript, Telegraf |
| **Лицензия** | - |

### Ключевые фичи
- Платформа для эксклюзивного контента
- Разделение контента для бесплатных/Premium пользователей
- Верификация Telegram Premium через API
- GraphQL API
- Многоязычность (i18n)
- JWT аутентификация

### Структура проекта
```
├── backend/
│   ├── src/
│   │   ├── articles/     # Управление статьями
│   │   ├── auth/         # Аутентификация
│   │   └── bot/          # Telegram бот
├── frontend/
│   ├── app/              # Next.js роутинг
│   ├── components/       # UI компоненты
│   ├── services/         # GraphQL запросы
│   └── i18n/             # Локализация
└── docker-compose.yaml
```

---

## 9. koval01/notcoinWeb

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/koval01/notcoinWeb |
| **Stars** | 41 |
| **Стек** | Svelte (62%), TypeScript, Vite, Tailwind CSS |
| **Лицензия** | GPL-3.0 |

### Ключевые фичи
- Open-source имплементация сайта Notcoin
- Svelte framework (не React!)
- PWA поддержка
- Просмотр статистики игроков
- Деплой на Cloudflare Pages

### Структура проекта
```
├── .github/
├── public/
├── src/
├── svelte.config.js
├── tailwind.config.js
├── vite.config.js
├── postcss.config.js
└── package.json
```

---

## 10. Malith-Rukshan/NotCoin-Mini-App-Clone

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/Malith-Rukshan/NotCoin-Mini-App-Clone |
| **Stars** | 39 |
| **Стек** | React, TypeScript (82%), Vite, Tailwind CSS |
| **Лицензия** | - |

### Ключевые фичи
- UI идентичный оригинальному NotCoin
- Механика клика с анимациями
- Автоматическое восстановление энергии
- Образовательный проект

### Структура проекта
```
├── public/          # Статические ассеты
├── src/             # React приложение
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

---

## 11. ragibmondal/Hamster-Kombat-Clone

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/ragibmondal/Hamster-Kombat-Clone |
| **Stars** | 22 |
| **Стек** | React, Firebase (Auth + Firestore), Telegraf, Tailwind CSS |
| **Лицензия** | - |

### Ключевые фичи
- Система добычи монет с энергией
- Реферальная система
- Выполнение заданий
- Бусты
- Статистика пользователей
- Firebase бэкенд

### Структура проекта
```
├── bot/             # Telegram бот (Telegraf)
├── public/          # Статические файлы
├── src/             # React приложение
├── tailwind.config.js
├── netlify.toml
└── package.json
```

---

## 12. seven-gram/seven-gram

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/seven-gram/seven-gram |
| **Stars** | 25 |
| **Стек** | Node.js v22+, TypeScript (99%), PM2 |
| **Лицензия** | - |

### Ключевые фичи
- Мини-фреймворк для фарминг-ботов
- Поддержка Hamster Kombat, Blum, TapSwap, Dogs, Major, OKX Racer
- Мультисессии через команду `.miniapps addsession`
- Логирование в Telegram канал
- Автозапуск мини-игр

### Структура проекта
```
├── .vscode/
├── src/              # Исходный код TypeScript
├── .env.example
├── tsconfig.json
├── eslint.config.js
├── ecosystem.config.cjs  # PM2 конфигурация
└── package.json
```

---

## 13. JustinStar-py/mining-clicker-app

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/JustinStar-py/mining-clicker-app |
| **Stars** | 20 |
| **Стек** | React (94% JS), Node.js, CSS |
| **Лицензия** | MIT |

### Ключевые фичи
- Добыча монет кликами
- Автоматический BOT режим
- Простая архитектура

### Структура проекта
```
├── public/          # Статические ассеты
├── server/          # Node.js бэкенд
├── src/             # React компоненты
├── .env.example
└── package.json
```

---

## 14. bicced/TonStory

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/bicced/TonStory |
| **Stars** | 14 |
| **Стек** | Vite, React, Kaboom.js, Firebase (Firestore + Cloud Functions), TypeScript (81%) |
| **Лицензия** | - |

### Ключевые фичи
- 2D платформер для TON Hackathon
- Фарминг airdrop очков через бои с монстрами
- Kaboom.js игровой движок
- Firebase бэкенд
- TON Connect интеграция

### Структура проекта
```
├── functions/           # Firebase Cloud Functions
├── src/                 # Frontend React приложение
├── public/
├── firestore.rules
├── tonconnect-manifest.json
├── vite.config.js
└── package.json
```

---

## 15. rzhevskyrobotics/durka_game

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/rzhevskyrobotics/durka_game |
| **Stars** | 15 |
| **Стек** | JavaScript (PIXI.JS), Golang (backend) |
| **Лицензия** | MIT |

### Ключевые фичи
- Кликер-игра вдохновлённая @notcoin_bot
- PIXI.JS для рендеринга
- Go бэкенд (высокая производительность)
- Планируется TON интеграция
- Система бустеров

### Структура проекта
```
├── src/              # Исходный код
├── push.sh           # Скрипт деплоя
├── LICENSE
└── README.md
```

---

## 16. Kidkender/mini-app-telegram

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/Kidkender/mini-app-telegram |
| **Stars** | 16 |
| **Стек** | React, TypeScript (93%), Tailwind CSS, Vite, Axios |
| **Лицензия** | - |

### Ключевые фичи
- Механика похожая на игру "Dogs"
- TON кошелёк интеграция (Tonkeeper, MyTonWallet, Tonhub, OKX)
- Система наград за время в Telegram
- Лидерборд и рейтинги
- Реферальная система

### Структура проекта
```
├── .github/workflows/
├── config/
├── public/
├── src/
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 17. Luc143r/clicker_webapp_telegram

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/Luc143r/clicker_webapp_telegram |
| **Stars** | 14 |
| **Стек** | Python (87%), FastAPI, Flet, aiogram3 |
| **Лицензия** | - |

### Ключевые фичи
- Инкрементальная игра
- Telegram WebApp интеграция
- Flet десктоп-приложение
- aiogram3 бот фреймворк

### Структура проекта
```
├── assets/           # Ресурсы
├── backup_index/
├── configs/          # Конфигурация
├── data/             # Хранение данных
├── handlers/         # Обработчики запросов
├── views/            # UI компоненты
├── bot.py            # Telegram бот
├── main.py           # FastAPI приложение
└── requirements.txt
```

---

## 18. armiro/Telegram-Minigame-Demo

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/armiro/Telegram-Minigame-Demo |
| **Stars** | 17 |
| **Стек** | Python (Flask), MongoDB, HTML/JS/CSS, Cardano blockchain |
| **Лицензия** | - |

### Ключевые фичи
- Tap-to-earn механика ($Musktap points)
- Система бустеров
- Daily games
- Mystery boxes с $MUSK токенами
- Реферальная система
- Квесты
- Cardano интеграция

### Структура проекта
```
├── .idea/
├── assets/
├── src/
├── app.py            # Flask backend
├── bot.py            # Telegram bot
├── index.html        # Web interface
├── requirements.txt
└── LICENSE
```

---

## 19. Afaneor/telegram-clicker-example

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/Afaneor/telegram-clicker-example |
| **Stars** | 7 |
| **Стек** | Django (Python 58%), HTML, Docker, Poetry |
| **Лицензия** | - |

### Ключевые фичи
- Кликер похожий на Hamster Kombat
- Django бэкенд
- Docker/Docker Compose деплой
- Poetry для зависимостей
- GitLab CI/CD

### Структура проекта
```
├── config/           # Конфигурация
├── docker/           # Docker файлы
├── docs/             # Документация
├── locale/           # Локализация
├── server/           # Django приложение
├── tests/            # Тесты
├── docker-compose.yml
├── pyproject.toml
└── setup.cfg
```

---

## 20. Fardenz/telegram-mini-app (TheVegasBot)

| Параметр | Значение |
|----------|----------|
| **GitHub** | https://github.com/Fardenz/telegram-mini-app |
| **Stars** | 2 |
| **Стек** | Node.js, Express, MongoDB, React, Chakra UI, TypeScript (78%), Docker |
| **Лицензия** | - |

### Ключевые фичи
- Виртуальное казино (Dice, Coinflip)
- Пополнение/вывод средств
- Telegram OAuth аутентификация
- Swagger API документация
- Криптографически безопасный RNG
- GitHub Actions CI/CD

### Структура проекта
```
├── .github/workflows/    # CI/CD
├── backend/              # Node.js Express сервер
├── frontend/             # React приложение
├── media/                # Ассеты и демо
└── README.md
```

---

## Сводная таблица

| # | Репозиторий | Stars | Стек | Тип |
|---|-------------|-------|------|-----|
| 1 | Hamster-Kombat-Telegram-Mini-App-Clone | 262 | Vite/TS/Tailwind | Клон игры |
| 2 | Notcoin-Telegram-Mini-App-Clone | 175 | Vite/TS/Tailwind | Клон игры |
| 3 | MasterCryptoFarmBot | 232 | Python/Flask/SQLite | Фарминг-платформа |
| 4 | Telegram-Mini-Apps/reactjs-template | 400 | React/TS/Vite/TON | Официальный шаблон |
| 5 | softstack/telegram-mini-app | 210 | React/TS/Vite/Tailwind | Демо/Шаблон |
| 6 | tamimattafi/telegram-mini-app | 114 | Node.js/Express/React | Пример API |
| 7 | crypto-clicker-miniapp | 55 | PHP/MySQL/JS | Full-stack игра |
| 8 | tonusdev/mini-content | 56 | NestJS/Next.js/MongoDB | Контент-платформа |
| 9 | notcoinWeb | 41 | Svelte/TS/Vite | Статистика игры |
| 10 | NotCoin-Mini-App-Clone | 39 | React/TS/Vite | Клон игры |
| 11 | Hamster-Kombat-Clone | 22 | React/Firebase/Telegraf | Клон с Firebase |
| 12 | seven-gram | 25 | Node.js/TS/PM2 | Фарминг-фреймворк |
| 13 | mining-clicker-app | 20 | React/Node.js | Простой кликер |
| 14 | TonStory | 14 | React/Kaboom.js/Firebase | 2D платформер |
| 15 | durka_game | 15 | PIXI.JS/Golang | Кликер-игра |
| 16 | mini-app-telegram | 16 | React/TS/Tailwind | Игра с TON |
| 17 | clicker_webapp_telegram | 14 | Python/FastAPI/Flet | Кликер на Python |
| 18 | Telegram-Minigame-Demo | 17 | Python/Flask/MongoDB | Tap-to-earn демо |
| 19 | telegram-clicker-example | 7 | Django/Docker | Django кликер |
| 20 | Fardenz/telegram-mini-app | 2 | Node.js/MongoDB/React | Казино-игра |

---

## Ключевые выводы

### Популярные технологические стеки

**Frontend:**
- React + TypeScript + Vite (наиболее популярный)
- Tailwind CSS для стилизации
- Svelte как альтернатива

**Backend:**
- Node.js + Express
- Python (Django, FastAPI, Flask)
- Go для высокопроизводительных решений

**База данных:**
- MongoDB (для гибких схем)
- Firebase/Firestore (для быстрого прототипирования)
- MySQL/PostgreSQL (для реляционных данных)
- SQLite (для простых проектов)

### Общие фичи tap-to-earn игр

1. **Механика тапов** - клик для добычи монет
2. **Система энергии** - лимит кликов с восстановлением
3. **Бустеры** - ускорители добычи
4. **Реферальная система** - бонусы за приглашения
5. **Ежедневные награды** - мотивация возвращаться
6. **Лидерборды** - соревновательный элемент
7. **Задания/квесты** - дополнительный заработок
8. **TON/крипто интеграция** - вывод заработанного

### Рекомендуемые репозитории для изучения

1. **nikandr-surkov/Hamster-Kombat-Telegram-Mini-App-Clone** - лучший клон с чистым кодом
2. **Telegram-Mini-Apps/reactjs-template** - официальный шаблон с best practices
3. **lowdigital/crypto-clicker-miniapp** - полноценный full-stack проект
4. **tonusdev/mini-content** - отличный пример NestJS + Next.js архитектуры
5. **ragibmondal/Hamster-Kombat-Clone** - пример с Firebase бэкендом

---

## Источники

- [GitHub Topics: notcoin](https://github.com/topics/notcoin)
- [GitHub Topics: tapswap](https://github.com/topics/tapswap)
- [GitHub: Telegram Mini Apps](https://github.com/telegram-mini-apps)
- [TON Documentation](https://docs.ton.org/develop/dapps/telegram-apps/app-examples)
