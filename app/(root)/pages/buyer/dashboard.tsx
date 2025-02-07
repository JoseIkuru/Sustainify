import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Button, Alert } from 'react-native';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { fetchAPI } from '@/lib/fetch'; // Your fetch helper that calls your API

const BuyerDashboard = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  // State for the buyer request form
  const [buyerName, setBuyerName] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [requestedWeight, setRequestedWeight] = useState('');
  const [location, setLocation] = useState('');
  const [additionalReq, setAdditionalReq] = useState('');

  const onSendRequest = async () => {
    // Validate required fields
    if (!buyerName || !wasteType || !requestedWeight || !location) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    try {
      // Call your API to add the buyer request
      const response = await fetchAPI("/(api)/buyer", {
        method: "POST",
        body: JSON.stringify({
          buyerName,
          wasteType,
          requestedWeight: parseFloat(requestedWeight),
          location,
          additionalReq,
          buyerId: user?.id, // Use Clerk's user id to reference the buyer
        }),
      });

      console.log("Buyer request added:", response);
      Alert.alert("Success", "Your request has been submitted.");

      // Optionally, clear the form after submission
      setBuyerName('');
      setWasteType('');
      setRequestedWeight('');
      setLocation('');
      setAdditionalReq('');
    } catch (error) {
      console.error("Error sending buyer request:", error);
      Alert.alert("Error", "Failed to send request. Please try again.");
    }

    try {
      const result = await fetchAPI("/(api)/match", {
        method: "POST",
        body: JSON.stringify({
          buyerName,
          wasteType,
          requestedWeight: parseFloat(requestedWeight),
          location,
          additionalReq,
          buyerId: user?.id,
        }),
      });
      console.log("Matching result:", result);
      Alert.alert("Success", "Your request has been matched and an order has been created!");
      // Optionally clear form fields
      setBuyerName('');
      setWasteType('');
      setRequestedWeight('');
      setLocation('');
      setAdditionalReq('');
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert("Error", "Failed to create order. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SignedIn>
        <Text style={styles.header}>
          Hello {user?.emailAddresses[0].emailAddress}, welcome to your Buyer Dashboard!
        </Text>
        <Text style={styles.subheader}>Submit a Waste Request</Text>

        {/* Buyer Request Form */}
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={buyerName}
          onChangeText={setBuyerName}
        />
        <TextInput
          style={styles.input}
          placeholder="Waste Type (e.g., Food Waste)"
          value={wasteType}
          onChangeText={setWasteType}
        />
        <TextInput
          style={styles.input}
          placeholder="Requested Weight (kg)"
          value={requestedWeight}
          keyboardType="numeric"
          onChangeText={setRequestedWeight}
        />
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Additional Requirements (optional)"
          value={additionalReq}
          onChangeText={setAdditionalReq}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.button} onPress={onSendRequest}>
          <Text style={styles.buttonText}>Send Request</Text>
        </TouchableOpacity>

        <Button title="Sign Out" onPress={() => signOut()} />
      </SignedIn>

      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text style={styles.linkText}>Sign in</Text>
        </Link>
        <Link href="/(auth)/sign-up">
          <Text style={styles.linkText}>Sign up</Text>
        </Link>
      </SignedOut>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#085A2D',
  },
  subheader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#085A2D',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    fontSize: 16,
    color: '#085A2D',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default BuyerDashboard;
