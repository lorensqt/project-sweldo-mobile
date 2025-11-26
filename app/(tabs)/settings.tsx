import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSalarySettings, saveSalarySettings } from '@/services/salaryService';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const [basicSalary, setBasicSalary] = useState('');
  const [schedule, setSchedule] = useState('15/30'); // Default
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);

  // Animation Shared Value
  const translateX = useSharedValue(-width * 0.2);

  useEffect(() => {
    translateX.value = withRepeat(
        withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getSalarySettings();
    if (settings) {
      setBasicSalary(settings.basic_salary.toString());
      setSchedule(settings.schedule);
    }
  };

  const handleSave = async () => {
    if (!basicSalary) {
      Alert.alert('Error', 'Please enter your basic salary.');
      return;
    }

    const salaryNum = parseFloat(basicSalary);
    if (isNaN(salaryNum) || salaryNum < 0) {
      Alert.alert('Error', 'Please enter a valid salary amount.');
      return;
    }

    setIsLoading(true);
    const success = await saveSalarySettings(salaryNum, schedule);
    setIsLoading(false);

    if (success) {
      Alert.alert('Success', 'Salary settings saved successfully!');
      Keyboard.dismiss();
    } else {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const ScheduleCard = ({ value, label, icon }: { value: string, label: string, icon: string }) => {
    const isSelected = schedule === value;
    return (
      <TouchableOpacity 
        style={[styles.scheduleCard, isSelected && styles.scheduleCardSelected]} 
        onPress={() => setSchedule(value)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
            <Ionicons name={icon as any} size={24} color={isSelected ? '#fff' : '#666'} />
        </View>
        <Text style={[styles.scheduleLabel, isSelected && styles.scheduleLabelSelected]}>{label}</Text>
        {isSelected && (
            <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <LinearGradient
            colors={['#f8f9fa', '#e9ecef']} // Slightly cooler/lighter gray
            style={styles.background}
        />
        
        {/* Fixed Header */}
        <View 
          style={[styles.fixedHeader, { paddingTop: insets.top }]} 
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
            <Animated.View style={[styles.animatedBackground, animatedStyle]}>
                <LinearGradient
                    colors={['#2b2b2b', '#8a3c18', '#2b2b2b']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
            <View style={styles.headerContent}>
                <View>
                    <Text style={[styles.title, { color: '#fff' }]}>Settings</Text>
                    <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>Manage your salary profile</Text>
                </View>
            </View>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 20 }]} showsVerticalScrollIndicator={false}>
          
          {/* Salary Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Monthly Basic Pay</Text>
            <View style={styles.salaryInputWrapper}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                    style={styles.salaryInput}
                    value={basicSalary}
                    onChangeText={setBasicSalary}
                    placeholder="0.00"
                    keyboardType="numeric"
                    placeholderTextColor="#ccc"
                    maxLength={6}
                />
            </View>
            <Text style={styles.helperText}>Enter your gross monthly income before deductions.</Text>
          </View>

          {/* Schedule Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Payout Schedule</Text>
            <View style={styles.scheduleGrid}>
                <ScheduleCard 
                    value="15/30" 
                    label="Bi-Monthly (15th & 30th)" 
                    icon="calendar" 
                />
                <ScheduleCard 
                    value="monthly-30" 
                    label="Monthly (Every 30th)" 
                    icon="calendar-number" 
                />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={styles.saveButtonContainer} 
            onPress={handleSave} 
            disabled={isLoading}
          >
             <LinearGradient
                colors={['#2b2b2b', '#8a3c18']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
             >
                {isLoading ? (
                    <Text style={styles.saveButtonText}>Saving...</Text>
                ) : (
                    <>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{marginLeft: 8}} />
                    </>
                )}
             </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  
  // Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // backgroundColor: '#f8f9fa', // Removed background color as it is now animated
    overflow: 'hidden', // Clip the animated background
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  animatedBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '200%', // Make it wider for animation
    left: -50, // Initial offset
  },
  headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end', // Align title to bottom-left
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#333' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#666', marginTop: -5 },
  avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f0e0da',
      justifyContent: 'center',
      alignItems: 'center',
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, 
  },

  sectionContainer: {
      marginBottom: 30,
  },
  sectionTitle: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: '#333',
      marginBottom: 15,
  },

  // Salary Input
  salaryInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 20,
      paddingHorizontal: 20,
      height: 80,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: '#eee',
  },
  currencySymbol: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 32,
      color: '#8a3c18',
      marginRight: 10,
  },
  salaryInput: {
      flex: 1,
      fontFamily: 'Poppins_700Bold',
      fontSize: 32,
      color: '#333',
      height: '100%',
  },
  helperText: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 12,
      color: '#999',
      marginTop: 8,
      marginLeft: 5,
  },

  // Schedule Grid
  scheduleGrid: {
      flexDirection: 'row',
      gap: 15,
  },
  scheduleCard: {
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 15,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      position: 'relative',
      height: 120,
  },
  scheduleCardSelected: {
      borderColor: '#8a3c18',
      backgroundColor: '#fffbf9',
  },
  iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#f5f5f5',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
  },
  iconContainerSelected: {
      backgroundColor: '#8a3c18',
  },
  scheduleLabel: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
  },
  scheduleLabelSelected: {
      color: '#8a3c18',
  },
  checkBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#8a3c18',
      justifyContent: 'center',
      alignItems: 'center',
  },

  // Save Button
  saveButtonContainer: {
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 5,
      shadowColor: '#8a3c18',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
  },
  saveButton: {
      paddingVertical: 18,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
  },
  saveButtonText: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 16,
      color: '#fff',
  },
});