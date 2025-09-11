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
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to use this feature.');
    }

    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to use this feature.');
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
      Alert.alert('Error', 'Failed to pick image from gallery.');
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
      Alert.alert('Error', 'Failed to take photo.');
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
      Alert.alert('Error', 'Failed to analyze the image. Please try again.');
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

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'warning';
      case 'medium': return 'alert-circle';
      case 'low': return 'checkmark-circle';
      default: return 'information-circle';
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' }
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
            <Text style={styles.headerTitle}>Disease Detection</Text>
            <Text style={styles.headerSubtitle}>AI-Powered Crop Health Analysis</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedImage(null)}>
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Instructions Card */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📷 How to Use</Text>
          <View style={styles.instructionsContent}>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1</Text>
              <Text style={styles.instructionText}>Take a clear photo of the affected plant</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2</Text>
              <Text style={styles.instructionText}>Ensure good lighting and focus on diseased areas</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3</Text>
              <Text style={styles.instructionText}>Get instant AI-powered diagnosis and treatment</Text>
            </View>
          </View>
        </View>

        {/* Image Selection */}
        {!selectedImage ? (
          <View style={styles.imageSelectionCard}>
            <Text style={styles.selectionTitle}>Select Crop Image</Text>
            <View style={styles.selectionOptions}>
              <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
                <Ionicons name="camera" size={48} color="#FF6B35" />
                <Text style={styles.optionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionButton} onPress={pickImageFromGallery}>
                <Ionicons name="images" size={48} color="#FF6B35" />
                <Text style={styles.optionText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Selected Image Display */
          <View style={styles.imageDisplayCard}>
            <Text style={styles.imageTitle}>Analyzing Crop Image</Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.cropImage} />
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.analyzingText}>Analyzing...</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity style={styles.changeImageButton} onPress={showImageOptions}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.changeImageText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Disease Analysis Results */}
        {diseaseResult && !isAnalyzing && (
          <View style={styles.resultsContainer}>
            
            {/* Disease Info Card */}
            <View style={styles.diseaseCard}>
              <View style={styles.diseaseHeader}>
                <View style={styles.diseaseTitle}>
                  <Ionicons 
                    name={getSeverityIcon(diseaseResult.severity)} 
                    size={24} 
                    color={getSeverityColor(diseaseResult.severity)} 
                  />
                  <Text style={styles.diseaseName}>{diseaseResult.disease_name}</Text>
                </View>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(diseaseResult.severity) }
                ]}>
                  <Text style={styles.severityText}>{diseaseResult.severity} Risk</Text>
                </View>
              </View>
              
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Confidence Level</Text>
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
                <Text style={styles.confidenceValue}>{diseaseResult.confidence}%</Text>
              </View>
            </View>

            {/* Symptoms Card */}
            {diseaseResult.symptoms.length > 0 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>🔍 Symptoms Identified</Text>
                <View style={styles.detailContent}>
                  {diseaseResult.symptoms.map((symptom, index) => (
                    <View key={index} style={styles.detailItem}>
                      <Ionicons name="chevron-forward" size={16} color="#FF6B35" />
                      <Text style={styles.detailText}>{symptom}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Treatment Card */}
            {diseaseResult.treatment.length > 0 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailTitle}>💊 Recommended Treatment</Text>
                <View style={styles.detailContent}>
                  {diseaseResult.treatment.map((treatment, index) => (
                    <View key={index} style={styles.treatmentItem}>
                      <View style={styles.treatmentNumber}>
                        <Text style={styles.treatmentNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.treatmentText}>{treatment}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Prevention Tips Card */}
            {diseaseResult.prevention_tips.length > 0 && (
              <View style={styles.preventionCard}>
                <Text style={styles.preventionTitle}>🛡️ Prevention Tips</Text>
                <View style={styles.preventionContent}>
                  {diseaseResult.prevention_tips.map((tip, index) => (
                    <View key={index} style={styles.preventionItem}>
                      <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                      <Text style={styles.preventionText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={showImageOptions}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Scan Another</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]} 
                onPress={() => Alert.alert('Feature Coming Soon', 'Expert consultation feature will be available soon!')}
              >
                <Ionicons name="person" size={20} color="#FF6B35" />
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Consult Expert</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Quick Tips for Better Results</Text>
          <View style={styles.tipsContent}>
            <View style={styles.tipItem}>
              <Ionicons name="sunny" size={20} color="#FF9800" />
              <Text style={styles.tipText}>Take photos in natural daylight for best results</Text>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="camera" size={20} color="#FF9800" />
              <Text style={styles.tipText}>Focus on the affected areas of the plant</Text>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="leaf" size={20} color="#FF9800" />
              <Text style={styles.tipText}>Include both healthy and diseased parts for comparison</Text>
            </View>
            
            <View style={styles.tipItem}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.tipText}>Early detection helps prevent spread to other plants</Text>
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