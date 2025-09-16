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
import { useRouter } from 'expo-router';
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
    windspeed?: number;
  };
  forecast: Array<{
    datetime: string;
    temp: number;
    tempmax: number;
    tempmin: number;
    conditions: string;
    icon: string;
    precipprob?: number;
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

interface UserProfile {
  name: string;
  location: string;
  phone: string;
  farmSize: string;
}

export default function KrishiMitraDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'राम कुमार',
    location: 'दिल्ली, भारत',
    phone: '+91 98765 43210',
    farmSize: '5 एकड़'
  });
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [farmerId] = useState('farmer_001');

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    initializeApp();
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchWeatherData(),
        fetchCropRecommendations(),
        fetchMarketPrices()
      ]);
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('त्रुटि', 'डेटा लोड करने में समस्या है। कृपया अपना कनेक्शन जांचें।');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/weather/${selectedCity}`);
      setWeatherData(response.data);
      generateWeatherAlerts(response.data);
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

  const generateWeatherAlerts = (weather: WeatherData) => {
    const alerts: string[] = [];
    
    if (weather.current?.temp > 40) {
      alerts.push('🌡️ अत्यधिक गर्मी की चेतावनी - फसलों को छाया प्रदान करें');
    }
    
    if (weather.current?.temp < 5) {
      alerts.push('❄️ ठंड की चेतावनी - फसलों को पाले से बचाएं');
    }
    
    if (weather.forecast?.[0]?.precipprob > 80) {
      alerts.push('🌧️ भारी बारिश की संभावना - जल निकासी की व्यवस्था करें');
    }
    
    if (weather.current?.windspeed > 30) {
      alerts.push('💨 तेज हवा की चेतावनी - फसलों को सहारा दें');
    }
    
    if (alerts.length === 0) {
      alerts.push('✅ मौसम अनुकूल है - खेती के लिए उपयुक्त समय');
    }
    
    setWeatherAlerts(alerts);
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

  const navigateToProfile = () => {
    router.push('/profile');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="leaf" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>KrishiMitra लोड हो रहा है...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* KrishiMitra Header */}
      <View style={styles.appHeader}>
        <View style={styles.appHeaderContent}>
          <Ionicons name="leaf" size={28} color="#FFFFFF" />
          <View style={styles.appHeaderText}>
            <Text style={styles.appTitle}>KrishiMitra</Text>
            <Text style={styles.appSubtitle}>Your Crop Recommendation</Text>
          </View>
        </View>
      </View>

      {/* User Profile Block */}
      <View style={styles.userProfileBlock}>
        <View style={styles.userInfo}>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userProfile.name}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666666" />
              <Text style={styles.userLocation}>{userProfile.location}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileIcon} onPress={navigateToProfile}>
            <Ionicons name="person-circle" size={48} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weather Alerts */}
      <View style={styles.weatherAlertsContainer}>
        <Text style={styles.alertsTitle}>मौसम अलर्ट</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weatherAlerts.map((alert, index) => (
            <View key={index} style={styles.alertCard}>
              <Text style={styles.alertText}>{alert}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Today's Weather Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="partly-sunny" size={24} color="#FF9800" />
            <Text style={styles.cardTitle}>आज का मौसम - {selectedCity}</Text>
          </View>
          
          {weatherData ? (
            <View style={styles.weatherSummary}>
              <View style={styles.tempSection}>
                <Text style={styles.mainTemp}>{Math.round(weatherData.current?.temp || 25)}°C</Text>
                <Text style={styles.weatherCondition}>{weatherData.current?.conditions || 'Clear Sky'}</Text>
              </View>
              <View style={styles.weatherStats}>
                <View style={styles.statItem}>
                  <Ionicons name="water" size={16} color="#2196F3" />
                  <Text style={styles.statText}>नमी: {weatherData.current?.humidity || 65}%</Text>
                </View>
                {weatherData.current?.windspeed && (
                  <View style={styles.statItem}>
                    <Ionicons name="flag" size={16} color="#FF9800" />
                    <Text style={styles.statText}>हवा: {weatherData.current.windspeed} km/h</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>मौसम डेटा उपलब्ध नहीं है</Text>
          )}
        </View>

        {/* Top Crop Recommendations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>सुझावित फसलें</Text>
          </View>
          
          {recommendations.length > 0 ? (
            <View style={styles.cropsGrid}>
              {recommendations.slice(0, 4).map((crop, index) => (
                <View key={index} style={styles.cropItem}>
                  <View style={styles.cropHeader}>
                    <Text style={styles.cropName}>{crop.crop_name}</Text>
                    <View style={[
                      styles.confidenceBadge,
                      { backgroundColor: crop.confidence_score >= 0.8 ? '#4CAF50' : 
                                        crop.confidence_score >= 0.6 ? '#FF9800' : '#F44336' }
                    ]}>
                      <Text style={styles.confidenceText}>
                        {Math.round(crop.confidence_score * 100)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cropProfit}>लाभ: ₹{Math.round(crop.profit_estimate)}</Text>
                  <Text style={styles.cropSeason}>{crop.growing_season}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>फसल सुझाव उपलब्ध नहीं हैं</Text>
          )}
        </View>

        {/* Market Prices Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={24} color="#2196F3" />
            <Text style={styles.cardTitle}>मंडी भाव</Text>
          </View>
          
          {marketPrices.length > 0 ? (
            <View style={styles.pricesContainer}>
              {marketPrices.slice(0, 6).map((price, index) => (
                <View key={index} style={styles.priceRow}>
                  <View style={styles.priceInfo}>
                    <Text style={styles.cropNamePrice}>{price.crop_name}</Text>
                    <Text style={styles.priceAmount}>₹{price.price_per_kg}/किग्रा</Text>
                  </View>
                  <View style={styles.trendContainer}>
                    <Ionicons 
                      name={getTrendIcon(price.price_trend)} 
                      size={16} 
                      color={getTrendColor(price.price_trend)} 
                    />
                    <Text style={[styles.trendText, { color: getTrendColor(price.price_trend) }]}>
                      {price.price_trend === 'rising' ? 'बढ़ रहा' : 
                       price.price_trend === 'falling' ? 'गिर रहा' : 'स्थिर'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>मार्केट डेटा उपलब्ध नहीं है</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>त्वरित सेवाएं</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/disease')}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>रोग पहचान</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/chat')}
            >
              <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>AI सलाह</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/weather')}
            >
              <Ionicons name="partly-sunny" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>मौसम जानकारी</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/crops')}
            >
              <Ionicons name="leaf" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>फसल सुझाव</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Farming Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>आज का कृषि सुझाव</Text>
          <View style={styles.tipsContent}>
            <View style={styles.tipItem}>
              <Ionicons name="water" size={20} color="#2196F3" />
              <Text style={styles.tipText}>
                मिट्टी की नमी को नियमित रूप से जांचें और आवश्यकतानुसार सिंचाई करें
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="leaf" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                फसल चक्र अपनाकर मिट्टी की उर्वरता बनाए रखें
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="trending-up" size={20} color="#FF9800" />
              <Text style={styles.tipText}>
                बुवाई से पहले मार्केट रेट की जांच करें और लाभदायक फसल चुनें
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
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
    gap: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  appHeader: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  appHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appHeaderText: {
    flex: 1,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  appSubtitle: {
    color: '#C8E6C9',
    fontSize: 14,
    marginTop: 2,
  },
  userProfileBlock: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666666',
  },
  profileIcon: {
    padding: 4,
  },
  weatherAlertsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  alertCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  alertText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  weatherSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempSection: {
    alignItems: 'center',
  },
  mainTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  weatherCondition: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  weatherStats: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666666',
  },
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cropItem: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  confidenceBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cropProfit: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 2,
  },
  cropSeason: {
    fontSize: 10,
    color: '#666666',
  },
  pricesContainer: {
    gap: 8,
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
  priceAmount: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 12,
  },
  tipsContent: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#1565C0',
    flex: 1,
    lineHeight: 20,
  },
  noDataText: {
    textAlign: 'center',
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 16,
  },
});