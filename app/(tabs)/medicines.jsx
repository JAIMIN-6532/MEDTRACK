import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet,ScrollView,ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import moment from 'moment';
import {logMedicine} from "../../utils/api";


export default function MedicinesList() {
  const [medicines, setMedicines] = useState([]);
  const [activeTab, setActiveTab] = useState('daily');
  const [userId, setUserId] = useState(null);
  const [dailyDoses, setDailyDoses] = useState([]);
  const [stockDetails, setStockDetails] = useState([]);
  const [weeklyConsumption, setWeeklyConsumption] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupNotificationHandler();
  }, []);

  useFocusEffect(React.useCallback(() =>{
    loadMedicines();
  },[]));

  const setupNotificationHandler = () => {
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      const actionId = response.actionIdentifier;
      const medicineId = response.notification.request.content.data.medicineId;
      const userData = await AsyncStorage.getItem('userData');
      const userId = JSON.parse(userData)?.id;
      console.log('actionId', actionId);
      if (actionId === 'TAKEN' || actionId === 'MISSED') {

        const logData= {
            userId,
            healthProductId: medicineId,
            isTaken: actionId === 'TAKEN',
            medicationScheduleIds: response.notification.request.content.data.scheduleId,
        }

        console.log('logData', logData);
        const logresponse = await logMedicine(logData);

        // Remove the notification
        await Notifications.dismissNotificationAsync(response.notification.request.identifier);
      }
    });
  };

  const loadMedicines = async () => {
    try {
      const storedMedicines = await AsyncStorage.getItem('medicines');
      if (storedMedicines) {
        setMedicines(JSON.parse(storedMedicines));
      }

      const userData = await AsyncStorage.getItem('userData');
        if (!userData) return;
        
        const { id: uid } = JSON.parse(userData);
        setUserId(uid);

        const [dailyRes, stockRes, weeklyRes, lowRes] = await Promise.all([
          axios.get(`http://192.168.1.7:8888/api/v1/logs/daily-dose/${uid}`),
          axios.get(`http://192.168.1.7:8888/api/v1/healthproduct/user/${uid}`),
          axios.get(`http://192.168.1.7:8888/api/v1/logs/${uid}/time/7`),
          axios.get(`http://192.168.1.7:8888/api/v1/healthproduct/user/lower/${uid}`)
        ]);

        setDailyDoses(dailyRes.data);
        setStockDetails(stockRes.data);
        setWeeklyConsumption(weeklyRes.data);
        setLowStock(lowRes?.data);
        // console.log('dailyRes', dailyRes.data);
        // console.log('stockRes', stockRes.data);
        // // console.log('weeklyRes', weeklyRes.data);
        // console.log('lowRes', lowRes?.data);


    } catch (error) {
      console.error('Error loading medicines:', error);
    } finally {
        setLoading(false);
      }
  };

  const renderCard = (title, items, renderContent, emptyMessage) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={40} color="#888" />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        items?.map(renderContent)
      )
      
      }
    </View>
  );

  const MedicineCard = ({ item, type }) => (
    <LinearGradient
      colors={['#ffffff', '#f8f9fa']}
      style={[styles.card, type === 'low' && styles.lowStockCard]}
    >
      <View style={styles.cardHeader}>
        <Ionicons 
          name="medical" 
          size={24} 
          color={type === 'low' ? '#ff6b6b' : '#4dabf7'} 
        />
        <Text style={styles.medicineName}>{item?.name || item?.healthProductName}</Text>
      </View>

      {type === 'stock' && (
        <View style={styles.cardRow}>
          <Ionicons name="pricetag" size={18} color="#495057" />
          <Text style={styles.cardText}>Stock: {item.quantity}</Text>
          <Ionicons name="calendar" size={18} color="#495057" style={styles.iconSpacing} />
          <Text style={[
            styles.cardText,
            moment(item.expiryDate).isBefore(moment()) && styles.expiredText
          ]}>
            Exp: {moment(item.expiryDate).format('DD MMM YYYY')}
          </Text>
        </View>
      )}

      {(type === 'daily' || type === 'weekly') && (
        <View style={styles.cardRow}>
          <View style={styles.statusPill}>
            <Ionicons name="checkmark-circle" size={16} color="#2f9e44" />
            <Text style={styles.pillText}>Taken: {item.isTakenCount}</Text>
          </View>
          <View style={[styles.statusPill, styles.missedPill]}>
            <Ionicons name="close-circle" size={16} color="#e03131" />
            <Text style={styles.pillText}>Missed: {item.misCount || item.MisCount || 0}</Text>
          </View>
        </View>
      )}

      {type === 'low' && (
        <View style={styles.cardRow}>
          <Ionicons name="warning" size={20} color="#e03131" />
          <Text style={styles.lowStockText}>Only {item?.quantity} left in stock</Text>
        </View>
      )}
    </LinearGradient>
  );


  const TabButton = ({ title, icon, tab }) => (
    <TouchableOpacity 
      onPress={() => setActiveTab(tab)}
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
    >
      <Ionicons 
        name={icon} 
        size={24} 
        color={activeTab === tab ? '#fff' : '#adb5bd'} 
      />
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4dabf7" />
        <Text style={styles.loadingText}>Loading Your Health Data...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient
        colors={['#4dabf7', '#3bc9db']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Medication Management</Text>
        <Ionicons name="medkit" size={40} color="#fff" />
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TabButton title="Daily" icon="today" tab="daily" />
        <TabButton title="Stock" icon="cube" tab="stock" />
        <TabButton title="Weekly" icon="calendar" tab="weekly" />
        <TabButton title="Low" icon="alert" tab="low" />
      </View>

      {activeTab === 'daily' && renderCard(
        "Today's Medications",
        dailyDoses,
        (item, index) => <MedicineCard key={index} item={item} type="daily" />,
        "No medications scheduled for today"
      )}

      {activeTab === 'stock' && renderCard(
        "Medicine Stock",
        stockDetails,
        (item, index) => <MedicineCard key={index} item={item} type="stock" />,
        "No stock information available"
      )}

      {activeTab === 'weekly' && renderCard(
        "Weekly Summary",
        weeklyConsumption,
        (item, index) => <MedicineCard key={index} item={item} type="weekly" />,
        "No consumption data this week"
      )}

      {activeTab === 'low' && renderCard(
        "Low Stock Alerts",
        lowStock,
        (item, index) => <MedicineCard key={index} item={item} type="low" />,
        "All medications are well-stocked"
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 10,
    fontFamily: 'sans-serif-medium',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  tabButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 15,
    backgroundColor: '#e9ecef',
    width: '23%',
  },
  activeTab: {
    backgroundColor: '#4dabf7',
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  tabText: {
    marginTop: 5,
    fontSize: 12,
    color: '#adb5bd',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4dabf7',
  },
  card: {
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lowStockCard: {
    borderWidth: 2,
    borderColor: '#ffe3e3',
    backgroundColor: '#fff5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    marginLeft: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebfbee',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  missedPill: {
    backgroundColor: '#ffe3e3',
  },
  pillText: {
    fontSize: 14,
    marginLeft: 5,
    color: '#2b8a3e',
  },
  expiredText: {
    color: '#e03131',
    fontWeight: '600',
  },
  lowStockText: {
    color: '#e03131',
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#868e96',
    fontSize: 16,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#495057',
  },
  iconSpacing: {
    marginLeft: 15,
  },
});




//   const renderMedicineItem = ({ item }) => (
//     <View style={styles.medicineCard}>
//       <View style={styles.medicineInfo}>
//         <Text style={styles.medicineName}>{item.name}</Text>
//         <Text style={styles.medicineDetail}>Quantity: {item.quantity}</Text>
//         <Text style={styles.medicineDetail}>
//           Expiry: {new Date(item.expiryDate).toLocaleDateString()}
//         </Text>
//         <Text style={styles.medicineDetail}>Dose: {item.doseAmount} pills</Text>
//         <Text style={styles.medicineDetail}>
//           Times: {item.doseTimes.join(', ')}
//         </Text>
//       </View>
//       <TouchableOpacity
//         style={styles.deleteButton}
//         onPress={() => deleteMedicine(item.id)}
//       >
//         <Text style={styles.deleteButtonText}>Delete</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>My Medicines</Text>
//       <FlatList
//         data={medicines}
//         renderItem={renderMedicineItem}
//         keyExtractor={item => item.id}
//         contentContainerStyle={styles.listContainer}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     marginTop: 40,
//   },
//   listContainer: {
//     paddingBottom: 20,
//   },
//   medicineCard: {
//     backgroundColor: '#f5f5f5',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   medicineInfo: {
//     flex: 1,
//   },
//   medicineName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 8,
//     color: '#333',
//   },
//   medicineDetail: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 4,
//   },
//   deleteButton: {
//     backgroundColor: '#ff3b30',
//     padding: 8,
//     borderRadius: 6,
//     marginLeft: 12,
//   },
//   deleteButtonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
// });
