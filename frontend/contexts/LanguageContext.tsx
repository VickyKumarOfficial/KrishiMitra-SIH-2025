import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header
    appName: 'KrishiMitra',
    appSubtitle: 'Your Crop Recommendation',
    
    // Navigation
    dashboard: 'Dashboard',
    weather: 'Weather',
    crops: 'Crops',
    diseaseDetection: 'Disease Scan',
    aiChat: 'AI Chat',
    profile: 'Profile',
    
    // Dashboard
    weatherAlerts: 'Weather Alerts',
    todaysWeather: 'Today\'s Weather',
    suggestedCrops: 'Suggested Crops',
    mandiRates: 'Mandi Rates',
    quickServices: 'Quick Services',
    farmingTip: 'Today\'s Farming Tip',
    
    // Weather
    weatherForecast: 'Weather Forecast',
    agriculturalInsights: 'Agricultural Weather Insights',
    searchWeather: 'Search Weather',
    popularCities: 'Popular Cities',
    currentWeather: 'Current Weather',
    sevenDayForecast: '7-Day Forecast',
    humidity: 'Humidity',
    wind: 'Wind',
    
    // Crops
    cropRecommendations: 'Crop Recommendations',
    aiPoweredInsights: 'AI-Powered Farming Insights',
    selectLocation: 'Select Location',
    popularRegions: 'Popular Regions',
    recommendedCrops: 'Recommended Crops',
    mandiPricePrediction: 'Mandi Price Prediction',
    seasonalTrends: 'Seasonal Trends',
    
    // Disease Detection
    diseaseDetection: 'Disease Detection',
    aiCropAnalysis: 'AI Crop Analysis',
    howToUse: 'How to Use',
    selectCropImage: 'Select Crop Image',
    takePhoto: 'Take Photo',
    chooseFromGallery: 'Choose from Gallery',
    analyzing: 'Analyzing...',
    changeImage: 'Change Image',
    symptoms: 'Symptoms',
    treatment: 'Treatment',
    prevention: 'Prevention Tips',
    
    // Chat
    agriculturalAdvisor: 'Agricultural Advisor',
    quickQuestions: 'Quick Questions',
    suggestions: 'Suggestions',
    
    // Profile
    myProfile: 'My Profile',
    farmerInformation: 'Farmer Information',
    personalInfo: 'Personal Information',
    farmInfo: 'Farm Information',
    settings: 'Settings',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    refresh: 'Refresh',
    search: 'Search',
    confidence: 'Confidence',
    profit: 'Profit',
    yield: 'Yield',
    season: 'Season',
    rising: 'Rising',
    falling: 'Falling',
    stable: 'Stable',
    
    // Weather alerts
    weatherFavorable: 'Weather is favorable for farming',
    extremeHeat: 'Extreme heat warning - Provide shade to crops',
    coldWarning: 'Cold warning - Protect crops from frost',
    heavyRain: 'Heavy rain expected - Arrange drainage',
    strongWind: 'Strong wind warning - Support crops',
    
    // Tips
    checkSoilMoisture: 'Check soil moisture regularly for optimal crop growth',
    followCropRotation: 'Follow crop rotation to maintain soil health',
    checkMarketPrices: 'Check market prices before planting for maximum profit',
  },
  
  hi: {
    // Header
    appName: 'कृषिमित्र',
    appSubtitle: 'आपका फसल सुझावकर्ता',
    
    // Navigation
    dashboard: 'डैशबोर्ड',
    weather: 'मौसम',
    crops: 'फसल',
    diseaseDetection: 'रोग पहचान',
    aiChat: 'AI सलाह',
    profile: 'प्रोफाइल',
    
    // Dashboard
    weatherAlerts: 'मौसम अलर्ट',
    todaysWeather: 'आज का मौसम',
    suggestedCrops: 'सुझावित फसलें',
    mandiRates: 'मंडी भाव',
    quickServices: 'त्वरित सेवाएं',
    farmingTip: 'आज का कृषि सुझाव',
    
    // Weather
    weatherForecast: 'मौसम पूर्वानुमान',
    agriculturalInsights: 'कृषि मौसम जानकारी',
    searchWeather: 'मौसम खोजें',
    popularCities: 'प्रमुख शहर',
    currentWeather: 'वर्तमान मौसम',
    sevenDayForecast: '7-दिन का पूर्वानुमान',
    humidity: 'नमी',
    wind: 'हवा',
    
    // Crops
    cropRecommendations: 'फसल सुझाव',
    aiPoweredInsights: 'AI आधारित कृषि सुझाव',
    selectLocation: 'स्थान चुनें',
    popularRegions: 'प्रमुख क्षेत्र',
    recommendedCrops: 'सुझावित फसलें',
    mandiPricePrediction: 'मंडी भाव पूर्वानुमान',
    seasonalTrends: 'मौसमी रुझान',
    
    // Disease Detection
    diseaseDetection: 'रोग पहचान',
    aiCropAnalysis: 'AI से फसल जांच',
    howToUse: 'उपयोग कैसे करें',
    selectCropImage: 'फसल की फोटो चुनें',
    takePhoto: 'फोटो लें',
    chooseFromGallery: 'गैलरी से चुनें',
    analyzing: 'विश्लेषण हो रहा है...',
    changeImage: 'फोटो बदलें',
    symptoms: 'लक्षण',
    treatment: 'इलाज',
    prevention: 'बचाव के तरीके',
    
    // Chat
    agriculturalAdvisor: 'कृषि सलाहकार',
    quickQuestions: 'त्वरित प्रश्न',
    suggestions: 'सुझाव',
    
    // Profile
    myProfile: 'मेरी प्रोफाइल',
    farmerInformation: 'किसान की जानकारी',
    personalInfo: 'व्यक्तिगत जानकारी',
    farmInfo: 'खेती की जानकारी',
    settings: 'सेटिंग्स',
    
    // Common
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफल',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    edit: 'संपादित करें',
    refresh: 'रीफ्रेश',
    search: 'खोजें',
    confidence: 'विश्वसनीयता',
    profit: 'लाभ',
    yield: 'उत्पादन',
    season: 'मौसम',
    rising: 'बढ़ रहा',
    falling: 'गिर रहा',
    stable: 'स्थिर',
    
    // Weather alerts
    weatherFavorable: 'मौसम अनुकूल है - खेती के लिए उपयुक्त समय',
    extremeHeat: 'अत्यधिक गर्मी की चेतावनी - फसलों को छाया प्रदान करें',
    coldWarning: 'ठंड की चेतावनी - फसलों को पाले से बचाएं',
    heavyRain: 'भारी बारिश की संभावना - जल निकासी की व्यवस्था करें',
    strongWind: 'तेज हवा की चेतावनी - फसलों को सहारा दें',
    
    // Tips
    checkSoilMoisture: 'मिट्टी की नमी को नियमित रूप से जांचें और आवश्यकतानुसार सिंचाई करें',
    followCropRotation: 'फसल चक्र अपनाकर मिट्टी की उर्वरता बनाए रखें',
    checkMarketPrices: 'बुवाई से पहले मार्केट रेट की जांच करें और लाभदायक फसल चुनें',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('hi');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('selectedLanguage', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};