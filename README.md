# Finance WaveSight 3

A financial trend spotting platform that rewards users for identifying emerging market movements across social media platforms. Users submit comprehensive trend analyses and earn payouts based on quality and accuracy.

## 🚀 Features

- **Financial Trend Submission**: Submit detailed analyses of emerging financial trends from social media
- **Quality-Based Rewards**: Earn $1.00 - $10.00 per verified trend based on quality
- **Performance Tiers**: Four-tier spotter system with escalating benefits
- **Real-time Verification**: Community-driven trend validation system
- **Browser Extension**: Capture trends directly from TikTok, Instagram, Twitter, and YouTube
- **Enterprise Dashboard**: Advanced analytics for business users
- **Mobile App**: iOS and Android apps for on-the-go trend spotting

## 📁 Project Structure

```
finance-wavesight-3/
├── web/                   # Next.js web application
├── backend/               # Python FastAPI backend
├── mobile/                # React Native mobile app
├── browser-extension/     # Chrome/Edge extension
├── ml/                    # Machine learning models
├── supabase/             # Database schemas and migrations
├── kubernetes/           # K8s deployment configs
└── shared/               # Shared types and utilities
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Python FastAPI, SQLAlchemy, Alembic
- **Database**: Supabase (PostgreSQL)
- **Mobile**: React Native, Expo
- **ML**: Python, TensorFlow/PyTorch
- **Deployment**: Vercel (web), Docker, Kubernetes

## 🚦 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Supabase account
- React Native development environment (for mobile)

### Environment Variables

Create a `.env.local` file in the `web` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Web Dashboard
```bash
cd web
npm install
npm run dev
```

### Mobile App
```bash
cd mobile
npm install
# iOS
cd ios && pod install && cd ..
npm run ios
# Android
npm run android
```

### Browser Extension
1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `browser-extension` folder

## 🚀 Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

### Deploy Backend to Docker

```bash
cd backend
docker build -t finance-wavesight-backend .
docker run -p 8000:8000 finance-wavesight-backend
```

## 📊 Database Schema

The main entities include:
- `profiles`: User profiles and settings
- `finance_trends`: Submitted financial trends
- `user_earnings`: Earnings and payout tracking
- `trend_validations`: Community validation votes
- `performance_tiers`: Spotter tier system

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- JWT authentication via Supabase Auth
- API rate limiting
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential.

## 📧 Contact

For questions or support, please contact the development team.