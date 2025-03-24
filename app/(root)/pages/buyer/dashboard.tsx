import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Button, Alert, ActivityIndicator, View } from 'react-native';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { fetchAPI } from '@/lib/fetch';
import { StripeProvider } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';



const BuyerDashboard = () => {

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
      const status = matchResponse.data[0].status;
      const id = matchResponse.data[0].id;
      
      const distanceResponse = await fetchAPI("/(api)/calculate-distance", {
        method: "POST",
        body: JSON.stringify({ buyerLocation: location, sellerLocation }),
      });

      const { totalMiles } = distanceResponse;
      const calculatedPrice = calculatePrice(totalMiles);
      await AsyncStorage.setItem('price', calculatedPrice);
      setPrice(calculatedPrice);
      setLoading(false);
      setFindingDriver(true);

      setTimeout(() => {
        setFindingDriver(false);
      }, 3000);
    } catch (error) {
      console.error("Error sending buyer request:", error);
      Alert.alert("Error", "Failed to send request. Please try again.");
      setLoading(false);
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
    color: '#333',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007BFF',
  },
});

export default BuyerDashboard;
