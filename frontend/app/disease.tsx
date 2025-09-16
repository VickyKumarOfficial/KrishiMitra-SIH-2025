import React, { useState, useEffect } from 'react';
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
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

interface DiseaseResult {
  disease_name: string;
  confidence: number;
  symptoms: string[];
  treatment: string[];
  severity: string;
  prevention_tips: string[];
}

export default function DiseaseScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState<DiseaseResult | null>(null);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('अनुमति आवश्यक', 'कृपया गैलरी एक्सेस की अनुमति दें।');
    }

    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      Alert.alert('अनुमति आवश्यक', 'कृपया कैमरा एक्सेस की अनुमति दें।');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        if (result.assets[0].base64) {
          await analyzeDiseaseFromImage(result.assets[0].base64);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('त्रुटि', 'गैलरी से फोटो लेने में समस्या हुई।');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        if (result.assets[0].base64) {
          await analyzeDiseaseFromImage(result.assets[0].base64);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('त्रुटि', 'फोटो लेने में समस्या हुई।');
    }
  };

  const analyzeDiseaseFromImage = async (base64Image: string) => {
    try {
      setIsAnalyzing(true);
      setDiseaseResult(null);

      const response = await axios.post(`${BACKEND_URL}/api/disease-detection`, {
        image_base64: base64Image,
        crop_type: 'General'
      });

      setDiseaseResult(response.data);
    } catch (error) {
      console.error('Disease analysis error:', error);
      Alert.alert('त्रुटि', 'फोटो का विश्लेषण नहीं हो सका। कृपया फिर से कोशिश करें।');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666666';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'उच्च जोखिम';
      case 'medium': return 'मध्यम जोखिम';
      case 'low': return 'कम जोखिम';
      default: return 'अज्ञात';
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'फोटो चुनें',
      'आप कैसे फोटो जोड़ना चाहते हैं?',
      [
        { text: 'कैमरा', onPress: takePhoto },
        { text: 'गैलरी', onPress: pickImageFromGallery },
        { text: 'रद्द करें', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>रोग पहचान</Text>
            <Text style={styles.headerSubtitle}>AI से फसल की जांच</Text>
          </View>
          <TouchableOpacity onPress={() => {setSelectedImage(null); setDiseaseResult(null);}}>
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📷 उपयोग कैसे करें</Text>
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionText}>
              1. संक्रमित पौधे की स्पष्ट तस्वीर लें{'\n'}
              2. अच्छी रोशनी में रोगग्रस्त हिस्से पर फोकस करें{'\n'}
              3. तुरंत AI से निदान और इलाज की जानकारी पाएं
            </Text>
          </View>
        </View>

        {/* Image Selection or Display */}
        {!selectedImage ? (
          <View style={styles.imageSelectionCard}>
            <Text style={styles.selectionTitle}>फसल की फोटो चुनें</Text>
            <View style={styles.selectionOptions}>
              <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
                <Ionicons name="camera" size={48} color="#FF6B35" />
                <Text style={styles.optionText}>फोटो लें</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionButton} onPress={pickImageFromGallery}>
                <Ionicons name="images" size={48} color="#FF6B35" />
                <Text style={styles.optionText}>गैलरी से चुनें</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imageDisplayCard}>
            <Text style={styles.imageTitle}>फसल की फोटो का विश्लेषण</Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.cropImage} />
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.analyzingText}>विश्लेषण हो रहा है...</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity style={styles.changeImageButton} onPress={showImageOptions}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.changeImageText}>फोटो बदलें</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Disease Analysis Results */}
        {diseaseResult && !isAnalyzing && (
          <View style={styles.resultsContainer}>
            
            {/* Disease Info */}
            <View style={styles.diseaseCard}>
              <View style={styles.diseaseHeader}>
                <Text style={styles.diseaseName}>{diseaseResult.disease_name}</Text>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(diseaseResult.severity) }
                ]}>
                  <Text style={styles.severityText}>{getSeverityText(diseaseResult.severity)}</Text>
                </View>
              </View>
              
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>विश्वसनीयता: {diseaseResult.confidence}%</Text>
                <View style={styles.confidenceBar}>
                  <View 
                    style={[
                      styles.confidenceFill,
                      { 
                        width: `${diseaseResult.confidence}%`,
                        backgroundColor: getSeverityColor(diseaseResult.severity)
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            {/* Symptoms */}
            {diseaseResult.symptoms.length > 0 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>🔍 लक्षण</Text>
                {diseaseResult.symptoms.map((symptom, index) => (
                  <View key={index} style={styles.detailItem}>
                    <Text style={styles.bulletText}>• {symptom}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Treatment */}
            {diseaseResult.treatment.length > 0 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>💊 इलाज</Text>
                {diseaseResult.treatment.map((treatment, index) => (
                  <View key={index} style={styles.treatmentItem}>
                    <Text style={styles.treatmentNumber}>{index + 1}.</Text>
                    <Text style={styles.treatmentText}>{treatment}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Prevention */}
            {diseaseResult.prevention_tips.length > 0 && (
              <View style={styles.preventionCard}>
                <Text style={styles.preventionTitle}>🛡️ बचाव के तरीके</Text>
                {diseaseResult.prevention_tips.map((tip, index) => (
                  <View key={index} style={styles.preventionItem}>
                    <Text style={styles.bulletText}>• {tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={showImageOptions}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>दूसरी फोटो</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 बेहतर परिणाम के लिए सुझाव</Text>
          <View style={styles.tipsContent}>
            <Text style={styles.tipText}>☀️ दिन की प्राकृतिक रोशनी में फोटो लें</Text>
            <Text style={styles.tipText}>📷 रोगग्रस्त हिस्से पर फोकस करें</Text>
            <Text style={styles.tipText}>🌱 स्वस्थ और रोगी दोनों हिस्से दिखाएं</Text>
            <Text style={styles.tipText}>⏰ जल्दी पहचान से बचाव आसान होता है</Text>
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
  header: {
    backgroundColor: '#FF6B35',
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
    color: '#FFE0D6',
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructionsCard: {
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
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  instructionsContent: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionNumber: {
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  imageSelectionCard: {
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
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  optionButton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginTop: 8,
    textAlign: 'center',
  },
  imageDisplayCard: {
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
  imageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cropImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
  },
  changeImageButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  diseaseCard: {
    backgroundColor: '#FFFFFF',
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
  diseaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  diseaseTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceContainer: {
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'right',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
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
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  detailContent: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    lineHeight: 20,
  },
  treatmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  treatmentNumber: {
    backgroundColor: '#FF6B35',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  treatmentNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  treatmentText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    lineHeight: 20,
  },
  preventionCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  preventionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  preventionContent: {
    gap: 8,
  },
  preventionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  preventionText: {
    fontSize: 14,
    color: '#2E7D32',
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FF6B35',
  },
  tipsCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
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
    color: '#E65100',
    flex: 1,
    lineHeight: 20,
  },
});