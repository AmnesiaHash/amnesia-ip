# AmnesiaIP

Быстрая и безопасная проверка IP-адреса с демо-авторизацией и админ-панелью. Полностью статический сайт, готовый к публикации на GitHub Pages.

## Структура

```
amnesia-ip/
├── index.html          — главная страница (IP-checker + auth)
├── admin.html          — панель администратора
├── css/
│   ├── shared.css      — design system, кнопки, модалки, формы
│   ├── main.css        — стили IP-checker
│   ├── auth.css        — кнопки входа/регистрации
│   └── admin.css       — админ-панель
└── js/
    ├── api.js          — функции-заглушки (заменяются на backend)
    ├── session.js      — управление сессией
    ├── auth.js         — модалки входа и регистрации
    ├── ip-checker.js   — логика проверки IP
    └── admin.js        — логика админ-панели
```

## Запуск локально

```bash
# Python
python -m http.server 8080

# или npx
npx serve .
```

Откройте `http://localhost:8080` в браузере.

> Для ES modules рекомендуется локальный сервер, а не открытие файла напрямую через `file://`.

## GitHub Pages

1. Загрузите репозиторий на GitHub
2. Settings → Pages → Source: branch `main`, folder `/ (root)`
3. Сайт будет доступен по адресу `https://<username>.github.io/<repo>/`

## Демо-вход в админ-панель

| Поле | Значение |
|------|----------|
| Email | `AmnesiaOwner` |
| Пароль | `Amnesia7575` |

Проверка выполняется только в браузере (временное решение).

## Функции

### Главная страница
- Автоматическое определение IPv4, IPv6, геоданных, ISP, ASN и др.
- Копирование IP, обновление данных
- Модальные окна входа и регистрации
- Клиентская валидация регистрации

### Админ-панель
- Статистика (демо-данные)
- Chat Event — broadcast-сообщения (локально в сессии)
- Список онлайн-пользователей (демо)
- Личные сообщения (заглушка до подключения сервера)

## API (внешние)

- [ipwho.is](https://ipwho.is/) — основной источник геоданных
- [ipapi.co](https://ipapi.co/) — fallback
- [api64.ipify.org](https://api64.ipify.org/) — IPv6

## Подготовка к backend

Все серверные операции вынесены в `js/api.js`:

- `login()`, `register()`, `logout()`
- `getStats()`, `getOnlineUsers()`, `getBroadcastMessages()`
- `sendBroadcastMessage()`, `sendPrivateMessage()`

При подключении Node.js/Express/Socket.IO замените тела функций на реальные API-запросы без изменения HTML и CSS.
