import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Button, Alert } from 'react-native';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { useFetch } from '@/lib/fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransporterDashboard = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  // Fetch pending orders from your orders API endpoint.
  // This assumes your API returns a JSON object with a "data" property that contains an array of orders.
  const { data, loading, error, refetch } = useFetch<any>("/(api)/orders?status=pending");

  // Handler when a transporter accepts an order.
  const onAcceptOrder = async (orderId: number) => {
    // Placeholder: implement the API call to update order status & assign transporter.
    Alert.alert("Order accepted", `Order ID ${orderId} accepted`);
    // Refresh the orders list after accepting the order.
    refetch();
  };

   // Handle sign out and remove role from AsyncStorage
   const onSignOutPress = async () => {
    try {
      
      // Now proceed with the sign-out
      await signOut();
    } catch (err) {
      console.error('Error during sign-out:', err);
    }
  };

  return (
    <View style={styles.container}>
      <SignedIn>
        <Text style={styles.header}>
          Hello {user?.emailAddresses[0].emailAddress}, welcome to the Transporter Dashboard
        </Text>
        <Button title="Sign Out" onPress={onSignOutPress} />

        {loading && <Text>Loading orders...</Text>}
        {error && <Text>Error: {error}</Text>}
        {!loading && !error && data && data.data && (
          <FlatList
            data={data.data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.orderContainer}>
                <Text style={styles.orderText}>
                  Seller: {item.seller_name} | Buyer: {item.buyer_name}
                </Text>
                <Text style={styles.orderText}>
                  Waste: {item.waste_type} (Size: {item.waste_size} kg)
                </Text>
                <Text style={styles.orderText}>
                  From: {item.seller_location} To: {item.buyer_location}
                </Text>
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={() => onAcceptOrder(item.id)}
                >
                  <Text style={styles.orderButtonText}>Accept Order</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </SignedIn>

      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text style={styles.linkText}>Sign in</Text>
        </Link>
        <Link href="/(auth)/sign-up">
          <Text style={styles.linkText}>Sign up</Text>
        </Link>
      </SignedOut>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#085A2D',
  },
  linkText: {
    fontSize: 16,
    color: '#085A2D',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  orderContainer: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
  },
  orderText: {
    fontSize: 16,
    marginBottom: 5,
  },
  orderButton: {
    backgroundColor: '#085A2D',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransporterDashboard;
