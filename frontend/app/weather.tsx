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

interface WeatherData {
  city: string;
  current: {
    temp: number;
    humidity: number;
    conditions: string;
    pressure?: number;
    windspeed?: number;
  };
  forecast: Array<{
    datetime: string;
    temp: number;
    tempmax: number;
    tempmin: number;
    conditions: string;
    icon: string;
    humidity?: number;
    precipprob?: number;
  }>;
}

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [customCity, setCustomCity] = useState('');

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  const popularCities = ['Delhi', 'Mumbai', 'Chennai', 'Bangalore', 'Pune', 'Hyderabad', 'Kolkata', 'Jaipur'];

  useEffect(() => {
    fetchWeatherData(selectedCity);
  }, [selectedCity]);

  const fetchWeatherData = async (city: string) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/weather/${city}`);
      setWeatherData(response.data);
    } catch (error) {
      console.error('Weather fetch error:', error);
      Alert.alert('Error', `Failed to fetch weather data for ${city}. Please try another city.`);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData(selectedCity);
  };

  const handleCitySearch = () => {
    if (customCity.trim()) {
      setSelectedCity(customCity.trim());
      setCustomCity('');
    }
  };

  const getWeatherIcon = (conditions: string) => {
    const condition = conditions.toLowerCase();
    if (condition.includes('rain')) return 'rainy';
    if (condition.includes('cloud')) return 'cloudy';
    if (condition.includes('clear') || condition.includes('sunny')) return 'sunny';
    if (condition.includes('storm')) return 'thunderstorm';
    if (condition.includes('snow')) return 'snow';
    return 'partly-sunny';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 35) return '#FF5722'; // Hot - Red
    if (temp > 25) return '#FF9800'; // Warm - Orange
    if (temp > 15) return '#4CAF50'; // Pleasant - Green
    return '#2196F3'; // Cool - Blue
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Weather Forecast</Text>
            <Text style={styles.headerSubtitle}>Agricultural Weather Insights</Text>
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
          <Text style={styles.searchTitle}>Search Weather</Text>
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
          <Text style={styles.citiesTitle}>Popular Cities</Text>
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

        {/* Current Weather */}
        {weatherData && (
          <View style={styles.currentWeatherCard}>
            <View style={styles.currentHeader}>
              <Ionicons name="location" size={20} color="#2196F3" />
              <Text style={styles.currentCity}>{weatherData.city}</Text>
            </View>
            
            <View style={styles.currentContent}>
              <View style={styles.temperatureSection}>
                <Ionicons 
                  name={getWeatherIcon(weatherData.current.conditions)} 
                  size={64} 
                  color={getTemperatureColor(weatherData.current.temp)} 
                />
                <Text style={[
                  styles.currentTemp,
                  { color: getTemperatureColor(weatherData.current.temp) }
                ]}>
                  {Math.round(weatherData.current.temp)}°C
                </Text>
              </View>
              
              <View style={styles.conditionsSection}>
                <Text style={styles.conditions}>{weatherData.current.conditions}</Text>
                <Text style={styles.humidity}>Humidity: {weatherData.current.humidity}%</Text>
                {weatherData.current.pressure && (
                  <Text style={styles.pressure}>Pressure: {weatherData.current.pressure} hPa</Text>
                )}
                {weatherData.current.windspeed && (
                  <Text style={styles.windspeed}>Wind: {weatherData.current.windspeed} km/h</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* 7-Day Forecast */}
        {weatherData && weatherData.forecast && (
          <View style={styles.forecastCard}>
            <Text style={styles.forecastTitle}>7-Day Forecast</Text>
            <View style={styles.forecastContent}>
              {weatherData.forecast.slice(0, 7).map((day, index) => (
                <View key={index} style={styles.forecastDay}>
                  <View style={styles.forecastLeft}>
                    <Text style={styles.forecastDate}>
                      {index === 0 ? 'Today' : 
                       index === 1 ? 'Tomorrow' : 
                       new Date(day.datetime).toLocaleDateString('en', { weekday: 'short' })}
                    </Text>
                    <Text style={styles.forecastConditions}>{day.conditions}</Text>
                  </View>
                  
                  <View style={styles.forecastCenter}>
                    <Ionicons 
                      name={getWeatherIcon(day.conditions)} 
                      size={24} 
                      color="#FF9800" 
                    />
                  </View>
                  
                  <View style={styles.forecastRight}>
                    <Text style={styles.forecastHighTemp}>{Math.round(day.tempmax)}°</Text>
                    <Text style={styles.forecastLowTemp}>{Math.round(day.tempmin)}°</Text>
                  </View>
                  
                  <View style={styles.forecastDetails}>
                    {day.humidity && (
                      <Text style={styles.forecastDetail}>💧 {day.humidity}%</Text>
                    )}
                    {day.precipprob && day.precipprob > 0 && (
                      <Text style={styles.forecastDetail}>🌧️ {day.precipprob}%</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Agricultural Insights */}
        {weatherData && (
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>Agricultural Insights</Text>
            <View style={styles.insightsContent}>
              <View style={styles.insightItem}>
                <Ionicons name="water" size={20} color="#2196F3" />
                <Text style={styles.insightText}>
                  {weatherData.current.humidity > 70 ? 
                    'High humidity - Monitor for fungal diseases' :
                    weatherData.current.humidity < 40 ?
                    'Low humidity - Increase irrigation' :
                    'Good humidity levels for crops'
                  }
                </Text>
              </View>
              
              <View style={styles.insightItem}>
                <Ionicons name="thermometer" size={20} color="#FF9800" />
                <Text style={styles.insightText}>
                  {weatherData.current.temp > 35 ? 
                    'Very hot - Provide shade for sensitive crops' :
                    weatherData.current.temp < 10 ?
                    'Cold weather - Protect crops from frost' :
                    'Temperature suitable for most crops'
                  }
                </Text>
              </View>
              
              <View style={styles.insightItem}>
                <Ionicons name="leaf" size={20} color="#4CAF50" />
                <Text style={styles.insightText}>
                  {weatherData.forecast[0]?.precipprob > 70 ?
                    'Heavy rain expected - Prepare drainage' :
                    weatherData.forecast[0]?.precipprob > 30 ?
                    'Light rain possible - Good for irrigation' :
                    'No rain expected - Plan watering schedule'
                  }
                </Text>
              </View>
            </View>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading weather data...</Text>
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
    backgroundColor: '#2196F3',
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
    color: '#E3F2FD',
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
    backgroundColor: '#2196F3',
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
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  cityButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  selectedCityButtonText: {
    color: '#FFFFFF',
  },
  currentWeatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
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
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentCity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
  },
  currentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  temperatureSection: {
    alignItems: 'center',
  },
  currentTemp: {
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 8,
  },
  conditionsSection: {
    flex: 1,
    marginLeft: 20,
  },
  conditions: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
    marginBottom: 4,
  },
  humidity: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  pressure: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  windspeed: {
    fontSize: 14,
    color: '#666666',
  },
  forecastCard: {
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
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  forecastContent: {
    gap: 12,
  },
  forecastDay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  forecastLeft: {
    flex: 2,
  },
  forecastDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  forecastConditions: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  forecastCenter: {
    flex: 1,
    alignItems: 'center',
  },
  forecastRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  forecastHighTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  forecastLowTemp: {
    fontSize: 14,
    color: '#666666',
  },
  forecastDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  forecastDetail: {
    fontSize: 12,
    color: '#666666',
  },
  insightsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
  },
  insightsContent: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#2E7D32',
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