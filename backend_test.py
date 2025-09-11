#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for AgriTech Platform
Tests all API endpoints with realistic agricultural data
"""

import requests
import json
import base64
import time
from datetime import datetime
from typing import Dict, Any, List
import os
from pathlib import Path

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / 'frontend' / '.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://khetguru.preview.emergentagent.com')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing AgriTech Platform API at: {API_BASE_URL}")
print("=" * 60)

class AgriTechAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = {}
        self.polygon_id = None  # Will store created polygon ID for soil testing
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        self.test_results[test_name] = {"success": success, "details": details}
        
    def test_root_endpoint(self):
        """Test the root API endpoint"""
        try:
            response = self.session.get(f"{API_BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "AgriTech Platform API" in data.get("message", ""):
                    self.log_test("Root API Endpoint", True, f"Version: {data.get('version', 'N/A')}")
                    return True
                else:
                    self.log_test("Root API Endpoint", False, "Unexpected response format")
                    return False
            else:
                self.log_test("Root API Endpoint", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Root API Endpoint", False, f"Connection error: {str(e)}")
            return False
    
    def test_weather_api(self):
        """Test Weather API with multiple Indian cities"""
        cities = ["Delhi", "Mumbai", "Chennai", "Bangalore", "Pune"]
        success_count = 0
        
        for city in cities:
            try:
                response = self.session.get(f"{API_BASE_URL}/weather/{city}")
                if response.status_code == 200:
                    data = response.json()
                    if "city" in data and "current" in data and "forecast" in data:
                        success_count += 1
                        self.log_test(f"Weather API - {city}", True, 
                                    f"Current temp: {data.get('current', {}).get('temp', 'N/A')}°C")
                    else:
                        self.log_test(f"Weather API - {city}", False, "Missing required fields")
                else:
                    self.log_test(f"Weather API - {city}", False, f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"Weather API - {city}", False, f"Error: {str(e)}")
        
        overall_success = success_count >= 3  # At least 3 cities should work
        self.log_test("Weather API Integration", overall_success, 
                     f"{success_count}/{len(cities)} cities successful")
        return overall_success
    
    def test_polygon_creation(self):
        """Test Farm Polygon Management - Create polygon"""
        try:
            # Sample polygon coordinates for a farm in Punjab, India
            polygon_data = {
                "name": "Raman Singh Farm - Wheat Field",
                "coordinates": [[[75.8573, 30.9010], [75.8583, 30.9010], 
                               [75.8583, 30.9020], [75.8573, 30.9020], [75.8573, 30.9010]]],
                "farmer_id": "farmer_raman_001"
            }
            
            response = self.session.post(f"{API_BASE_URL}/polygons", json=polygon_data)
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "name" in data:
                    self.polygon_id = data["id"]  # Store for soil testing
                    self.log_test("Polygon Creation", True, 
                                f"Created polygon: {data['name']} (ID: {data['id']})")
                    return True
                else:
                    self.log_test("Polygon Creation", False, "Missing required fields in response")
                    return False
            else:
                self.log_test("Polygon Creation", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Polygon Creation", False, f"Error: {str(e)}")
            return False
    
    def test_soil_data_api(self):
        """Test Soil Data API"""
        # Use a known polygon ID or the one we just created
        test_polygon_ids = []
        if self.polygon_id:
            test_polygon_ids.append(self.polygon_id)
        
        # Add some sample polygon IDs that might exist
        test_polygon_ids.extend(["5e9c1a1b1c9d440000a1b2c3", "sample_polygon_001"])
        
        success = False
        for polygon_id in test_polygon_ids:
            try:
                response = self.session.get(f"{API_BASE_URL}/soil/{polygon_id}")
                if response.status_code == 200:
                    data = response.json()
                    if "polygon_id" in data and "temperature_surface" in data:
                        self.log_test("Soil Data API", True, 
                                    f"Surface temp: {data.get('temperature_surface', 'N/A')}°C, "
                                    f"Moisture: {data.get('moisture', 'N/A')}")
                        success = True
                        break
                    else:
                        continue
                elif response.status_code == 404:
                    continue  # Try next polygon ID
                else:
                    self.log_test("Soil Data API", False, f"HTTP {response.status_code}")
                    break
            except Exception as e:
                self.log_test("Soil Data API", False, f"Error: {str(e)}")
                break
        
        if not success:
            self.log_test("Soil Data API", False, "No valid polygon found or API error")
        
        return success
    
    def test_crop_recommendations(self):
        """Test Crop Recommendation Engine"""
        cities = ["Delhi", "Mumbai", "Chennai"]
        success_count = 0
        
        for city in cities:
            try:
                response = self.session.get(f"{API_BASE_URL}/recommendations/{city}")
                if response.status_code == 200:
                    data = response.json()
                    if "recommendations" in data and len(data["recommendations"]) > 0:
                        rec = data["recommendations"][0]
                        if "crop_name" in rec and "confidence_score" in rec:
                            success_count += 1
                            self.log_test(f"Crop Recommendations - {city}", True, 
                                        f"Top crop: {rec['crop_name']} "
                                        f"(Confidence: {rec['confidence_score']:.2f})")
                        else:
                            self.log_test(f"Crop Recommendations - {city}", False, 
                                        "Missing required fields in recommendation")
                    else:
                        self.log_test(f"Crop Recommendations - {city}", False, 
                                    "No recommendations returned")
                else:
                    self.log_test(f"Crop Recommendations - {city}", False, 
                                f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"Crop Recommendations - {city}", False, f"Error: {str(e)}")
        
        overall_success = success_count >= 2
        self.log_test("Crop Recommendation Engine", overall_success, 
                     f"{success_count}/{len(cities)} cities successful")
        return overall_success
    
    def test_market_prices_api(self):
        """Test Market Prices API"""
        try:
            response = self.session.get(f"{API_BASE_URL}/market-prices")
            if response.status_code == 200:
                data = response.json()
                if "prices" in data and len(data["prices"]) > 0:
                    price = data["prices"][0]
                    if "crop_name" in price and "price_per_kg" in price:
                        self.log_test("Market Prices API", True, 
                                    f"Found {len(data['prices'])} crop prices. "
                                    f"Example: {price['crop_name']} - ₹{price['price_per_kg']}/kg")
                        return True
                    else:
                        self.log_test("Market Prices API", False, "Missing required fields in price data")
                        return False
                else:
                    self.log_test("Market Prices API", False, "No price data returned")
                    return False
            else:
                self.log_test("Market Prices API", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Market Prices API", False, f"Error: {str(e)}")
            return False
    
    def test_disease_detection(self):
        """Test Disease Detection with Gemini Vision"""
        try:
            # Create a simple test image (1x1 pixel PNG) encoded as base64
            # This is a minimal valid PNG image
            test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            
            detection_data = {
                "image_base64": test_image_base64,
                "crop_type": "wheat"
            }
            
            response = self.session.post(f"{API_BASE_URL}/disease-detection", json=detection_data)
            if response.status_code == 200:
                data = response.json()
                if "disease_name" in data and "confidence" in data and "symptoms" in data:
                    self.log_test("Disease Detection", True, 
                                f"Analysis: {data['disease_name']} "
                                f"(Confidence: {data['confidence']}%)")
                    return True
                else:
                    self.log_test("Disease Detection", False, "Missing required fields in response")
                    return False
            else:
                self.log_test("Disease Detection", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Disease Detection", False, f"Error: {str(e)}")
            return False
    
    def test_agricultural_chat(self):
        """Test Agricultural AI Chat"""
        test_messages = [
            {"message": "What is the best time to plant wheat in Punjab?", "language": "en"},
            {"message": "How to improve soil fertility?", "language": "en"},
            {"message": "गेहूं की फसल में कौन सा उर्वरक सबसे अच्छा है?", "language": "hi"}
        ]
        
        success_count = 0
        for i, chat_data in enumerate(test_messages):
            try:
                response = self.session.post(f"{API_BASE_URL}/chat", json=chat_data)
                if response.status_code == 200:
                    data = response.json()
                    if "response" in data and "suggestions" in data:
                        success_count += 1
                        self.log_test(f"Agricultural Chat - Query {i+1}", True, 
                                    f"Response length: {len(data['response'])} chars, "
                                    f"Suggestions: {len(data['suggestions'])}")
                    else:
                        self.log_test(f"Agricultural Chat - Query {i+1}", False, 
                                    "Missing required fields in response")
                else:
                    self.log_test(f"Agricultural Chat - Query {i+1}", False, 
                                f"HTTP {response.status_code}")
            except Exception as e:
                self.log_test(f"Agricultural Chat - Query {i+1}", False, f"Error: {str(e)}")
        
        overall_success = success_count >= 2
        self.log_test("Agricultural AI Chat", overall_success, 
                     f"{success_count}/{len(test_messages)} queries successful")
        return overall_success
    
    def test_dashboard_api(self):
        """Test Dashboard Data API"""
        farmer_ids = ["farmer_raman_001", "farmer_001", "test_farmer_123"]
        
        for farmer_id in farmer_ids:
            try:
                response = self.session.get(f"{API_BASE_URL}/dashboard/{farmer_id}")
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ["polygons", "recent_recommendations", "market_prices", 
                                     "disease_detections", "total_polygons"]
                    
                    if all(field in data for field in required_fields):
                        self.log_test("Dashboard Data API", True, 
                                    f"Farmer: {farmer_id}, Polygons: {data['total_polygons']}, "
                                    f"Recommendations: {len(data['recent_recommendations'])}")
                        return True
                    else:
                        missing_fields = [f for f in required_fields if f not in data]
                        self.log_test("Dashboard Data API", False, 
                                    f"Missing fields: {missing_fields}")
                        continue
                else:
                    continue  # Try next farmer ID
            except Exception as e:
                self.log_test("Dashboard Data API", False, f"Error: {str(e)}")
                return False
        
        self.log_test("Dashboard Data API", False, "No valid farmer data found")
        return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print("Starting comprehensive AgriTech Platform API testing...")
        print()
        
        tests = [
            ("Root API Endpoint", self.test_root_endpoint),
            ("Weather API Integration", self.test_weather_api),
            ("Farm Polygon Management", self.test_polygon_creation),
            ("Soil Data API Integration", self.test_soil_data_api),
            ("Crop Recommendation Engine", self.test_crop_recommendations),
            ("Market Price API", self.test_market_prices_api),
            ("Disease Detection with Gemini Vision", self.test_disease_detection),
            ("Agricultural AI Chat", self.test_agricultural_chat),
            ("Dashboard Data API", self.test_dashboard_api)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n--- Testing {test_name} ---")
            try:
                if test_func():
                    passed += 1
                time.sleep(1)  # Brief pause between tests
            except Exception as e:
                self.log_test(test_name, False, f"Unexpected error: {str(e)}")
        
        print("\n" + "=" * 60)
        print(f"TEST SUMMARY: {passed}/{total} tests passed")
        print("=" * 60)
        
        # Print detailed results
        print("\nDETAILED RESULTS:")
        for test_name, result in self.test_results.items():
            status = "✅" if result["success"] else "❌"
            print(f"{status} {test_name}")
            if result["details"]:
                print(f"    {result['details']}")
        
        return passed, total, self.test_results

def main():
    """Main testing function"""
    tester = AgriTechAPITester()
    passed, total, results = tester.run_all_tests()
    
    # Return exit code based on results
    if passed == total:
        print(f"\n🎉 All tests passed! AgriTech Platform API is working correctly.")
        return 0
    else:
        failed = total - passed
        print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    exit(main())