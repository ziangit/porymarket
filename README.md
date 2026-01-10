# 🎯 Polymarket Insider Hunter

Real-time monitoring system to detect potential insider trading on Polymarket by analyzing suspicious trading patterns.

![Dashboard Screenshot](./images/dashboard.png)

## 🌟 Features

- 🔍 **Real-time Monitoring** - Scans active Polymarket events every minute
- 🚨 **Smart Alerts** - Detects suspicious wallet patterns using multi-criteria scoring
- 📊 **Analytics Dashboard** - Beautiful UI showing alerts and statistics
- 💰 **Trade Simulation** - Track hypothetical investments (no real money)
- 🎯 **Insider Detection Criteria**:
  - Fresh wallets (< 24 hours old)
  - Low market participation (< 3 markets)
  - Significant trade sizes (> $1,000)
  - Quick action after wallet creation

## 📸 Screenshots

### Main Dashboard

![Main Dashboard](./images/dashboard.png)
_Real-time insider alerts with detailed trade information and radar scores_

## 🛠 Tech Stack

**Backend:**

- NestJS
- MySQL with Prisma ORM
- Docker & Docker Compose
- TypeScript

**Frontend:**

- React with Vite
- Axios for API calls
- Modern CSS styling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ziangit/porymarket.git
   cd porymarket
   ```

2. **Start MySQL with Docker**

   ```bash
   docker-compose up -d mysql
   ```

3. **Setup Backend**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npx prisma generate
   npx prisma migrate dev
   npm run start:dev
   ```

4. **Setup Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📝 Environment Variables

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://root:rootpassword@localhost:3307/polymarket"
GAMMA_API_URL=https://gamma-api.polymarket.com
```

## 🔧 API Endpoints

- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/recent?hours=24` - Get recent alerts
- `GET /api/markets` - Get active markets
- `GET /api/markets/trades/recent` - Get recent trades
- `POST /api/monitoring/scan` - Manually trigger scan
- `GET /api/simulation/stats` - Get simulation statistics

## 📊 Insider Detection Algorithm

The system scores wallets based on:

| Criteria          | Score | Threshold                |
| ----------------- | ----- | ------------------------ |
| Wallet Age < 24h  | +30   | < 86,400 seconds         |
| Total Markets < 3 | +25   | < 3 markets              |
| Trade Size > $10k | +25   | > $10,000                |
| Quick Action      | +20   | < 20% of wallet lifetime |

**Insider Alert**: Score ≥ 50% + Fresh wallet + Low market count

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

This starts:

- MySQL database on port 3307
- Backend API on port 3001

## 🧪 Development

### Run Prisma Studio

```bash
cd backend
npx prisma studio
```

### Manual Scan Trigger

```bash
curl -X POST http://localhost:3001/api/monitoring/scan
```

### Check Logs

```bash
# Backend logs
cd backend
npm run start:dev

# Docker logs
docker-compose logs -f
```

## 📁 Project Structure
