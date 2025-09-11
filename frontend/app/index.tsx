import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

// Types
interface WeatherData {
  city: string;
  current: {
    temp: number;
    humidity: number;
    conditions: string;
  };
  forecast: Array<{
    datetime: string;
    temp: number;
    tempmax: number;
    tempmin: number;
    conditions: string;
    icon: string;
  }>;
}

interface CropRecommendation {
  crop_name: string;
  confidence_score: number;
  yield_forecast: number;
  profit_estimate: number;
  reasons: string[];
  growing_season: string;
  water_requirement: string;
  soil_suitability: string;
}

interface MarketPrice {
  crop_name: string;
  price_per_kg: number;
  market_name: string;
  price_trend: string;
}

interface DashboardData {
  polygons: any[];
  recent_recommendations: any[];
  market_prices: MarketPrice[];
  disease_detections: any[];
  total_polygons: number;
}

export default function AgriTechDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [farmerId] = useState('farmer_001'); // Mock farmer ID

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchWeatherData(),
        fetchCropRecommendations(),
        fetchMarketPrices(),
        fetchDashboardData()
      ]);
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to load app data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/weather/${selectedCity}`);
      setWeatherData(response.data);
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  const fetchCropRecommendations = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/recommendations/${selectedCity}`);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Recommendations fetch error:', error);
    }
  };

  const fetchMarketPrices = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/market-prices`);
      setMarketPrices(response.data.prices);
    } catch (error) {
      console.error('Market prices fetch error:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/dashboard/${farmerId}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return 'trending-up';
      case 'falling': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return '#4CAF50';
      case 'falling': return '#F44336';
      default: return '#FF9800';
    }
  };

  const navigateToScreen = (screen: string) => {
    Alert.alert('Navigation', `Navigating to ${screen} screen`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading AgriTech Platform...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>AgriTech Platform</Text>
            <Text style={styles.headerSubtitle}>Smart Farming Solutions</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Weather Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="partly-sunny" size={24} color="#FF9800" />
            <Text style={styles.cardTitle}>Weather - {selectedCity}</Text>
          </View>
          
          {weatherData ? (
            <View style={styles.weatherContent}>
              <View style={styles.currentWeather}>
                <Text style={styles.temperature}>
                  {weatherData.current?.temp || 25}°C
                </Text>
                <Text style={styles.weatherDescription}>
                  {weatherData.current?.conditions || 'Clear Sky'}
                </Text>
                <Text style={styles.humidity}>
                  Humidity: {weatherData.current?.humidity || 65}%
                </Text>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
                {weatherData.forecast?.slice(0, 5).map((day, index) => (
                  <View key={index} style={styles.forecastDay}>
                    <Text style={styles.forecastDate}>
                      {new Date(day.datetime).toLocaleDateString('en', { weekday: 'short' })}
                    </Text>
                    <Ionicons name="partly-sunny" size={20} color="#FF9800" />
                    <Text style={styles.forecastTemp}>{Math.round(day.temp)}°C</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.noDataText}>Weather data not available</Text>
          )}
        </View>

        {/* Crop Recommendations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Crop Recommendations</Text>
          </View>
          
          {recommendations.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommendations.slice(0, 3).map((crop, index) => (
                <TouchableOpacity key={index} style={styles.cropCard}>
                  <Text style={styles.cropName}>{crop.crop_name}</Text>
                  <Text style={styles.confidence}>
                    Confidence: {Math.round(crop.confidence_score * 100)}%
                  </Text>
                  <Text style={styles.cropDetail}>
                    Expected Yield: {crop.yield_forecast} kg/acre
                  </Text>
                  <Text style={styles.cropDetail}>
                    Profit: ₹{Math.round(crop.profit_estimate)}
                  </Text>
                  <Text style={styles.season}>{crop.growing_season}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>No recommendations available</Text>
          )}
        </View>

        {/* Market Prices */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={24} color="#2196F3" />
            <Text style={styles.cardTitle}>Market Prices</Text>
          </View>
          
          {marketPrices.length > 0 ? (
            <View style={styles.pricesContainer}>
              {marketPrices.slice(0, 6).map((price, index) => (
                <View key={index} style={styles.priceRow}>
                  <View style={styles.priceInfo}>
                    <Text style={styles.cropNamePrice}>{price.crop_name}</Text>
                    <Text style={styles.marketName}>{price.market_name}</Text>
                  </View>
                  <View style={styles.priceRight}>
                    <Text style={styles.priceAmount}>₹{price.price_per_kg}/kg</Text>
                    <View style={styles.trendContainer}>
                      <Ionicons 
                        name={getTrendIcon(price.price_trend)} 
                        size={16} 
                        color={getTrendColor(price.price_trend)} 
                      />
                      <Text style={[styles.trendText, { color: getTrendColor(price.price_trend) }]}>
                        {price.price_trend}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>Market prices not available</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('Disease Detection')}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Disease Detection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('AI Chat')}
            >
              <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>AI Advisory</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('Soil Analysis')}
            >
              <Ionicons name="analytics" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Soil Analysis</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('Farm Management')}
            >
              <Ionicons name="map" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Farm Areas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Stats */}
        {dashboardData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Farm Overview</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dashboardData.total_polygons}</Text>
                <Text style={styles.statLabel}>Farm Areas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dashboardData.recent_recommendations.length}</Text>
                <Text style={styles.statLabel}>Recommendations</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{dashboardData.disease_detections.length}</Text>
                <Text style={styles.statLabel}>Recent Scans</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigateToScreen('Dashboard')}>
          <Ionicons name="home" size={24} color="#4CAF50" />
          <Text style={[styles.navText, { color: '#4CAF50' }]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigateToScreen('Weather')}>
          <Ionicons name="partly-sunny" size={24} color="#757575" />
          <Text style={styles.navText}>Weather</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigateToScreen('Crops')}>
          <Ionicons name="leaf" size={24} color="#757575" />
          <Text style={styles.navText}>Crops</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigateToScreen('Chat')}>
          <Ionicons name="chatbubbles" size={24} color="#757575" />
          <Text style={styles.navText}>AI Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigateToScreen('Profile')}>
          <Ionicons name="person" size={24} color="#757575" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#C8E6C9',
    fontSize: 14,
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  weatherContent: {
    gap: 16,
  },
  currentWeather: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  weatherDescription: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  humidity: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  forecastScroll: {
    marginTop: 8,
  },
  forecastDay: {
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    minWidth: 60,
  },
  forecastDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 4,
  },
  cropCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 160,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cropName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  confidence: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  cropDetail: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  season: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 4,
  },
  pricesContainer: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  priceInfo: {
    flex: 1,
  },
  cropNamePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  marketName: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
    textTransform: 'capitalize',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  noDataText: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 11,
    marginTop: 4,
    color: '#757575',
  },
});