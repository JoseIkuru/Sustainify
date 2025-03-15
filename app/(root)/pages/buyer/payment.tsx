import React, { useEffect, useState } from 'react';
import { Alert, Button, View, ActivityIndicator } from 'react-native';
import { useStripe, StripeProvider } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaymentScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  // Fetch clientSecret from your backend API
  const fetchPaymentSheetParams = async () => {
    // const price = await AsyncStorage.getItem('price');
    // console.log(price)
    const price = 60;
    console.log(price)
    if (price === null) {
      throw new Error("Price is null");
    }
    try {
      // Here, use the price calculated from your BuyerDashboard.
      const response = await fetch('/(api)/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price }), // convert dollars to cents
      });
      const { clientSecret } = await response.json();
      return clientSecret;
    } catch (error) {
      console.error("Error fetching PaymentIntent:", error);
    }
  };

  // Initialize the PaymentSheet
  const initializePaymentSheet = async () => {
    const secret = await fetchPaymentSheetParams();
    if (!secret) return;
    setClientSecret(secret);

    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: secret,
      // Optional: customize appearance, merchantDisplayName, etc.
      merchantDisplayName: 'Sustainify',
    });
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
  };

  // Open PaymentSheet for user to complete payment
  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      Alert.alert("Payment failed", error.message);
    } else {
      Alert.alert("Success", "Your payment is confirmed!");
      // Optionally, update your database with the payment status.
    }
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <Button title="Pay Now" onPress={openPaymentSheet} />

    </View>
  );
};

export default PaymentScreen;