# KrishiMitra - Local Development Setup

## Prerequisites

Before you start, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd krishimitra

# Make the startup script executable
chmod +x start-local.sh

# Run the automated setup
./start-local.sh
```

### Option 2: Manual Setup

#### 1. Setup MongoDB

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
Start MongoDB service from Windows Services or run:
```cmd
net start MongoDB
```

#### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.local .env

# Start backend server
python server.py
```

The backend will start on `http://localhost:8001`

#### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Create .env file
cp .env.local .env

# Start frontend
npm start
# or
npx expo start
```

The frontend will start on `http://localhost:3000`

## Environment Configuration

### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017/krishimitra
DB_NAME=krishimitra
AGRO_API_KEY=4289fa32c5bd68ce663d2c63855c38ba
WEATHER_API_KEY=LS4NTSUYBLL5BBPBCT2BV23UY
GEMINI_API_KEY=AIzaSyC-81_-oJS5Gt62rUzt2dSjXAZr0GLIjHo
```

### Frontend (.env)
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

## Troubleshooting

### Network Errors (AxiosError: Network Error)

This is the most common issue when running locally. Here are the solutions:

#### 1. Backend Not Running
- Ensure backend is running on port 8001
- Check: `http://localhost:8001/api/` should return API info

#### 2. Wrong Backend URL
- Verify `EXPO_PUBLIC_BACKEND_URL=http://localhost:8001` in frontend/.env
- Restart the frontend after changing .env

#### 3. CORS Issues
- The backend includes CORS middleware for local development
- If still having issues, try: `http://127.0.0.1:8001` instead of `localhost`

#### 4. Port Conflicts
- Backend uses port 8001, frontend uses port 3000
- If ports are busy, kill existing processes:
```bash
# Kill process on port 8001
lsof -ti:8001 | xargs kill -9

# Kill process on port 3000  
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Issues

#### 1. MongoDB Not Running
```bash
# Check if MongoDB is running
pgrep mongod

# Start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

#### 2. Connection String Issues
- Default: `mongodb://localhost:27017/krishimitra`
- If using MongoDB Atlas, update MONGO_URL in backend/.env

### API Key Issues

The app includes demo API keys, but you can get your own:

1. **Weather API**: [Visual Crossing Weather](https://www.visualcrossing.com/weather-api)
2. **Agro API**: [Agromonitoring](https://agromonitoring.com/api)
3. **Gemini AI**: [Google AI Studio](https://makersuite.google.com/app/apikey)

## Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **MongoDB**: mongodb://localhost:27017

## Testing the Setup

1. Open http://localhost:3000
2. Navigate to Weather tab - should load weather data
3. Navigate to Crops tab - should show crop recommendations
4. Check browser console for any errors

## Mobile Testing

For mobile testing with Expo Go:

1. Install Expo Go app on your phone
2. Run `npx expo start` in frontend directory
3. Scan QR code with Expo Go app
4. **Important**: Your phone and computer must be on the same network

## ML Model Integration Points

The app is ready for ML model integration:

### 1. Mandi Price Prediction
```javascript
// In /app/frontend/app/crops.tsx
const fetchMandiPredictions = async () => {
  // TODO: Replace with actual ML model API call
  const response = await axios.post(`${BACKEND_URL}/api/ml/mandi-prediction`, {
    location: selectedCity,
    weather_data: weatherData,
    historical_prices: historicalData
  });
};
```

### 2. Disease Detection
```javascript
// In /app/frontend/app/disease.tsx  
const analyzeDiseaseFromImage = async (base64Image: string) => {
  // TODO: Replace with actual ML model API call
  const response = await axios.post(`${BACKEND_URL}/api/ml/disease-analysis`, {
    image_base64: base64Image,
    crop_type: cropType,
    location: location
  });
};
```

## Common Commands

```bash
# Check if services are running
ps aux | grep python  # Backend
ps aux | grep node     # Frontend
ps aux | grep mongod   # MongoDB

# Restart services
pkill -f "python server.py"  # Kill backend
pkill -f "expo start"        # Kill frontend

# View logs
tail -f backend/logs.log     # Backend logs
```

## Support

If you encounter any issues:

1. Check this troubleshooting guide
2. Ensure all prerequisites are installed
3. Verify environment variables are set correctly
4. Check that all services are running on correct ports

## Features Working Locally

✅ **Language Translation** (Hindi/English)  
✅ **Weather Data** (Visual Crossing API)  
✅ **Crop Recommendations** (AI-powered)  
✅ **Market Prices** (Mock data)  
✅ **Disease Detection** (Gemini AI integration)  
✅ **Multilingual Chat** (Agricultural advisory)  
✅ **User Profile Management**  
✅ **ML Model Integration Points** (Ready for your models)

The application should work exactly like the hosted version once properly configured!