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
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  name: string;
  location: string;
  phone: string;
  farmSize: string;
  cropTypes: string;
  experience: string;
  soilType: string;
  waterSource: string;
  preferredLanguage: 'hi' | 'en';
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'राम कुमार',
    location: 'दिल्ली, भारत',
    phone: '+91 98765 43210',
    farmSize: '5',
    cropTypes: 'गेहूं, धान, मक्का',
    experience: '10',
    soilType: 'दोमट मिट्टी',
    waterSource: 'नलकूप',
    preferredLanguage: 'hi'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(profile);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
        setTempProfile(parsedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(tempProfile));
      setProfile(tempProfile);
      setIsEditing(false);
      Alert.alert('सफल', 'आपकी प्रोफाइल सफलतापूर्वक अपडेट हो गई है!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('त्रुटि', 'प्रोफाइल सेव करने में समस्या हुई है।');
    }
  };

  const cancelEdit = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const updateField = (field: keyof UserProfile, value: string) => {
    setTempProfile(prev => ({ ...prev, [field]: value }));
  };

  const soilTypes = [
    'दोमट मिट्टी',
    'बलुई मिट्टी',
    'चिकनी मिट्टी',
    'काली मिट्टी',
    'लाल मिट्टी',
    'पीली मिट्टी'
  ];

  const waterSources = [
    'नलकूप',
    'कुआं',
    'तालाब',
    'नहर',
    'वर्षा जल',
    'नदी'
  ];

  const renderField = (
    label: string,
    field: keyof UserProfile,
    placeholder: string,
    multiline = false,
    keyboardType: 'default' | 'numeric' | 'phone-pad' = 'default'
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={tempProfile[field]}
          onChangeText={(value) => updateField(field, value)}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          multiline={multiline}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.fieldValue}>{profile[field] || 'अभी तक नहीं भरा गया'}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>मेरी प्रोफाइल</Text>
            <Text style={styles.headerSubtitle}>किसान की जानकारी</Text>
          </View>
          
          <View style={styles.headerActions}>
            {isEditing ? (
              <>
                <TouchableOpacity style={styles.headerButton} onPress={cancelEdit}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={saveProfile}>
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.headerButton} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={64} color="#4CAF50" />
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileLocation}>{profile.location}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>व्यक्तिगत जानकारी</Text>
          
          {renderField('पूरा नाम', 'name', 'अपना पूरा नाम लिखें')}
          {renderField('स्थान', 'location', 'गांव, जिला, राज्य')}
          {renderField('मोबाइल नंबर', 'phone', '+91 XXXXX XXXXX', false, 'phone-pad')}
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>भाषा प्राथमिकता</Text>
            {isEditing ? (
              <TouchableOpacity 
                style={styles.languageSelector}
                onPress={() => setShowLanguageModal(true)}
              >
                <Text style={styles.languageSelectorText}>
                  {tempProfile.preferredLanguage === 'hi' ? 'हिंदी' : 'English'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666666" />
              </TouchableOpacity>
            ) : (
              <Text style={styles.fieldValue}>
                {profile.preferredLanguage === 'hi' ? 'हिंदी' : 'English'}
              </Text>
            )}
          </View>
        </View>

        {/* Farm Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>खेती की जानकारी</Text>
          
          {renderField('खेत का आकार (एकड़ में)', 'farmSize', 'जैसे: 5', false, 'numeric')}
          {renderField('मुख्य फसलें', 'cropTypes', 'जैसे: गेहूं, धान, मक्का', true)}
          {renderField('खेती का अनुभव (वर्षों में)', 'experience', 'जैसे: 10', false, 'numeric')}
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>मिट्टी का प्रकार</Text>
            {isEditing ? (
              <View style={styles.optionsContainer}>
                {soilTypes.map((soil, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      tempProfile.soilType === soil && styles.selectedOption
                    ]}
                    onPress={() => updateField('soilType', soil)}
                  >
                    <Text style={[
                      styles.optionText,
                      tempProfile.soilType === soil && styles.selectedOptionText
                    ]}>
                      {soil}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{profile.soilType}</Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>पानी का स्रोत</Text>
            {isEditing ? (
              <View style={styles.optionsContainer}>
                {waterSources.map((source, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      tempProfile.waterSource === source && styles.selectedOption
                    ]}
                    onPress={() => updateField('waterSource', source)}
                  >
                    <Text style={[
                      styles.optionText,
                      tempProfile.waterSource === source && styles.selectedOptionText
                    ]}>
                      {source}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.fieldValue}>{profile.waterSource}</Text>
            )}
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>सेटिंग्स</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={24} color="#4CAF50" />
            <Text style={styles.settingText}>मौसम अलर्ट</Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.settingText}>सहायता</Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="information-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.settingText}>ऐप के बारे में</Text>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* App Information */}
        <View style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>KrishiMitra v1.0</Text>
          <Text style={styles.appInfoText}>
            आपका विश्वसनीय कृषि सलाहकार - बेहतर खेती के लिए AI तकनीक का उपयोग
          </Text>
        </View>

      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>भाषा चुनें</Text>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                tempProfile.preferredLanguage === 'hi' && styles.selectedLanguageOption
              ]}
              onPress={() => {
                updateField('preferredLanguage', 'hi');
                setShowLanguageModal(false);
              }}
            >
              <Text style={styles.languageOptionText}>हिंदी</Text>
              {tempProfile.preferredLanguage === 'hi' && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                tempProfile.preferredLanguage === 'en' && styles.selectedLanguageOption
              ]}
              onPress={() => {
                updateField('preferredLanguage', 'en');
                setShowLanguageModal(false);
              }}
            >
              <Text style={styles.languageOptionText}>English</Text>
              {tempProfile.preferredLanguage === 'en' && (
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCloseText}>रद्द करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
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
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: '#666666',
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  fieldValue: {
    fontSize: 16,
    color: '#666666',
    paddingVertical: 4,
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  languageSelectorText: {
    fontSize: 16,
    color: '#333333',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 12,
    flex: 1,
  },
  appInfoCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  appInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  appInfoText: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedLanguageOption: {
    backgroundColor: '#E8F5E8',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666666',
  },
});