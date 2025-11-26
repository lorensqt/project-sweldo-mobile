import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getPayslipById, deletePayslip, Payslip, CalculatedDeduction, CalculatedIncome } from '@/services/payslipService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PayslipDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (id) {
        fetchPayslip();
    }
  }, [id]);

  const fetchPayslip = async () => {
    setLoading(true);
    const data = await getPayslipById(Number(id));
    setPayslip(data);
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Payslip', 'Are you sure? This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: async () => {
                await deletePayslip(Number(id));
                router.back();
            }
        }
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8a3c18" />
      </View>
    );
  }

  if (!payslip) {
    return (
      <View style={styles.container}>
          <Text>Payslip not found.</Text>
      </View>
    );
  }

  const deductions: CalculatedDeduction[] = JSON.parse(payslip.deductions_snapshot);
  const incomes: CalculatedIncome[] = payslip.other_incomes_snapshot ? JSON.parse(payslip.other_incomes_snapshot) : [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f5f5f5', '#e0e0e0']} style={styles.background} />
      
      {/* Fixed Header */}
      <View 
        style={[styles.fixedHeader, { paddingTop: insets.top }]} 
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payslip Details</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={24} color="#ff4444" />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 10 }]} >
        <Text style={styles.dateProcessed}>Processed: {formatDate(payslip.date_processed)}</Text>
        <Text style={styles.period}>Period: {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}</Text>

        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Gross Pay</Text>
            <Text style={styles.mainValue}>{formatCurrency(payslip.gross_pay)}</Text>
            
            {incomes.length > 0 && (
                <View style={styles.breakdown}>
                    <Text style={styles.breakdownLabel}>Includes:</Text>
                    {incomes.map((inc, index) => (
                        <View key={index} style={styles.row}>
                            <Text style={styles.rowLabel}>{inc.name}</Text>
                            <Text style={styles.rowValue}>+{formatCurrency(inc.calculated_amount)}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>

        <View style={styles.card}>
            <Text style={[styles.sectionTitle, { color: '#ff4444' }]}>Total Deductions</Text>
            <Text style={[styles.mainValue, { color: '#ff4444' }]}>-{formatCurrency(payslip.total_deductions)}</Text>
            
            <View style={styles.breakdown}>
                {deductions.map((ded, index) => (
                    <View key={index} style={styles.row}>
                        <View>
                            <Text style={styles.rowLabel}>{ded.name}</Text>
                            {ded.savings_bucket_id ? (
                                <Text style={styles.savedTag}>Saved to Goal</Text>
                            ) : null}
                        </View>
                        <Text style={styles.rowValue}>-{formatCurrency(ded.calculated_amount)}</Text>
                    </View>
                ))}
            </View>
        </View>

        <View style={[styles.card, styles.netCard]}>
            <Text style={styles.netLabel}>NET PAY</Text>
            <Text style={styles.netValue}>{formatCurrency(payslip.net_pay)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Fixed Header Styles
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f5f5f5', 
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#333' },
  backBtn: { padding: 5 },
  deleteBtn: { padding: 5 },

  // Scrollable Content Below Header
  scrollContent: { padding: 20, paddingBottom: 50, paddingTop: 100 }, // Adjust paddingTop dynamically

  dateProcessed: { fontFamily: 'Poppins_400Regular', color: '#666', textAlign: 'center' },
  period: { fontFamily: 'Poppins_600SemiBold', color: '#333', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#666', marginBottom: 5 },
  mainValue: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#333', marginBottom: 15 },
  breakdown: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10, gap: 8 },
  breakdownLabel: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#999', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: 'Poppins_400Regular', color: '#333' },
  rowValue: { fontFamily: 'Poppins_600SemiBold', color: '#666' },
  savedTag: { fontSize: 10, color: '#8a3c18', fontFamily: 'Poppins_600SemiBold', backgroundColor: '#f0e0da', alignSelf: 'flex-start', paddingHorizontal: 6, borderRadius: 4, marginTop: 2 },
  
  netCard: { backgroundColor: '#2b2b2b', alignItems: 'center' },
  netLabel: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16, marginBottom: 5 },
  netValue: { color: '#2ecc71', fontFamily: 'Poppins_700Bold', fontSize: 36 },
});