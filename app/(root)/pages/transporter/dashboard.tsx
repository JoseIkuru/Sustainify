import React,{ useCallback, useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, Button, Alert, 
  RefreshControl
} from 'react-native';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { fetchAPI, useFetch } from '@/lib/fetch';
import { Ionicons } from '@expo/vector-icons'; // Icons for UI enhancement
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from "react-native-paper";


import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

const PendingOrdersScreen = () => {
  interface Order {
    id: number;
    seller_name: string;
    waste_type: string;
    waste_size: number;
    seller_location: string;
    buyer_location: string;
  }
  const { signOut } = useAuth();
  const router = useRouter();
  const { user } = useUser();
  const authUser = useAuth(); 


  // Fetch pending orders
  const { data, loading, error, refetch } = useFetch<any>("/(api)/orders");

  // Accept order function
  const onAcceptOrder = async (orderId: number, sellerLocation: any, buyerLocation:any) => {
    try {

    console.log(user);
    const clerkId = authUser.userId; 
    console.log(clerkId);

// Hardcoded for now
    const transporterResponse = await fetchAPI('/(api)/transporter-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId }),
    });

    const transporterName = await transporterResponse.transporterName;
    console.log(transporterName);
    const transporterEmail = user?.emailAddresses[0].emailAddress;
    

    console.log("Accepting order:", { orderId, transporterName, transporterEmail });

    
    // Call the API to accept the order
    const response = await fetchAPI('/(api)/accept-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        transporterName,
        transporterEmail
      })
    });
    
    refetch(); // Refresh orders
    router.push({
      pathname: "/(root)/pages/transporter/liveMap",
      params: {
        sellerLocation: JSON.stringify(sellerLocation),
        buyerLocation: JSON.stringify(buyerLocation)
      }
    });
    await AsyncStorage.setItem('sellerLocation', JSON.stringify(sellerLocation));
    await AsyncStorage.setItem('buyerLocation', JSON.stringify(buyerLocation));
    await AsyncStorage.setItem('orderId', orderId.toString());

    } catch (error) {
      console.error("Error accepting order:", error);
      Alert.alert("Error", "Could not accept the order.");
    }
  };

  // Sign out function
  const onSignOutPress = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error during sign-out:', err);
    }
  };

  return (
    <View style={styles.container}>
      <SignedIn>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Welcome, {user?.emailAddresses[0].emailAddress}
          </Text>
          <TouchableOpacity onPress={onSignOutPress}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Orders List */}
        {loading && <Text style={styles.loadingText}>Loading orders...</Text>}
        {error && <Text style={styles.errorText}>Error: {error}</Text>}

        {!loading && !error && Array.isArray(data) && data.length > 0 ? (
          <FlatList
            data={data}
            keyExtractor={(item: Order) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderStatus}>🟡 Pending</Text>
                </View>
                <Text style={styles.orderText}>
                  <Ionicons name="person-outline" size={16} /> Seller: {item.seller_name} 
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="bag-outline" size={16} /> Waste: {item.waste_type} ({item.waste_size} kg)
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="location-outline" size={16} /> From: {item.seller_location}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="navigate-outline" size={16} /> To: {item.buyer_location}
                </Text>

                <TouchableOpacity 
                  style={styles.acceptButton} 
                  onPress={() => onAcceptOrder(item.id, item.seller_location, item.buyer_location)}
                >
                  <Text style={styles.acceptButtonText}>Accept Order</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          !loading && <Text style={styles.noOrdersText}>No pending orders available.</Text>
        )}
      </SignedIn>

      <SignedOut>
        <View style={styles.authLinks}>
          <Link href="/(auth)/sign-in">
            <Text style={styles.linkText}>Sign in</Text>
          </Link>
          <Link href="/(auth)/sign-up">
            <Text style={styles.linkText}>Sign up</Text>
          </Link>
        </View>
      </SignedOut>
    </View>
  );
};


const CompletedOrdersScreen = () => {
  interface Order {
    id: number;
    buyer_name: string;
    seller_name: string;
    seller_location: string;
    buyer_location: string;
    price: number;
    created_at: string;
  }

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New state for pull-to-refresh
  const [error, setError] = useState("");
  const { user } = useUser();

  const userEmail = user?.emailAddresses[0]?.emailAddress; // Extract user email

  // Fetch orders function (Reusable for refresh & initial load)
  const fetchCompletedOrders = useCallback(async () => {
    if (!userEmail) return;

    try {
      if (!refreshing) setLoading(true); // Show loading only if not refreshing

      const response = await fetch("/(api)/get-completed-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      console.log("Fetched completed orders:", data);

      if (!response.ok) throw new Error(data.error || "Failed to fetch orders");

      setOrders(data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false); // Stop refresh animation
    }
  }, [userEmail, refreshing]);

  // Initial fetch
  useEffect(() => {
    fetchCompletedOrders();
  }, [userEmail]);

  // Refresh handler for pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchCompletedOrders();
  };

  return (
    <View style={styles.container}>
      {/* Loading & Error Messages */}
      {loading && !refreshing && <Text style={styles.loadingText}>Loading orders...</Text>}
      {error && <Text style={styles.errorText}>Error: {error}</Text>}

      {!loading && !error && Array.isArray(orders) && orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>✅ Completed Order</Text>
                <Text style={styles.orderText}>
                  <Ionicons name="person-outline" size={16} /> Buyer: {item.buyer_name}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="person-outline" size={16} /> Seller: {item.seller_name}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="location-outline" size={16} /> From: {item.seller_location}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="navigate-outline" size={16} /> To: {item.buyer_location}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="pricetag-outline" size={16} /> Price: ${item.price}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="calendar-outline" size={16} /> Date: {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </Card.Content>
            </Card>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          } // Enable pull-to-refresh
        />
      ) : (
        !loading && <Text style={styles.noOrdersText}>No completed orders available.</Text>
      )}
    </View>
  );
};


// Profile Screen
const ProfileScreen = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.pageText}>Welcome, {user?.emailAddresses[0].emailAddress}</Text>
      <TouchableOpacity onPressIn={signOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const TransporterDashboard = () => {
  return (
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: '#085A2D' },
          tabBarActiveTintColor: 'white',
          tabBarIndicatorStyle: { backgroundColor: 'yellow' },
        }}
      >
        <Tab.Screen name="Requests" component={PendingOrdersScreen} />
        <Tab.Screen name="Completed Orders" component={CompletedOrdersScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
  );
};

// Styles for modern UI
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#1E1E1E' // Dark theme
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#085A2D',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
  orderCard: {
    backgroundColor: '#2C2C2C',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  orderStatus: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderText: {
    fontSize: 16,
    color: '#DDD',
    marginBottom: 5,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noOrdersText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  authLinks: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 10,
  },
  signOutButton: { backgroundColor: 'red', padding: 10, marginTop: 20, alignItems: 'center', borderRadius: 5 },
  signOutText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  pageText: { fontSize: 18, color: 'white', textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: "#1E1E1E", // Dark gray card background
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#fff", // Light shadow for contrast
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff", // White text
    marginBottom: 5,
  },
});

export default TransporterDashboard;
