import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getSavingsBuckets, addSavingsBucket, updateSavingsBucket, deleteSavingsBucket, SavingsBucket } from '@/services/savingsService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SavingsScreen() {
  const [buckets, setBuckets] = useState<SavingsBucket[]>([]);
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
  const [targetAmount, setTargetAmount] = useState('');

  const fetchBuckets = async () => {
    const data = await getSavingsBuckets();
    setBuckets(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchBuckets();
    }, [])
  );

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const targetNum = targetAmount ? parseFloat(targetAmount) : null;
    if (targetAmount && (isNaN(targetNum!) || targetNum! < 0)) {
        Alert.alert('Error', 'Invalid target amount');
        return;
    }

    let success = false;
    if (editingId) {
        success = await updateSavingsBucket(editingId, name, targetNum);
    } else {
        success = await addSavingsBucket(name, targetNum);
    }

    if (success) {
      setModalVisible(false);
      resetForm();
      fetchBuckets();
    } else {
      Alert.alert('Error', `Failed to ${editingId ? 'update' : 'add'} savings goal`);
    }
  };

  const handleEdit = (item: SavingsBucket) => {
    setEditingId(item.id);
    setName(item.name);
    setTargetAmount(item.target_amount ? item.target_amount.toString() : '');
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Goal', 'Are you sure? This will delete the goal and its history.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          await deleteSavingsBucket(id);
          fetchBuckets();
        }
      }
    ]);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setTargetAmount('');
  };

  const openAddModal = () => {
      resetForm();
      setModalVisible(true);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const renderItem = ({ item }: { item: SavingsBucket }) => {
    const progress = item.target_amount && item.target_amount > 0 
        ? Math.min(item.current_balance / item.target_amount, 1) 
        : 0;
    
    return (
      <TouchableOpacity style={styles.card} onPress={() => handleEdit(item)}>
        <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
        </View>
        
        <View style={styles.balanceContainer}>
            <Text style={styles.currentBalance}>{formatCurrency(item.current_balance)}</Text>
            {item.target_amount ? (
                <Text style={styles.targetAmount}> / {formatCurrency(item.target_amount)}</Text>
            ) : null}
        </View>

        {item.target_amount ? (
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
        ) : null}
      </TouchableOpacity>
    );
  };

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
            <Text style={[styles.title, { color: '#fff' }]}>Savings Goals</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={buckets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight + 10 }]} // Adjust top padding based on header height dynamically
        ListEmptyComponent={
          <Text style={styles.emptyText}>No savings goals yet. Start saving!</Text>
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
            <Text style={styles.modalTitle}>{editingId ? 'Edit Goal' : 'New Goal'}</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Goal Name (e.g. Emergency Fund)" 
              value={name} 
              onChangeText={setName} 
              maxLength={25}
            />

            <TextInput 
              style={styles.input} 
              placeholder="Target Amount (Optional)" 
              value={targetAmount} 
              onChangeText={setTargetAmount} 
              keyboardType="numeric" 
              maxLength={7}
            />

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
    paddingHorizontal: 24,
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
    elevation: 2 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#333' },
  balanceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  currentBalance: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#8a3c18' },
  targetAmount: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#999' },
  progressContainer: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#8a3c18', borderRadius: 4 },
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
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10 },
  cancelBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#666' },
  saveBtn: { backgroundColor: '#8a3c18', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  saveBtnText: { fontFamily: 'Poppins_600SemiBold', color: '#fff' },
});