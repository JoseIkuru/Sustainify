import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Button, Alert, ActivityIndicator, View, FlatList, RefreshControl } from 'react-native';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { fetchAPI } from '@/lib/fetch';
import { StripeProvider } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Track from './track';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Icons for UI enhancement
import { Card } from 'react-native-paper'; // Import Card from react-native-paper

const Tab = createMaterialTopTabNavigator();



const PurchaseScreen = () => {

  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [buyerName, setBuyerName] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [requestedWeight, setRequestedWeight] = useState('');
  const [location, setLocation] = useState('');
  const [additionalReq, setAdditionalReq] = useState('');
  const [loading, setLoading] = useState(false);
  const [findingDriver, setFindingDriver] = useState(false);
  const [price, setPrice] = useState<string | null>(null);


  const calculatePrice = (totalMiles) => {
    const pricePerMile = 100;
    return (totalMiles * pricePerMile).toFixed(2);
  };

  const onSendRequest = async () => {
    if (!buyerName || !wasteType || !requestedWeight || !location) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetchAPI("/(api)/buyer", {
        method: "POST",
        body: JSON.stringify({ buyerName, wasteType, requestedWeight: parseFloat(requestedWeight), location, additionalReq, buyerId: user?.id }),
      });
      console.log("Buyer request added:", response);

      const matchResponse = await fetchAPI("/(api)/match", {
        method: "POST",
        body: JSON.stringify({ buyerName, wasteType, requestedWeight: parseFloat(requestedWeight), location, additionalReq, buyerId: user?.id }),
      });
      console.log("Matching result:", matchResponse);

      if (!matchResponse.data || matchResponse.data.length === 0) {
        Alert.alert("Error", "No matching order found.");
        setLoading(false);
        return;
      }

      const sellerLocation = matchResponse.data[0].seller_location;
      let status = matchResponse.data[0].status;
      let id = matchResponse.data[0].id;
      await AsyncStorage.setItem('buyerName', buyerName);

      const checkStatus = async () => {
        let statusChecked = false;
        console.log("Initial statusChecked:", statusChecked);
      
        while (status !== "accepted" && !statusChecked) {
          setFindingDriver(true);
          await new Promise(resolve => setTimeout(resolve, 5000));
      
          console.log("Checking order status for ID:", id);
          if (!id) {
            console.error("Error: orderId is undefined.");
            return;
          }
      
          try {
            const response = await fetchAPI("/(api)/get-status", {
              method: "POST",
              body: JSON.stringify({ orderId: id }),
            });
      
            const data = await response;
            console.log("Status API response:", data);
      
            if (data.error) {
              console.log("Error fetching status:", data.error);
            } else {
              console.log("Order status:", data.status);
              if (data.status === "accepted") {
                statusChecked = true;
                console.log("Status updated to accepted.");
              }
            }
          } catch (error) {
            console.error("Error calling API:", error);
          }
        }
      
        if (statusChecked) {
          console.log("Order accepted. Now calculating distance and price...");
      
          try {
            const distanceResponse = await fetchAPI("/(api)/calculate-distance", {
              method: "POST",
              body: JSON.stringify({ buyerLocation: location, sellerLocation }),
            });
      
            const { totalMiles } = await distanceResponse;
            const calculatedPrice = calculatePrice(totalMiles);
            console.log("Total miles:", totalMiles, "Calculated price:", calculatedPrice);
      
            await AsyncStorage.setItem('price', calculatedPrice);
            setPrice(calculatedPrice);
      
            const updatePriceResponse = await fetchAPI("/(api)/update-price", {
              method: "POST",
              body: JSON.stringify({ orderId: id, price: calculatedPrice }),
            });
      
            const priceData = await updatePriceResponse;
            if (priceData.error) {
              console.log("Error updating order price:", priceData.error);
            } else {
              console.log("Order price updated successfully.");
            }
      
          } catch (error) {
            console.error("Error in distance calculation or price update:", error);
          }
        }
      
        setLoading(false);
        setFindingDriver(true);
      
        setTimeout(() => {
          setFindingDriver(false);
        }, 3000);
      };
      
      console.log("Checking status...");
      checkStatus();
      console.log("Status check initiated.");
    } catch (error) {

      console.error("Error sending request:", error);
      Alert.alert("Error", "Failed to send request. Please try again.");
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };
  
  
  
  return (
    <StripeProvider
    publishableKey="pk_test_51Qzu2R2V8S747Q12iBMVGLjRnA4jz4JetlJYZEicbjLoLd06dYG0xyyr6RUjAzGV9vmNr9eUmyBbHuy4qNCemmjy00MBXfQlyl"
    merchantIdentifier="merchant.com.sustainifyapp"  // required for Apple Pay
    urlScheme="myapp"  // required for 3D Secure and bank redirects
  >
    <ScrollView contentContainerStyle={styles.container}>
      <SignedIn>
        <Text style={styles.header}>Hello {user?.emailAddresses[0].emailAddress}, welcome to your Buyer Dashboard!</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.subheader}>Submit a Waste Request</Text>

        <TextInput style={styles.input} placeholder="Your Name" value={buyerName} onChangeText={setBuyerName} />
        <TextInput style={styles.input} placeholder="Waste Type (e.g., Food Waste)" value={wasteType} onChangeText={setWasteType} />
        <TextInput style={styles.input} placeholder="Requested Weight (kg)" value={requestedWeight} keyboardType="numeric" onChangeText={setRequestedWeight} />
        <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
        <TextInput style={[styles.input, styles.multilineInput]} placeholder="Additional Requirements (optional)" value={additionalReq} onChangeText={setAdditionalReq} multiline numberOfLines={4} />

        <TouchableOpacity style={styles.button} onPress={onSendRequest} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Request</Text>}
        </TouchableOpacity>

        {findingDriver && <Text style={styles.findingText}>Finding you a driver...</Text>}

    `        {price && !findingDriver && (
      <>
        <View style={styles.priceCard}>
          <Text style={styles.cardTitle}>Transporter Found!</Text>
          <Text style={styles.priceText}>Service Price: ${price}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.push('/(root)/pages/buyer/payment')}>
          <Text style={styles.buttonText}>Proceed to Payment</Text>
        </TouchableOpacity>

      </>
    )}`


        <Button title="Sign Out" onPress={() => signOut()} />
      </SignedIn>
      <SignedOut>
        <Link href="/(auth)/sign-in"><Text style={styles.linkText}>Sign in</Text></Link>
        <Link href="/(auth)/sign-up"><Text style={styles.linkText}>Sign up</Text></Link>
      </SignedOut>
    </ScrollView>
    </StripeProvider>
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
    transporter_name: string;
    status: string;
  }

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New state for pull-to-refresh
  const [error, setError] = useState("");
  const { user } = useUser();
  const router = useRouter();
  const [showTrackPage, setShowTrackPage] = useState(false);

  const handleTrackPackage = () => {
    setShowTrackPage(true);
  };

  const buyer_name = AsyncStorage.getItem('buyerName');
 

  // Fetch orders function (Reusable for refresh & initial load)
  const fetchCompletedOrders = useCallback(async () => {
    if (!buyer_name) return;

    try {
      if (!refreshing) setLoading(true); // Show loading only if not refreshing

      const response = await fetch("/(api)/get-buyer-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName: buyer_name}),
      });

      const data = await response.json();
      console.log("Fetched buyer orders:", data);

      if (!response.ok) throw new Error(data.error || "No orders right now");

      setOrders(data.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
      setRefreshing(false); // Stop refresh animation
    }
  }, [buyer_name, refreshing]);

  // Initial fetch
  useEffect(() => {
    fetchCompletedOrders();
  }, [buyer_name]);

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
                <Text style={styles.cardTitle}>Your order: {item.id}</Text>
                <Text style={styles.orderText}>
                  <Ionicons name="person-outline" size={16} /> You: {item.buyer_name}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="location-outline" size={16} /> Transporter: {item.transporter_name}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="navigate-outline" size={16} /> To: {item.buyer_location}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="pricetag-outline" size={16} /> Price: ${item.price}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="notifications-outline" size={16} /> Status: {item.status}
                </Text>
                <Text style={styles.orderText}>
                  <Ionicons name="calendar-outline" size={16} /> Date: {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <TouchableOpacity style={styles.trackButton} onPress={handleTrackPackage}>
                  <Text style={styles.trackButtonText}>Track Package</Text>
                </TouchableOpacity>
                {showTrackPage && <Track orderId={item.id} />} {/* Passing orderId to Track */}
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
      <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const BuyerDashboard = () => {
  return (
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: '#085A2D' },
          tabBarActiveTintColor: 'white',
          tabBarIndicatorStyle: { backgroundColor: 'yellow' },
        }}
      >
        <Tab.Screen name="Purchase" component={PurchaseScreen} />
        <Tab.Screen name="Purchases" component={CompletedOrdersScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
  );
};
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#085A2D' },
  subheader: { fontSize: 18, fontWeight: '600', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 5, padding: 10, marginBottom: 15, fontSize: 16 },
  multilineInput: { height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#085A2D', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  linkText: { fontSize: 16, color: '#085A2D', fontWeight: '600', textAlign: 'center', marginTop: 10 },
  findingText: { fontSize: 16, fontWeight: 'bold', color: 'orange', textAlign: 'center', marginVertical: 10 },
  priceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
    width: '90%',
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  signOutButton: { backgroundColor: 'red', padding: 10, marginTop: 20, alignItems: 'center', borderRadius: 5 },
  signOutText: { color: 'black', fontSize: 16, fontWeight: 'bold' },
  pageText: { fontSize: 18, color: 'black', textAlign: 'center', marginTop: 20 },
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
  noOrdersText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  orderText: {
    fontSize: 16,
    color: '#DDD',
    marginBottom: 5,
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
  trackButton: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#28a745", // Green background
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  trackButtonText: {
    color: "#fff", // White text
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default BuyerDashboard;
