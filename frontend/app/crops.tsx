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
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

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

export default function CropsScreen() {
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [customCity, setCustomCity] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<CropRecommendation | null>(null);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  const popularCities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Hyderabad'];

  useEffect(() => {
    fetchCropRecommendations(selectedCity);
  }, [selectedCity]);

  const fetchCropRecommendations = async (city: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/recommendations/${city}`);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Recommendations fetch error:', error);
      Alert.alert('Error', `Failed to fetch crop recommendations for ${city}.`);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCropRecommendations(selectedCity);
  };

  const handleCitySearch = () => {
    if (customCity.trim()) {
      setSelectedCity(customCity.trim());
      setCustomCity('');
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return '#4CAF50'; // High - Green
    if (score >= 0.6) return '#FF9800'; // Medium - Orange
    return '#F44336'; // Low - Red
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
            <Text style={styles.headerTitle}>Crop Recommendations</Text>
            <Text style={styles.headerSubtitle}>AI-Powered Farming Insights</Text>
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
          <Text style={styles.searchTitle}>Select Location</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter city name (e.g., Mumbai, Chennai)"
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
          <Text style={styles.citiesTitle}>Popular Regions</Text>
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
            <Text style={styles.locationText}>Recommendations for {selectedCity}</Text>
          </View>
          <Text style={styles.locationSubtext}>
            Based on current weather, soil conditions, and market trends
          </Text>
        </View>

        {/* Crop Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>Recommended Crops</Text>
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
                            {Math.round(crop.confidence_score * 100)}% Confidence
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.cropRight}>
                    <Text style={styles.profitText}>₹{Math.round(crop.profit_estimate)}</Text>
                    <Text style={styles.profitLabel}>Expected Profit</Text>
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
                    <Text style={styles.metricLabel}>Yield</Text>
                  </View>
                  
                  <View style={styles.metric}>
                    <Ionicons name={getWaterRequirementIcon(crop.water_requirement)} size={16} color="#2196F3" />
                    <Text style={styles.metricValue}>{crop.water_requirement}</Text>
                    <Text style={styles.metricLabel}>Water Need</Text>
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
                      <Text style={styles.detailTitle}>Why this crop?</Text>
                      {crop.reasons.map((reason, reasonIndex) => (
                        <View key={reasonIndex} style={styles.reasonItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={styles.reasonText}>{reason}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.additionalInfo}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Soil Suitability:</Text>
                        <Text style={styles.infoValue}>{crop.soil_suitability}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Growing Season:</Text>
                        <Text style={styles.infoValue}>{crop.growing_season}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Water Requirement:</Text>
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
          <Text style={styles.tipsTitle}>💡 Farming Tips</Text>
          <View style={styles.tipsContent}>
            <View style={styles.tipItem}>
              <Ionicons name="water" size={20} color="#2196F3" />
              <Text style={styles.tipText}>
                Monitor soil moisture regularly for optimal crop growth
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="leaf" size={20} color="#4CAF50" />
              <Text style={styles.tipText}>
                Follow crop rotation to maintain soil health and prevent diseases
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="trending-up" size={20} color="#FF9800" />
              <Text style={styles.tipText}>
                Check market prices before planting to maximize profits
              </Text>
            </View>
          </View>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Analyzing crop recommendations...</Text>
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