# 🔔 URDatabase Notify

Real-time database changes monitoring with Telegram notifications for PostgreSQL and MongoDB.

## ✨ Features

- 🚀 Real-time monitoring for PostgreSQL & MongoDB
- 🔐 User access control system
- ⚡ Instant notifications for changes
- 🎯 Select specific tables to monitor

## 🛠️ Quick Start

### Prerequisites

- 📦 Node.js 18+
- 🗄️ MongoDB & PostgreSQL
- 🤖 Telegram Bot Token

### Installation

1. **Clone & Install:**
```bash
git clone [repository-url]
cd collector && npm install
cd ../notifier && npm install
```

2. **Configure:**
- Copy `.env.sample` to `.env` in both folders
- Update with your settings

3. **Run:**
```bash
# Terminal 1
cd collector && npm start

# Terminal 2
cd notifier && npm start
```

## 🤖 Bot Commands

- `/start` - Get started
- `/help` - View commands & usage
- `/login` - Request access
- `/listen` - Monitor databases

## 🐳 Docker

```bash
# Collector
docker build -t ur-database-collector ./collector
docker run -d --env-file collector/.env ur-database-collector

# Notifier
docker build -t ur-database-notifier ./notifier
docker run -d --env-file notifier/.env ur-database-notifier
```

## 💡 How it Works

1. Register with `/login`
2. Wait for approval
3. Use `/listen` to pick databases
4. Select tables to watch
5. Get instant notifications! 🎉

## 👥 Contribute

Let's make this project cooler together - PRs are like high fives! 🎮