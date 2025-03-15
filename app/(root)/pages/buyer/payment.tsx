import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet } from 'react-native';
import { View, Text } from 'react-native';
import { useStripe, PaymentIntent } from '@stripe/stripe-react-native';
import { useRouter } from 'expo-router';
import { fetchAPI } from '@/lib/fetch';  // Adjust if necessary
import AsyncStorage from '@react-native-async-storage/async-storage';

const Payments = () => {
  const router = useRouter();
  const [price, setPrice] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      const storedPrice = await AsyncStorage.getItem('pricePayment');
      setPrice(storedPrice);
    };

    fetchPrice();
  }, []);

  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();

  const [loading, setLoading] = useState(false);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // To store payment method details

  // Fetch payment sheet params from the backend (Create API)
  const fetchPaymentSheetParams = async () => {
    try {
      const response = await fetchAPI("/(api)/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: price,  // Amount in cents
          currency: "usd",
          email: "user@example.com",  // Set this dynamically from user data if possible
          name: "John Doe",  // Set dynamically from user data if possible
        }),
      });

      const { paymentIntent, ephemeralKey, customer } = await response.json();
      return { paymentIntent, ephemeralKey, customer };
    } catch (error) {
      console.error("Error fetching payment params:", error);
      Alert.alert("Error", "There was an issue fetching payment details.");
    }
  };

  // Initialize the payment sheet with the returned params from the Create API
  const initializePayment = async () => {
    const paymentParams = await fetchPaymentSheetParams();
    if (!paymentParams) {
      Alert.alert("Error", "Failed to initialize payment.");
      return;
    }
    const { paymentIntent, ephemeralKey, customer } = paymentParams;
    setPaymentIntentClientSecret(paymentIntent.client_secret);
  };

  // Handle the payment flow
  const handlePayment = async () => {
    if (!paymentIntentClientSecret) return;

    setLoading(true);

    // Confirm the payment using the client secret
    const { error, paymentIntent } = await confirmPayment(paymentIntentClientSecret, {
      paymentMethodType: 'Card', // Or whatever payment method is selected
    });

    if (error) {
      Alert.alert(`Error: ${error.message}`);
      setLoading(false);
    } else {
      if (paymentIntent.status === PaymentIntent.Status.Succeeded) {
        Alert.alert('Success', 'Payment was successful!');
        // Optionally, call the Pay API to confirm the payment and update backend
        await confirmPaymentIntent(paymentIntent);
      }
      setLoading(false);
    }
  };

  // Call the Pay API to confirm the payment on the backend
  const confirmPaymentIntent = async (paymentIntent) => {
    try {
      const response = await fetchAPI("/(api)/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_method_id: paymentIntent.payment_method,
          payment_intent_id: paymentIntent.id,
          customer_id: paymentIntent.customer,
          client_secret: paymentIntent.client_secret,
        }),
      });

      const result = await response.json();
      if (result.success) {
        Alert.alert("Payment Confirmed", "Your payment has been processed.");
      } else {
        Alert.alert("Error", "Payment confirmation failed.");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      Alert.alert("Error", "There was an issue confirming the payment.");
    }
  };

  // Initialize the payment sheet when the price is available
  useEffect(() => {
    if (price) {
      initializePayment();
    }
  }, [price]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payment Details</Text>
      <Text style={styles.price}>
        Total Price: {price ? `$${price}` : 'Loading...'}
      </Text>

      <Button 
        title={loading ? 'Processing...' : 'Pay Now'} 
        onPress={handlePayment} 
        disabled={loading}
        color="#085A2D"  // Customize the button color
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  price: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default Payments;
