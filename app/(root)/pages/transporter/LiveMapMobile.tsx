import React, { useEffect, useState } from 'react';
import { Alert, View, Text, Button, StyleSheet, Linking, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-react';
import { fetchAPI } from '@/lib/fetch';

const googleMapsApiKey = "AIzaSyBaAUy-Z9j0yy_wWpv8XW_8VOHXupwLKzs"; // Replace with your actual API key

const LiveMapMobile = () => {
  const authUser = useAuth(); 
  const [sellerLocation, setSellerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [buyerLocation, setBuyerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [directions, setDirections] = useState<{ latitude: number; longitude: number }[]>([]);
  const [eta, setEta] = useState('');
  const [currentRoute, setCurrentRoute] = useState<'seller' | 'buyer' | 'completed'>('seller'); // Controls which part of the journey to show
    const [journeyDetails, setJourneyDetails] = useState({
    sellerAddress: '',
    buyerAddress: '',
    currentAddress: '',
  });

  // Get Coordinates from Address using Google Maps API
  const getCoordinatesFromAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`
      );
      const data = await response.json();

      if (data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { latitude: location.lat, longitude: location.lng };
      } else {
        console.error("No results found for address:", address);
        return null;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  // Fetch Seller & Buyer Locations from AsyncStorage
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const storedSellerLocation = await AsyncStorage.getItem('sellerLocation');
        const storedBuyerLocation = await AsyncStorage.getItem('buyerLocation');

        let sellerCoords, buyerCoords;

        if (storedSellerLocation) {
          let parsedSellerLocation;
          try {
            parsedSellerLocation = JSON.parse(storedSellerLocation);
          } catch {
            parsedSellerLocation = storedSellerLocation; 
          }

          if (typeof parsedSellerLocation === "string") {
            sellerCoords = await getCoordinatesFromAddress(parsedSellerLocation);
            if (sellerCoords) {
              setSellerLocation(sellerCoords);
              await AsyncStorage.setItem("sellerLocation", JSON.stringify(sellerCoords));
            }
          } else if (parsedSellerLocation.latitude && parsedSellerLocation.longitude) {
            setSellerLocation(parsedSellerLocation);
          } else {
            console.error("Invalid seller location format:", parsedSellerLocation);
          }
        }

        if (storedBuyerLocation) {
          let parsedBuyerLocation;
          try {
            parsedBuyerLocation = JSON.parse(storedBuyerLocation);
          } catch {
            parsedBuyerLocation = storedBuyerLocation; 
          }

          if (typeof parsedBuyerLocation === "string") {
            buyerCoords = await getCoordinatesFromAddress(parsedBuyerLocation);
            if (buyerCoords) {
              setBuyerLocation(buyerCoords);
              await AsyncStorage.setItem("buyerLocation", JSON.stringify(buyerCoords));
            }
          } else if (parsedBuyerLocation.latitude && parsedBuyerLocation.longitude) {
            setBuyerLocation(parsedBuyerLocation);
          } else {
            console.error("Invalid buyer location format:", parsedBuyerLocation);
          }
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();
  }, []);

  // Track Transporter’s Live Location
  useEffect(() => {
    const subscribeToLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to track movement.');
        return;
      }

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    };

    subscribeToLocation();
  }, []);



  // Fetch Directions from Transporter → Seller → Buyer
  useEffect(() => {
    if (!currentLocation || !sellerLocation || !buyerLocation) return;

    

    const fetchDirections = async () => {
      try {
        let directionsServiceUrl = '';
        
        if (currentRoute === 'seller') {
          directionsServiceUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${sellerLocation.latitude},${sellerLocation.longitude}&mode=driving&key=${googleMapsApiKey}`;
        } else if (currentRoute === 'buyer') {
          directionsServiceUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${sellerLocation.latitude},${sellerLocation.longitude}&destination=${buyerLocation.latitude},${buyerLocation.longitude}&mode=driving&key=${googleMapsApiKey}`;
        }

        const response = await fetch(directionsServiceUrl);
        const data = await response.json();

        if (data.routes.length > 0 && data.routes[0].legs.length > 0) {
          const firstLeg = data.routes[0].legs[0];

          const routeCoordinates = decodePolyline(data.routes[0].overview_polyline.points);
          const etaText = `${firstLeg.duration.text} to ${currentRoute === 'seller' ? 'Seller' : 'Buyer'}`;

          setDirections(routeCoordinates);
          setEta(etaText);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        Alert.alert("Directions Error", "Unable to fetch directions.");
      }
    };

    fetchDirections();
  }, [currentLocation, sellerLocation, buyerLocation, currentRoute]);

  // Decode polyline for rendering on Map
  const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
    let points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    let len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let shift = 0;
      let result = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1E5,
        longitude: lng / 1E5,
      });
    }

    return points;
  };

  // Open Google Maps with Seller's Location
  const sellerMaps = () => {
    if (!sellerLocation) {
      console.error("Seller location is not available.");
      return;
    }

    const { latitude, longitude } = sellerLocation;
    const googleMapsUrl = `http://maps.google.com?q=${latitude},${longitude}`;

    Linking.openURL(googleMapsUrl).catch((err) => console.error("Failed to open Google Maps", err));
  };

    // Open Google Maps with Seller's Location
  const buyerMaps = () => {
      if (!buyerLocation) {
        console.error("Seller location is not available.");
        return;
      }
  
      const { latitude, longitude } = buyerLocation;
      const googleMapsUrl = `http://maps.google.com?q=${latitude},${longitude}`;
  
      Linking.openURL(googleMapsUrl).catch((err) => console.error("Failed to open Google Maps", err));
    };

    useEffect(() => {
      if (!sellerLocation || !buyerLocation || !currentLocation) return;
  
      const getJourneyDetails = async () => {
        const sellerAddress = `${await getAddressFromCoordinates(sellerLocation)}`;
        const buyerAddress = `${await getAddressFromCoordinates(buyerLocation)}`;
        const currentAddress = `${await getAddressFromCoordinates(currentLocation)}`;
  
        setJourneyDetails({
          sellerAddress,
          buyerAddress,
          currentAddress,
        });
      };
  
      getJourneyDetails();
    }, [currentLocation, sellerLocation, buyerLocation]);
  
    // Convert coordinates to human-readable address
    const getAddressFromCoordinates = async (coords: { latitude: number; longitude: number }) => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${googleMapsApiKey}`
        );
        const data = await response.json();
        if (data.results.length > 0) {
          return data.results[0].formatted_address;
        } else {
          return "Address not found";
        }
      } catch (error) {
        console.error("Error fetching address:", error);
        return "Error fetching address";
      }
    };

    const handleCompleteDelivery = async () => {
      try {

        if (!authUser) {
          // Handle case where no user is authenticated (e.g., show an error)
          throw new Error('No user found');
        }
    
        const clerkId = authUser.userId;  // Get the Clerk ID from the authenticated user
        console.log(clerkId);
    
        // Fetch the transporterId based on the clerkId
        const transporterResponse = await fetchAPI('/(api)/transporter-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkId }),
        });
    
        const transporterData =  transporterResponse;
    
        if (!transporterData.transporterId) {
          throw new Error('Transporter not found');
        }
    
        // Now use the transporterId to make the payment request
        const transporterId = transporterData.transporterId; // Get transporterId from the response
        console.log(transporterId)


        const orderId = await AsyncStorage.getItem('orderId');
        console.log(orderId)
        const response = await fetch("/(api)/get-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
    
        const data = await response.json();
        console.log(data);
    
      // Send payment request
      const paymentAmount = data.price;
      console.log(paymentAmount) // Example: $50.00 (amount in cents)
      const paymentResponse = await fetchAPI('/(api)/pay-transporter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripeAccountId: transporterId, amount: paymentAmount }),
      });

      console.log(paymentResponse)

      const paymentData = await paymentResponse;

      if (paymentData.success) {
        Alert.alert("Payment Successful", "You have received payment for this delivery.");
      } else {
        Alert.alert("Payment Failed", "Something went wrong.");
      }
      } catch (error) {
        console.error("Error processing payment:", error);
        Alert.alert("Error", "Unable to process payment.");
      }
    };
    
    
  
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Transporter Journey Dashboard</Text>
          
          <View style={styles.journeyCard}>
            <Text style={styles.cardTitle}>Journey Overview</Text>
            <Text style={styles.cardText}>Current Route: {currentRoute === 'seller' ? 'From Transporter to Seller' : currentRoute === 'buyer' ? 'From Seller to Buyer' : 'Completed'}</Text>
            <Text style={styles.cardText}>Seller Location: {journeyDetails.sellerAddress}</Text>
            <Text style={styles.cardText}>Buyer Location: {journeyDetails.buyerAddress}</Text>
            <Text style={styles.cardText}>Current Location: {journeyDetails.currentAddress}</Text>
            {eta && <Text style={styles.cardText}>ETA: {eta}</Text>}
          </View>
    
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, currentRoute === 'seller' && styles.activeButton]}
              onPress={sellerMaps}
            >
              <Text style={styles.buttonText}>Start from Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, currentRoute === 'buyer' && styles.activeButton]}
              onPress={buyerMaps}
            >
              <Text style={styles.buttonText}>Proceed to Buyer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, currentRoute === 'completed' && styles.activeButton]}
              onPress={handleCompleteDelivery}
            >
              <Text style={styles.buttonText}>Complete Delivery</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    };
    
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f4f4f4',
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
      },
      journeyCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      cardText: {
        fontSize: 16,
        marginBottom: 5,
      },
      buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
      },
      button: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 8,
        width: '30%',
        alignItems: 'center',
      },
      buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
      activeButton: {
        backgroundColor: '#0056b3',
      },
    });
     
  

export default LiveMapMobile;
