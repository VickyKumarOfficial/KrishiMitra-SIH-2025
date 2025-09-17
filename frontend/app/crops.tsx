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
  RefreshControl,
  TextInput,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

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

interface MandiPricePrediction {
  crop_name: string;
  current_price: number;
  predicted_price: number;
  price_change_percent: number;
  trend: 'rising' | 'falling' | 'stable';
  confidence: number;
  seasonal_factors: string[];
  weather_impact: string;
  prediction_period: string;
}

interface SeasonalTrend {
  month: string;
  predicted_price: number;
  confidence: number;
  factors: string[];
}

export default function CropsScreen() {
  const { language, t } = useLanguage();
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [mandiPredictions, setMandiPredictions] = useState<MandiPricePrediction[]>([]);
  const [seasonalTrends, setSeasonalTrends] = useState<SeasonalTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [customCity, setCustomCity] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null);
  const [selectedMandiCrop, setSelectedMandiCrop] = useState<string>('Rice');

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  const popularCities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Hyderabad'];

  useEffect(() => {
    fetchCropRecommendations(selectedCity);
    fetchMandiPredictions();
  }, [selectedCity]);

  const fetchCropRecommendations = async (city: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/recommendations/${city}`);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Recommendations fetch error:', error);
      Alert.alert(t('error'), `Failed to fetch crop recommendations for ${city}.`);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // ML Model Integration Point for Mandi Price Prediction
  const fetchMandiPredictions = async () => {
    try {
      // This is where your ML model will be integrated
      // For now, using mock data with realistic structure
      const mockPredictions: MandiPricePrediction[] = [
        {
          crop_name: 'Rice',
          current_price: 25,
          predicted_price: 28,
          price_change_percent: 12,
          trend: 'rising',
          confidence: 85,
          seasonal_factors: ['Monsoon season', 'Festival demand'],
          weather_impact: 'Good rainfall expected to increase yield',
          prediction_period: 'Next 30 days'
        },
        {
          crop_name: 'Wheat',
          current_price: 22,
          predicted_price: 21,
          price_change_percent: -4.5,
          trend: 'falling',
          confidence: 78,
          seasonal_factors: ['Harvest season', 'Increased supply'],
          weather_impact: 'Favorable weather for harvesting',
          prediction_period: 'Next 30 days'
        },
        {
          crop_name: 'Cotton',
          current_price: 45,
          predicted_price: 47,
          price_change_percent: 4.4,
          trend: 'stable',
          confidence: 72,
          seasonal_factors: ['Export demand', 'Processing season'],
          weather_impact: 'Moderate weather impact',
          prediction_period: 'Next 30 days'
        }
      ];

      // TODO: Replace with actual ML model API call
      // const response = await axios.post(`${BACKEND_URL}/api/ml/mandi-prediction`, {
      //   location: selectedCity,
      //   weather_data: weatherData,
      //   historical_prices: historicalData
      // });
      
      setMandiPredictions(mockPredictions);
      generateSeasonalTrends(selectedMandiCrop);
    } catch (error) {
      console.error('Mandi prediction fetch error:', error);
    }
  };

  // Generate seasonal trends for ML model
  const generateSeasonalTrends = (cropName: string) => {
    // Mock seasonal trend data - replace with ML model
    const mockTrends: SeasonalTrend[] = [
      { month: 'Jan', predicted_price: 24, confidence: 85, factors: ['Winter harvest'] },
      { month: 'Feb', predicted_price: 26, confidence: 82, factors: ['Post-harvest demand'] },
      { month: 'Mar', predicted_price: 28, confidence: 78, factors: ['Festival season'] },
      { month: 'Apr', predicted_price: 25, confidence: 80, factors: ['Supply stabilization'] },
      { month: 'May', predicted_price: 27, confidence: 75, factors: ['Summer demand'] },
      { month: 'Jun', predicted_price: 30, confidence: 70, factors: ['Pre-monsoon storage'] }
    ];
    
    setSeasonalTrends(mockTrends);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCropRecommendations(selectedCity);
    fetchMandiPredictions();
  };

  const handleCitySearch = () => {
    if (customCity.trim()) {
      setSelectedCity(customCity.trim());
      setCustomCity('');
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return '#4CAF50';
    if (score >= 0.6) return '#FF9800';
    return '#F44336';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return '#4CAF50';
      case 'falling': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return 'trending-up';
      case 'falling': return 'trending-down';
      default: return 'remove';
    }
  };

  const getSeasonColor = (season: string) => {
    if (season.includes('Kharif')) return '#4CAF50';
    if (season.includes('Rabi')) return '#2196F3';
    return '#FF9800';
  };

  const getWaterRequirementIcon = (requirement: string) => {
    if (requirement === 'high') return 'water';
    if (requirement === 'medium') return 'rainy';
    return 'sunny';
  };

  const cropIcons: { [key: string]: string } = {
    'Rice': 'leaf',
    'Wheat': 'nutrition',
    'Cotton': 'flower',
    'Sugarcane': 'leaf-outline',
    'Maize': 'nutrition-outline',
    'Potato': 'ellipse',
    'Tomato': 'ellipse-outline',
    'Onion': 'ellipse',
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>{t('cropRecommendations')}</Text>
            <Text style={styles.headerSubtitle}>{t('aiPoweredInsights')}</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} disabled={isLoading}>
            <Ionicons 
              name="refresh" 
              size={24} 
              color="#FFFFFF" 
              style={[isLoading && { opacity: 0.5 }]} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        
        {/* City Search */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>{t('selectLocation')}</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={language === 'hi' ? 'शहर का नाम लिखें (जैसे: मुंबई, चेन्नई)' : 'Enter city name (e.g., Mumbai, Chennai)'}
              value={customCity}
              onChangeText={setCustomCity}
              onSubmitEditing={handleCitySearch}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleCitySearch}>
              <Ionicons name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Cities */}
        <View style={styles.citiesCard}>
          <Text style={styles.citiesTitle}>{t('popularRegions')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.citiesScroll}>
            {popularCities.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.cityButton,
                  selectedCity === city && styles.selectedCityButton
                ]}
                onPress={() => setSelectedCity(city)}
              >
                <Text style={[
                  styles.cityButtonText,
                  selectedCity === city && styles.selectedCityButtonText
                ]}>
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Current Location Info */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={20} color="#4CAF50" />
            <Text style={styles.locationText}>
              {language === 'hi' ? `${selectedCity} के लिए सुझाव` : `Recommendations for ${selectedCity}`}
            </Text>
          </View>
          <Text style={styles.locationSubtext}>
            {language === 'hi' ? 
              'वर्तमान मौसम, मिट्टी की स्थिति और बाजार के रुझान के आधार पर' :
              'Based on current weather, soil conditions, and market trends'
            }
          </Text>
        </View>

        {/* Mandi Price Prediction Section - ML Model Integration */}
        <View style={styles.mandiPredictionCard}>
          <View style={styles.mandiHeader}>
            <Ionicons name="analytics" size={24} color="#2196F3" />
            <Text style={styles.mandiTitle}>{t('mandiPricePrediction')}</Text>
          </View>
          
          {mandiPredictions.length > 0 && (
            <View>
              {/* Crop Selector for Predictions */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropSelector}>
                {mandiPredictions.map((prediction) => (
                  <TouchableOpacity
                    key={prediction.crop_name}
                    style={[
                      styles.cropSelectorButton,
                      selectedMandiCrop === prediction.crop_name && styles.selectedCropSelectorButton
                    ]}
                    onPress={() => {
                      setSelectedMandiCrop(prediction.crop_name);
                      generateSeasonalTrends(prediction.crop_name);
                    }}
                  >
                    <Text style={[
                      styles.cropSelectorText,
                      selectedMandiCrop === prediction.crop_name && styles.selectedCropSelectorText
                    ]}>
                      {prediction.crop_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Selected Crop Prediction */}
              {mandiPredictions.find(p => p.crop_name === selectedMandiCrop) && (() => {
                const prediction = mandiPredictions.find(p => p.crop_name === selectedMandiCrop)!;
                return (
                  <View style={styles.predictionContent}>
                    <View style={styles.priceComparison}>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>
                          {language === 'hi' ? 'वर्तमान मूल्य' : 'Current Price'}
                        </Text>
                        <Text style={styles.currentPrice}>₹{prediction.current_price}/kg</Text>
                      </View>
                      
                      <Ionicons name="arrow-forward" size={24} color="#666666" />
                      
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>
                          {language === 'hi' ? 'भविष्य का मूल्य' : 'Predicted Price'}
                        </Text>
                        <Text style={[
                          styles.predictedPrice,
                          { color: getTrendColor(prediction.trend) }
                        ]}>
                          ₹{prediction.predicted_price}/kg
                        </Text>
                      </View>
                    </View>

                    <View style={styles.trendIndicator}>
                      <Ionicons 
                        name={getTrendIcon(prediction.trend)} 
                        size={20} 
                        color={getTrendColor(prediction.trend)} 
                      />
                      <Text style={[styles.trendText, { color: getTrendColor(prediction.trend) }]}>
                        {prediction.price_change_percent > 0 ? '+' : ''}{prediction.price_change_percent}%
                      </Text>
                      <Text style={styles.confidenceText}>
                        {language === 'hi' ? 'विश्वसनीयता' : 'Confidence'}: {prediction.confidence}%
                      </Text>
                    </View>

                    <View style={styles.factorsSection}>
                      <Text style={styles.factorsTitle}>
                        {language === 'hi' ? 'प्रभावी कारक:' : 'Key Factors:'}
                      </Text>
                      {prediction.seasonal_factors.map((factor, index) => (
                        <Text key={index} style={styles.factorText}>• {factor}</Text>
                      ))}
                      <Text style={styles.weatherImpact}>
                        {language === 'hi' ? '🌤️ मौसम प्रभाव: ' : '🌤️ Weather Impact: '}{prediction.weather_impact}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Seasonal Trends Chart */}
              <View style={styles.seasonalTrendsSection}>
                <Text style={styles.trendsTitle}>{t('seasonalTrends')}</Text>
                <View style={styles.trendsChart}>
                  {seasonalTrends.map((trend, index) => (
                    <View key={index} style={styles.trendBar}>
                      <Text style={styles.monthLabel}>{trend.month}</Text>
                      <View style={styles.barContainer}>
                        <View 
                          style={[
                            styles.bar,
                            { 
                              height: Math.max((trend.predicted_price / 35) * 80, 20),
                              backgroundColor: `rgba(76, 175, 80, ${trend.confidence / 100})`
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.priceLabel}>₹{trend.predicted_price}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Crop Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>{t('recommendedCrops')}</Text>
            {recommendations.map((crop, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.cropCard,
                  selectedCrop?.crop_name === crop.crop_name && styles.selectedCropCard
                ]}
                onPress={() => setSelectedCrop(selectedCrop?.crop_name === crop.crop_name ? null : crop)}
              >
                <View style={styles.cropHeader}>
                  <View style={styles.cropLeft}>
                    <Ionicons 
                      name={cropIcons[crop.crop_name] || 'leaf'} 
                      size={24} 
                      color="#4CAF50" 
                    />
                    <View style={styles.cropInfo}>
                      <Text style={styles.cropName}>{crop.crop_name}</Text>
                      <View style={styles.confidenceContainer}>
                        <View style={[
                          styles.confidenceBadge,
                          { backgroundColor: getConfidenceColor(crop.confidence_score) }
                        ]}>
                          <Text style={styles.confidenceText}>
                            {Math.round(crop.confidence_score * 100)}% {t('confidence')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.cropRight}>
                    <Text style={styles.profitText}>₹{Math.round(crop.profit_estimate)}</Text>
                    <Text style={styles.profitLabel}>{language === 'hi' ? 'अपेक्षित लाभ' : 'Expected Profit'}</Text>
                    <Ionicons 
                      name={selectedCrop?.crop_name === crop.crop_name ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666666" 
                    />
                  </View>
                </View>

                <View style={styles.cropMetrics}>
                  <View style={styles.metric}>
                    <Ionicons name="trending-up" size={16} color="#2196F3" />
                    <Text style={styles.metricValue}>{crop.yield_forecast} kg/acre</Text>
                    <Text style={styles.metricLabel}>{t('yield')}</Text>
                  </View>
                  
                  <View style={styles.metric}>
                    <Ionicons name={getWaterRequirementIcon(crop.water_requirement)} size={16} color="#2196F3" />
                    <Text style={styles.metricValue}>{crop.water_requirement}</Text>
                    <Text style={styles.metricLabel}>
                      {language === 'hi' ? 'पानी की जरूरत' : 'Water Need'}
                    </Text>
                  </View>
                  
                  <View style={styles.metric}>
                    <View style={[styles.seasonBadge, { backgroundColor: getSeasonColor(crop.growing_season) }]}>
                      <Text style={styles.seasonText}>{crop.growing_season}</Text>
                    </View>
                  </View>
                </View>

                {/* Expanded Details */}
                {selectedCrop?.crop_name === crop.crop_name && (
                  <View style={styles.expandedDetails}>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>
                        {language === 'hi' ? 'यह फसल क्यों?' : 'Why this crop?'}
                      </Text>
                      {crop.reasons.map((reason, reasonIndex) => (
                        <View key={reasonIndex} style={styles.reasonItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={styles.reasonText}>{reason}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.additionalInfo}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                          {language === 'hi' ? 'मिट्टी की उपयुक्तता:' : 'Soil Suitability:'}
                        </Text>
                        <Text style={styles.infoValue}>{crop.soil_suitability}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                          {language === 'hi' ? 'बुवाई का मौसम:' : 'Growing Season:'}
                        </Text>
                        <Text style={styles.infoValue}>{crop.growing_season}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                          {language === 'hi' ? 'पानी की आवश्यकता:' : 'Water Requirement:'}
                        </Text>
                        <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                          {crop.water_requirement}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Agricultural Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>
            {language === 'hi' ? '💡 कृषि सुझाव' : '💡 Farming Tips'}
          </Text>
          <View style={styles.tipsContent}>
            <View style={styles.tipItem}>
              <Ionicons name="water" size={20} color="#2196F3" />
              <Text style={styles.tipText}>
                {t('checkSoilMoisture')}
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="leaf" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                {t('followCropRotation')}
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="trending-up" size={20} color="#FF9800" />
              <Text style={styles.tipText}>
                {t('checkMarketPrices')}
              </Text>
            </View>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {language === 'hi' ? 'फसल सुझाव विश्लेषण हो रहा है...' : 'Analyzing crop recommendations...'}
            </Text>
          </View>
        )}

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
  header: {
    backgroundColor: '#4CAF50',
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
  content: {
    flex: 1,
    padding: 16,
  },
  searchCard: {
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
  searchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  citiesCard: {
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
  citiesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  citiesScroll: {
    marginTop: 8,
  },
  cityButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCityButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  cityButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  selectedCityButtonText: {
    color: '#FFFFFF',
  },
  locationCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 8,
  },
  locationSubtext: {
    fontSize: 14,
    color: '#2E7D32',
    opacity: 0.8,
  },
  
  // Mandi Price Prediction Styles
  mandiPredictionCard: {
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
  mandiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  mandiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  cropSelector: {
    marginBottom: 16,
  },
  cropSelectorButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedCropSelectorButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  cropSelectorText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  selectedCropSelectorText: {
    color: '#FFFFFF',
  },
  predictionContent: {
    gap: 16,
  },
  priceComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  predictedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  trendText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666666',
  },
  factorsSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  factorText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  weatherImpact: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 8,
    fontStyle: 'italic',
  },
  seasonalTrendsSection: {
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  trendsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  trendsChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  trendBar: {
    alignItems: 'center',
    flex: 1,
  },
  monthLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 8,
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 2,
    minHeight: 10,
  },
  
  // Crop Recommendations Styles
  recommendationsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  cropCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  selectedCropCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cropInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cropRight: {
    alignItems: 'flex-end',
  },
  profitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  profitLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  cropMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  seasonBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seasonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  additionalInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 16,
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
    color: '#E65100',
    flex: 1,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
});