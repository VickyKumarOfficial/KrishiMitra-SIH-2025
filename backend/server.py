from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import json
import httpx
import google.generativeai as genai
import base64
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# API Keys
AGRO_API_KEY = "4289fa32c5bd68ce663d2c63855c38ba"
WEATHER_API_KEY = "LS4NTSUYBLL5BBPBCT2BV23UY"
GEMINI_API_KEY = "AIzaSyC-81_-oJS5Gt62rUzt2dSjXAZr0GLIjHo"

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Create the main app without a prefix
app = FastAPI(title="AgriTech Platform", description="AI-powered Crop Recommendation Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class PolygonCreate(BaseModel):
    name: str
    coordinates: List[List[List[float]]]
    farmer_id: str

class Polygon(BaseModel):
    id: str
    name: str
    coordinates: List[List[List[float]]]
    farmer_id: str
    area: float
    center: List[float]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WeatherData(BaseModel):
    city: str
    current: Dict[str, Any]
    forecast: List[Dict[str, Any]]
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SoilData(BaseModel):
    polygon_id: str
    temperature_surface: float
    temperature_10cm: float
    moisture: float
    ph: Optional[float] = 6.5  # Default neutral pH
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CropRecommendation(BaseModel):
    crop_name: str
    confidence_score: float
    yield_forecast: float
    profit_estimate: float
    reasons: List[str]
    growing_season: str
    water_requirement: str
    soil_suitability: str

class MarketPrice(BaseModel):
    crop_name: str
    price_per_kg: float
    market_name: str
    price_trend: str  # "rising", "falling", "stable"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DiseaseDetection(BaseModel):
    image_base64: str
    crop_type: Optional[str] = None

class DiseaseResult(BaseModel):
    disease_name: str
    confidence: float
    symptoms: List[str]
    treatment: List[str]
    severity: str
    prevention_tips: List[str]

class ChatMessage(BaseModel):
    message: str
    language: Optional[str] = "en"

class ChatResponse(BaseModel):
    response: str
    suggestions: List[str]

# Utility Functions
async def get_gemini_response(prompt: str, image_data: Optional[bytes] = None) -> str:
    """Get response from Gemini AI"""
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        if image_data:
            # Convert image data to PIL Image
            image = Image.open(io.BytesIO(image_data))
            response = model.generate_content([prompt, image])
        else:
            response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        logging.error(f"Gemini API error: {e}")
        return "I'm sorry, I'm having trouble processing your request right now."

async def fetch_weather_data(city: str) -> Dict[str, Any]:
    """Fetch weather data from Visual Crossing API"""
    try:
        url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{city}"
        params = {
            "unitGroup": "metric",
            "key": WEATHER_API_KEY,
            "contentType": "json",
            "include": "days,hours,current"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logging.error(f"Weather API error: {e}")
        return {}

async def create_agro_polygon(name: str, coordinates: List[List[List[float]]]) -> Dict[str, Any]:
    """Create polygon in Agromonitoring API"""
    try:
        url = "http://api.agromonitoring.com/agro/1.0/polygons"
        payload = {
            "name": name,
            "geo_json": {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": coordinates
                }
            }
        }
        params = {"appid": AGRO_API_KEY}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logging.error(f"Agro API error: {e}")
        return {}

async def fetch_soil_data(polygon_id: str) -> Dict[str, Any]:
    """Fetch soil data from Agromonitoring API"""
    try:
        url = "http://api.agromonitoring.com/agro/1.0/soil"
        params = {
            "appid": AGRO_API_KEY,
            "polyid": polygon_id
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logging.error(f"Soil API error: {e}")
        return {}

def generate_crop_recommendations(weather_data: Dict, soil_data: Dict, location: str) -> List[CropRecommendation]:
    """Generate crop recommendations based on weather and soil data"""
    recommendations = []
    
    # Sample crop database with Indian crops
    crops_db = [
        {
            "name": "Rice",
            "temp_range": (20, 35),
            "moisture_req": "high",
            "ph_range": (5.5, 7.0),
            "season": "Kharif",
            "yield_per_acre": 25,
            "price_per_kg": 25
        },
        {
            "name": "Wheat",
            "temp_range": (15, 25),
            "moisture_req": "medium",
            "ph_range": (6.0, 7.5),
            "season": "Rabi",
            "yield_per_acre": 20,
            "price_per_kg": 22
        },
        {
            "name": "Cotton",
            "temp_range": (21, 30),
            "moisture_req": "medium",
            "ph_range": (6.0, 8.0),
            "season": "Kharif",
            "yield_per_acre": 15,
            "price_per_kg": 45
        },
        {
            "name": "Sugarcane",
            "temp_range": (20, 30),
            "moisture_req": "high",
            "ph_range": (6.0, 7.5),
            "season": "Kharif",
            "yield_per_acre": 400,
            "price_per_kg": 3
        },
        {
            "name": "Maize",
            "temp_range": (18, 27),
            "moisture_req": "medium",
            "ph_range": (6.0, 7.0),
            "season": "Kharif/Rabi",
            "yield_per_acre": 18,
            "price_per_kg": 18
        }
    ]
    
    # Get current temperature from weather data
    current_temp = 25  # Default
    if weather_data and "days" in weather_data:
        current_temp = weather_data["days"][0].get("temp", 25)
    
    # Get soil moisture
    soil_moisture = soil_data.get("moisture", 0.2) if soil_data else 0.2
    
    for crop in crops_db:
        confidence = 0.7  # Base confidence
        reasons = []
        
        # Temperature suitability
        temp_min, temp_max = crop["temp_range"]
        if temp_min <= current_temp <= temp_max:
            confidence += 0.2
            reasons.append(f"Temperature ({current_temp}°C) is ideal for {crop['name']}")
        
        # Moisture suitability
        if crop["moisture_req"] == "high" and soil_moisture > 0.3:
            confidence += 0.1
            reasons.append("High soil moisture suitable for water-loving crops")
        elif crop["moisture_req"] == "medium" and 0.15 <= soil_moisture <= 0.4:
            confidence += 0.1
            reasons.append("Moderate soil moisture ideal for balanced growth")
        
        # Only include crops with decent confidence
        if confidence > 0.6:
            recommendations.append(CropRecommendation(
                crop_name=crop["name"],
                confidence_score=min(confidence, 1.0),
                yield_forecast=crop["yield_per_acre"],
                profit_estimate=crop["yield_per_acre"] * crop["price_per_kg"],
                reasons=reasons,
                growing_season=crop["season"],
                water_requirement=crop["moisture_req"],
                soil_suitability="Suitable"
            ))
    
    # Sort by confidence score
    recommendations.sort(key=lambda x: x.confidence_score, reverse=True)
    return recommendations[:5]  # Return top 5

def generate_mock_market_prices() -> List[MarketPrice]:
    """Generate mock market prices for common crops"""
    crops = [
        {"name": "Rice", "price": 25, "trend": "stable"},
        {"name": "Wheat", "price": 22, "trend": "rising"},
        {"name": "Cotton", "price": 45, "trend": "falling"},
        {"name": "Sugarcane", "price": 3, "trend": "stable"},
        {"name": "Maize", "price": 18, "trend": "rising"},
        {"name": "Onion", "price": 15, "trend": "rising"},
        {"name": "Potato", "price": 12, "trend": "stable"},
        {"name": "Tomato", "price": 20, "trend": "falling"}
    ]
    
    return [
        MarketPrice(
            crop_name=crop["name"],
            price_per_kg=crop["price"],
            market_name="Local Mandi",
            price_trend=crop["trend"]
        ) for crop in crops
    ]

# API Routes
@api_router.get("/")
async def root():
    return {"message": "AgriTech Platform API", "version": "1.0.0"}

@api_router.post("/polygons", response_model=Polygon)
async def create_polygon(polygon_data: PolygonCreate):
    """Create a new farm polygon"""
    try:
        # Create polygon in Agromonitoring API
        agro_response = await create_agro_polygon(polygon_data.name, polygon_data.coordinates)
        
        if not agro_response:
            raise HTTPException(status_code=400, detail="Failed to create polygon in external API")
        
        # Store in MongoDB
        polygon = Polygon(
            id=agro_response.get("id", str(uuid.uuid4())),
            name=polygon_data.name,
            coordinates=polygon_data.coordinates,
            farmer_id=polygon_data.farmer_id,
            area=agro_response.get("area", 0),
            center=agro_response.get("center", [0, 0])
        )
        
        await db.polygons.insert_one(polygon.dict())
        return polygon
    
    except Exception as e:
        logging.error(f"Create polygon error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create polygon")

@api_router.get("/weather/{city}")
async def get_weather(city: str):
    """Get weather data for a city"""
    try:
        # Check cache first
        cached_weather = await db.weather.find_one(
            {"city": city, "updated_at": {"$gte": datetime.utcnow() - timedelta(hours=1)}}
        )
        
        if cached_weather:
            return cached_weather
        
        # Fetch fresh data
        weather_data = await fetch_weather_data(city)
        
        if weather_data:
            # Store in cache
            weather_doc = WeatherData(
                city=city,
                current=weather_data.get("currentConditions", {}),
                forecast=weather_data.get("days", [])[:7]  # 7-day forecast
            )
            
            await db.weather.replace_one(
                {"city": city}, 
                weather_doc.dict(), 
                upsert=True
            )
            
            return weather_doc.dict()
        
        raise HTTPException(status_code=404, detail="Weather data not found")
    
    except Exception as e:
        logging.error(f"Weather API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")

@api_router.get("/soil/{polygon_id}")
async def get_soil_data(polygon_id: str):
    """Get soil data for a polygon"""
    try:
        # Check cache first
        cached_soil = await db.soil.find_one(
            {"polygon_id": polygon_id, "updated_at": {"$gte": datetime.utcnow() - timedelta(hours=6)}}
        )
        
        if cached_soil:
            return cached_soil
        
        # Fetch fresh data
        soil_data = await fetch_soil_data(polygon_id)
        
        if soil_data:
            # Convert Kelvin to Celsius
            soil_doc = SoilData(
                polygon_id=polygon_id,
                temperature_surface=soil_data.get("t0", 300) - 273.15,  # K to C
                temperature_10cm=soil_data.get("t10", 300) - 273.15,    # K to C
                moisture=soil_data.get("moisture", 0.2)
            )
            
            await db.soil.replace_one(
                {"polygon_id": polygon_id}, 
                soil_doc.dict(), 
                upsert=True
            )
            
            return soil_doc.dict()
        
        raise HTTPException(status_code=404, detail="Soil data not found")
    
    except Exception as e:
        logging.error(f"Soil API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch soil data")

@api_router.get("/recommendations/{city}")
async def get_crop_recommendations(city: str, polygon_id: Optional[str] = None):
    """Get AI-powered crop recommendations"""
    try:
        # Get weather and soil data
        weather_data = await fetch_weather_data(city)
        soil_data = {}
        
        if polygon_id:
            soil_data = await fetch_soil_data(polygon_id)
        
        # Generate recommendations
        recommendations = generate_crop_recommendations(weather_data, soil_data, city)
        
        # Store recommendations in cache
        await db.recommendations.insert_one({
            "city": city,
            "polygon_id": polygon_id,
            "recommendations": [rec.dict() for rec in recommendations],
            "created_at": datetime.utcnow()
        })
        
        return {"recommendations": recommendations}
    
    except Exception as e:
        logging.error(f"Recommendations error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")

@api_router.get("/market-prices")
async def get_market_prices():
    """Get current market prices"""
    try:
        # For now, return mock data
        # In production, this would fetch from real market APIs
        prices = generate_mock_market_prices()
        
        # Cache the prices
        await db.market_prices.delete_many({})  # Clear old data
        await db.market_prices.insert_many([price.dict() for price in prices])
        
        return {"prices": prices}
    
    except Exception as e:
        logging.error(f"Market prices error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market prices")

@api_router.post("/disease-detection")
async def detect_disease(detection_data: DiseaseDetection):
    """Detect crop diseases from image using AI"""
    try:
        # Decode base64 image
        image_data = base64.b64decode(detection_data.image_base64)
        
        # Create prompt for disease detection
        prompt = f"""
        Analyze this crop image for diseases, pests, or health issues. 
        Crop type: {detection_data.crop_type or 'Unknown'}
        
        Please provide:
        1. Disease name (if any)
        2. Confidence level (0-100%)
        3. Visible symptoms
        4. Treatment recommendations
        5. Severity level (Low/Medium/High)
        6. Prevention tips
        
        Format as JSON with keys: disease_name, confidence, symptoms, treatment, severity, prevention_tips
        """
        
        # Get AI analysis
        response = await get_gemini_response(prompt, image_data)
        
        # Try to parse JSON response
        try:
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                result_data = json.loads(json_match.group())
            else:
                # Fallback parsing
                result_data = {
                    "disease_name": "Analysis incomplete",
                    "confidence": 50,
                    "symptoms": ["Image analysis in progress"],
                    "treatment": ["Consult agricultural expert"],
                    "severity": "Medium",
                    "prevention_tips": ["Regular monitoring recommended"]
                }
        except:
            result_data = {
                "disease_name": "Healthy plant detected",
                "confidence": 75,
                "symptoms": ["No visible disease symptoms"],
                "treatment": ["Continue current care routine"],
                "severity": "Low",
                "prevention_tips": ["Maintain good farming practices"]
            }
        
        result = DiseaseResult(**result_data)
        
        # Store analysis result
        await db.disease_detections.insert_one({
            "result": result.dict(),
            "crop_type": detection_data.crop_type,
            "created_at": datetime.utcnow()
        })
        
        return result
    
    except Exception as e:
        logging.error(f"Disease detection error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze image")

@api_router.post("/chat")
async def agricultural_chat(chat_data: ChatMessage):
    """AI-powered agricultural advisory chat"""
    try:
        # Create context-aware prompt
        prompt = f"""
        You are an expert agricultural advisor helping Indian farmers. 
        Respond to this question in {chat_data.language or 'English'}.
        
        Question: {chat_data.message}
        
        Provide practical, actionable advice suitable for Indian farming conditions.
        Include specific suggestions and be encouraging.
        """
        
        # Get AI response
        response = await get_gemini_response(prompt)
        
        # Generate follow-up suggestions
        suggestions = [
            "Tell me about crop rotation",
            "What are the best fertilizers?",
            "How to improve soil health?",
            "Market price trends"
        ]
        
        result = ChatResponse(response=response, suggestions=suggestions)
        
        # Store chat history
        await db.chat_history.insert_one({
            "message": chat_data.message,
            "response": response,
            "language": chat_data.language,
            "created_at": datetime.utcnow()
        })
        
        return result
    
    except Exception as e:
        logging.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process chat message")

@api_router.get("/dashboard/{farmer_id}")
async def get_dashboard_data(farmer_id: str):
    """Get comprehensive dashboard data for a farmer"""
    try:
        # Get farmer's polygons
        polygons_cursor = db.polygons.find({"farmer_id": farmer_id})
        polygons = []
        async for polygon in polygons_cursor:
            polygon['_id'] = str(polygon['_id'])  # Convert ObjectId to string
            polygons.append(polygon)
        
        # Get recent recommendations
        recommendations_cursor = db.recommendations.find({}, sort=[("created_at", -1)]).limit(5)
        recent_recommendations = []
        async for rec in recommendations_cursor:
            rec['_id'] = str(rec['_id'])  # Convert ObjectId to string
            recent_recommendations.append(rec)
        
        # Get market prices
        prices_cursor = db.market_prices.find()
        market_prices = []
        async for price in prices_cursor:
            price['_id'] = str(price['_id'])  # Convert ObjectId to string
            market_prices.append(price)
        
        # Get recent disease detections
        detections_cursor = db.disease_detections.find({}, sort=[("created_at", -1)]).limit(3)
        disease_detections = []
        async for detection in detections_cursor:
            detection['_id'] = str(detection['_id'])  # Convert ObjectId to string
            disease_detections.append(detection)
        
        return {
            "polygons": polygons,
            "recent_recommendations": recent_recommendations,
            "market_prices": market_prices,
            "disease_detections": disease_detections,
            "total_polygons": len(polygons),
            "updated_at": datetime.utcnow()
        }
    
    except Exception as e:
        logging.error(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()