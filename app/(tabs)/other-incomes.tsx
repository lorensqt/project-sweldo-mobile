import { addOtherIncome, deleteOtherIncome, getOtherIncomes, OtherIncome, updateOtherIncome } from '@/services/otherIncomeService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function OtherIncomesScreen() {
  const [otherIncomes, setOtherIncomes] = useState<OtherIncome[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [amountType, setAmountType] = useState<'fixed' | 'percent'>('fixed');
  const [scheduleLinked, setScheduleLinked] = useState('both'); // 15th, 30th, both, none

  const fetchOtherIncomes = async () => {
    const data = await getOtherIncomes();
    setOtherIncomes(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchOtherIncomes();
    }, [])
  );

  const handleSave = async () => {
    if (!name || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      Alert.alert('Error', 'Invalid amount');
      return;
    }

    let success = false;
    if (editingId) {
        success = await updateOtherIncome(editingId, name, amountType, amountNum, scheduleLinked);
    } else {
        success = await addOtherIncome(name, amountType, amountNum, scheduleLinked);
    }

    if (success) {
      setModalVisible(false);
      resetForm();
      fetchOtherIncomes();
    } else {
      Alert.alert('Error', `Failed to ${editingId ? 'update' : 'add'} other income`);
    }
  };

  const handleEdit = (item: OtherIncome) => {
    setEditingId(item.id);
    setName(item.name);
    setAmount(item.amount.toString());
    setAmountType(item.amount_type);
    setScheduleLinked(item.schedule_linked);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Income', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          await deleteOtherIncome(id);
          fetchOtherIncomes();
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAmount('');
    setAmountType('fixed');
    setScheduleLinked('both');
  };

  const openAddModal = () => {
      resetForm();
      setModalVisible(true);
  }

  const renderItem = ({ item }: { item: OtherIncome }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleEdit(item)}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>
          {item.schedule_linked === 'both' ? 'Every Payday' :
           item.schedule_linked === '15th' ? '15th Only' :
           item.schedule_linked === '30th' ? '30th Only' : 'Not Scheduled'}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardAmount}>
          {item.amount_type === 'fixed' ? '₱' : ''}{item.amount}{item.amount_type === 'percent' ? '%' : ''}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
        <View style={styles.headerContent}>
            <Text style={[styles.title, { color: '#fff' }]}>Other Incomes</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={otherIncomes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 10 }]} // Adjust top padding based on header height dynamically
        ListEmptyComponent={
          <Text style={styles.emptyText}>No other incomes added yet.</Text>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Other Income' : 'New Other Income'}</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Income Name (e.g. Allowance, Bonus)" 
              value={name} 
              onChangeText={setName} 
              maxLength={25}
            />

            <View style={styles.row}>
               <TouchableOpacity 
                 style={[styles.typeBtn, amountType === 'fixed' && styles.typeBtnActive]}
                 onPress={() => setAmountType('fixed')}
               >
                 <Text style={[styles.typeBtnText, amountType === 'fixed' && styles.typeBtnTextActive]}>Fixed (₱)</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.typeBtn, amountType === 'percent' && styles.typeBtnActive]}
                 onPress={() => setAmountType('percent')}
               >
                 <Text style={[styles.typeBtnText, amountType === 'percent' && styles.typeBtnTextActive]}>Percent (%)</Text>
               </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Amount" 
              value={amount} 
              onChangeText={setAmount} 
              keyboardType="numeric" 
              maxLength={7}
            />

            <Text style={styles.label}>Schedule:</Text>
            <View style={styles.row}>
               {['15th', '30th', 'both', 'none'].map((opt) => (
                 <TouchableOpacity 
                    key={opt}
                    style={[styles.schedBtn, scheduleLinked === opt && styles.schedBtnActive]}
                    onPress={() => setScheduleLinked(opt)}
                 >
                    <Text style={[styles.schedBtnText, scheduleLinked === opt && styles.schedBtnTextActive]}>
                        {opt === 'both' ? 'Both' : (opt === 'none' ? 'Not Scheduled' : opt)}
                    </Text>
                 </TouchableOpacity>
               ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
    // backgroundColor: '#f5f5f5', // Removed background color as it is now animated
    overflow: 'hidden', // Clip the animated background
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 100,
    elevation: 4,
    shadowColor: '#000',
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
    alignItems: 'flex-end', // Align title to bottom-left
  },
  title: { fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#333' },
  addBtn: { 
    backgroundColor: '#8a3c18', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 5
  },

  // Content Below Header (FlatList)
  listContent: {
    // paddingTop handled dynamically
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 2 
  },
  cardContent: { flex: 1 },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#333' },
  cardSubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#666' },
  cardRight: { alignItems: 'flex-end', gap: 5 },
  cardAmount: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#8a3c18' },
  deleteBtn: { padding: 5 },
  emptyText: { textAlign: 'center', fontFamily: 'Poppins_400Regular', color: '#999', marginTop: 50 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, marginBottom: 20, textAlign: 'center' },
  input: { 
    backgroundColor: '#f5f5f5', 
    borderRadius: 10, 
    padding: 15, 
    fontFamily: 'Poppins_400Regular', 
    marginBottom: 15 
  },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  label: { fontFamily: 'Poppins_600SemiBold', marginBottom: 5, color: '#333' },
  typeBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#8a3c18', borderColor: '#8a3c18' },
  typeBtnText: { fontFamily: 'Poppins_400Regular', color: '#333' },
  typeBtnTextActive: { color: '#fff' },
  schedBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  schedBtnActive: { backgroundColor: '#8a3c18', borderColor: '#8a3c18' },
  schedBtnText: { fontFamily: 'Poppins_400Regular', color: '#333' },
  schedBtnTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10 },
  cancelBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#666' },
  saveBtn: { backgroundColor: '#8a3c18', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});