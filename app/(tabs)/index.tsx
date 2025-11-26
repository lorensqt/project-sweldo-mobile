import { calculatePayslip, getPayslips, Payslip, PayslipCalculation, savePayslip } from '@/services/payslipService';
import { getSalarySettings, SalarySettings } from '@/services/salaryService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [salarySettings, setSalarySettings] = useState<SalarySettings | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
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

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'15th' | '30th'>('15th');
  const [preview, setPreview] = useState<PayslipCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const settings = await getSalarySettings();
    setSalarySettings(settings);
    const slips = await getPayslips();
    setPayslips(slips);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleGeneratePreview = async () => {
    setIsCalculating(true);
    const today = new Date();
    const result = await calculatePayslip(today, selectedPeriod);
    setPreview(result);
    setIsCalculating(false);
  };

  const handleConfirmSave = async () => {
    if (!preview) return;
    const success = await savePayslip(preview);
    if (success) {
      setModalVisible(false);
      setPreview(null);
      fetchData();
      Alert.alert('Success', 'Payslip generated and saved!');
    } else {
      Alert.alert('Error', 'Failed to save payslip.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
  };

  if (isLoading) {
    return (
      <LinearGradient colors={['#f5f5f5', '#e0e0e0']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8a3c18" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </LinearGradient>
    );
  }

  const renderPayslipItem = ({ item }: { item: Payslip }) => (
      <TouchableOpacity 
        style={styles.payslipCard}
        onPress={() => router.push(`/payslip/${item.id}`)}
      >
          <View style={styles.payslipHeader}>
              <Text style={styles.payslipDate}>{formatDate(item.date_processed)}</Text>
              <Text style={styles.payslipNet}>{formatCurrency(item.net_pay)}</Text>
          </View>
          <Text style={styles.payslipSub}>Period: {formatDate(item.pay_period_start)} - {formatDate(item.pay_period_end)}</Text>
      </TouchableOpacity>
  );

  const HeaderContent = () => (
    <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: 'rgba(255,255,255,0.8)' }]}>{getGreeting()},</Text>
            <Text style={[styles.title, { color: '#fff' }]}>Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => fetchData()} style={styles.iconBtn}>
                <Ionicons name="refresh-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    </View>
  );

  const ListHeader = () => (
    <View>
        {!salarySettings ? (
            <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No salary settings found.</Text>
                <TouchableOpacity 
                    style={styles.setupButton}
                    onPress={() => router.push('/settings')}
                >
                    <LinearGradient
                        colors={['#8a3c18', '#A04000']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.setupButtonText}>Set Up My Salary</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        ) : (
            <>
                <TouchableOpacity style={styles.cardContainer} activeOpacity={0.9}>
                    <LinearGradient
                        colors={['#2b2b2b', '#1a1a1a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.creditCard}
                    >
                        {/* Top Row */}
                        <View style={styles.cardTopRow}>
                            <Ionicons name="wallet" size={24} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.cardLabel}>SALARY DEBIT</Text>
                        </View>

                        {/* Middle - Amount */}
                        <View style={styles.cardMiddle}>
                            <Text style={styles.cardAmount}>
                                {formatCurrency(salarySettings.basic_salary)}
                            </Text>
                            <Text style={styles.cardAmountLabel}>Monthly Basic</Text>
                        </View>

                        {/* Bottom Row */}
                        <View style={styles.cardBottomRow}>
                            <View>
                                <Text style={styles.cardLabelSmall}>SCHEDULE</Text>
                                <Text style={styles.cardValueSmall}>{salarySettings.schedule.toUpperCase()}</Text>
                            </View>
                            <View>
                                <Text style={styles.cardLabelSmall}>STATUS</Text>
                                <Text style={styles.cardValueSmall}>ACTIVE</Text>
                            </View>
                        </View>
                        
                        {/* Decorative Circle */}
                        <View style={styles.decorativeCircle} />
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={() => {
                        setModalVisible(true);
                        setPreview(null);
                    }}
                >
                    <LinearGradient
                        colors={['#8a3c18', '#A04000']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Ionicons name="calculator-outline" size={24} color="#fff" style={{marginRight: 10}} />
                        <Text style={styles.generateButtonText}>Generate Payslip</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </>
        )}
        <Text style={styles.sectionTitle}>Recent Payslips</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.background} />
      
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
        <HeaderContent />
      </View>

      <FlatList
        data={payslips}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPayslipItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 20 }]} // Adjust top padding based on header height dynamically
        ListEmptyComponent={<Text style={styles.emptyListText}>No payslips generated yet.</Text>}
      />

      {/* Generate Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Generate Payslip</Text>
                
                <Text style={styles.label}>Select Period:</Text>
                <View style={styles.row}>
                    <TouchableOpacity 
                        style={[styles.periodBtn, selectedPeriod === '15th' && styles.periodBtnActive]}
                        onPress={() => { setSelectedPeriod('15th'); setPreview(null); }}
                    >
                        <Text style={[styles.periodBtnText, selectedPeriod === '15th' && styles.periodBtnTextActive]}>15th</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.periodBtn, selectedPeriod === '30th' && styles.periodBtnActive]}
                        onPress={() => { setSelectedPeriod('30th'); setPreview(null); }}
                    >
                        <Text style={[styles.periodBtnText, selectedPeriod === '30th' && styles.periodBtnTextActive]}>30th</Text>
                    </TouchableOpacity>
                </View>

                {!preview ? (
                     <TouchableOpacity 
                        style={styles.calcButton} 
                        onPress={handleGeneratePreview}
                        disabled={isCalculating}
                     >
                        {isCalculating ? <ActivityIndicator color="#fff" /> : <Text style={styles.calcButtonText}>Calculate Preview</Text>}
                     </TouchableOpacity>
                ) : (
                    <ScrollView style={styles.previewContainer}>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Gross Pay</Text>
                            <Text style={styles.previewValue}>{formatCurrency(preview.gross_pay)}</Text>
                        </View>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Total Deductions</Text>
                            <Text style={[styles.previewValue, { color: '#ff4444' }]}>-{formatCurrency(preview.total_deductions)}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.previewRow}>
                            <Text style={styles.previewNetLabel}>Net Pay</Text>
                            <Text style={styles.previewNetValue}>{formatCurrency(preview.net_pay)}</Text>
                        </View>
                        <Text style={styles.previewNote}>Includes {preview.deductions.length} deductions & {preview.other_incomes.length} other incomes.</Text>
                    </ScrollView>
                )}

                <View style={styles.modalActions}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    {preview && (
                        <TouchableOpacity onPress={handleConfirmSave} style={styles.confirmBtn}>
                            <Text style={styles.confirmBtnText}>Confirm & Save</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  
  // Fixed Header Styles
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // backgroundColor: '#f8f9fa', // Removed background color as it is now animated
    overflow: 'hidden', // Clip the animated background
    paddingHorizontal: 24,
    paddingBottom: 20, // Space below title/subtitle
    zIndex: 100, // Ensure it's above scrolling content
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  animatedBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '200%', // Make it wider for animation
    left: -50, // Initial offset
  },
  headerContent: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
  },
  headerLeft: {
      flex: 1,
  },
  headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
  },
  greeting: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#666', marginBottom: -2 },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#333' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#666' },
  
  iconBtn: {
      padding: 5,
  },
  avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f0e0da',
      justifyContent: 'center',
      alignItems: 'center',
  },

  // Content Below Header (FlatList)
  listContent: {
    // paddingTop handled dynamically
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'Poppins_400Regular', fontSize: 16, marginTop: 10, color: '#666' },
  
  // Empty State
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyStateText: { fontFamily: 'Poppins_400Regular', fontSize: 18, color: '#666', marginBottom: 20 },
  setupButton: { borderRadius: 25, overflow: 'hidden', elevation: 5 },
  setupButtonText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#fff' },
  
  // Credit Card Styles
  cardContainer: { marginBottom: 25, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  creditCard: { borderRadius: 16, padding: 20, height: 200, justifyContent: 'space-between', overflow: 'hidden', position: 'relative' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins_600SemiBold', fontSize: 12, letterSpacing: 1 },
  cardMiddle: { justifyContent: 'center', flex: 1 },
  cardAmount: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 32, letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3 },
  cardAmountLabel: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins_400Regular', fontSize: 12 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabelSmall: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins_600SemiBold', fontSize: 10, marginBottom: 2 },
  cardValueSmall: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14, letterSpacing: 0.5 },
  decorativeCircle: { position: 'absolute', bottom: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)' },

  // Generate Button
  generateButton: { borderRadius: 15, overflow: 'hidden', elevation: 5, marginBottom: 30 },
  gradientButton: { paddingVertical: 14, paddingHorizontal: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  generateButtonText: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#fff' },

  // List
  sectionTitle: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#333', marginBottom: 10, marginTop: 10 },
  // listContent: { paddingBottom: 100 }, // Moved to global listContent for dynamic paddingTop
  emptyListText: { fontFamily: 'Poppins_400Regular', color: '#999', fontStyle: 'italic' },
  payslipCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2 },
  payslipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  payslipDate: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#333' },
  payslipNet: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#2ecc71' },
  payslipSub: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#666' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 22, marginBottom: 20, textAlign: 'center' },
  label: { fontFamily: 'Poppins_600SemiBold', marginBottom: 10, color: '#333' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  periodBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#8a3c18', borderColor: '#8a3c18' },
  periodBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#666' },
  periodBtnTextActive: { color: '#fff' },
  calcButton: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  calcButtonText: { fontFamily: 'Poppins_600SemiBold', color: '#fff' },
  
  // Preview
  previewContainer: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, marginBottom: 20 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontFamily: 'Poppins_400Regular', color: '#666' },
  previewValue: { fontFamily: 'Poppins_600SemiBold', color: '#333' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 10 },
  previewNetLabel: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#333' },
  previewNetValue: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#2ecc71' },
  previewNote: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#999', marginTop: 10, textAlign: 'center' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 10, alignItems: 'center' },
  cancelBtn: { padding: 10 },
  cancelBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#666' },
  confirmBtn: { backgroundColor: '#8a3c18', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  confirmBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});