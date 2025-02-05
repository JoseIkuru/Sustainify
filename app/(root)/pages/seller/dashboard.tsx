import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Button, Alert } from 'react-native';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { fetchAPI } from '@/lib/fetch'; // Your fetch helper that calls your API

const SellerDashboard = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  // State for the waste request form
  const [companyName, setCompanyName] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [weight, setWeight] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [location, setLocation] = useState('');
  const [specialReq, setSpecialReq] = useState('');

  const onSendRequest = async () => {
    // Validate required fields
    if (!companyName|| !wasteType || !weight || !pickupDate || !location) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    try {
      // Call your API to add the waste listing
      const response = await fetchAPI("/(api)/seller", {
        method: "POST",
        body: JSON.stringify({
          companyName,
          wasteType,
          weight: parseFloat(weight),
          pickupDate,      // e.g., "2023-08-31" (ideally an ISO string)
          location,
          specialReq,
          sellerId: user?.id,  // Use Clerk's user id to reference the seller
        }),
      });

      console.log("Waste request added:", response);
      Alert.alert("Success", "Waste request added successfully.");

      // Optionally clear the form
      setCompanyName('');
      setWasteType('');
      setWeight('');
      setPickupDate('');
      setLocation('');
      setSpecialReq('');
    } catch (error) {
      console.error("Error sending waste request:", error);
      Alert.alert("Error", "Failed to send waste request.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SignedIn>
        <Text style={styles.header}>
          Hello {user?.emailAddresses[0].emailAddress}, welcome to the Seller Dashboard
        </Text>
        <Text style={styles.subheader}>Add Waste Request</Text>
        

        <TextInput
          style={styles.input}
          placeholder="Company Name"
          value={companyName}
          onChangeText={setCompanyName}
        />
        <TextInput
          style={styles.input}
          placeholder="Waste Type"
          value={wasteType}
          onChangeText={setWasteType}
        />
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          value={weight}
          keyboardType="numeric"
          onChangeText={setWeight}
        />
        <TextInput
          style={styles.input}
          placeholder="Pickup Date (YYYY-MM-DD)"
          value={pickupDate}
          onChangeText={setPickupDate}
        />
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Special Requirements (optional)"
          value={specialReq}
          onChangeText={setSpecialReq}
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
    justifyContent: 'center',
    backgroundColor: '#fff',
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
    marginBottom: 10,
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

export default SellerDashboard;
