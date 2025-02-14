import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const googleMapsApiKey = "AIzaSyBaAUy-Z9j0yy_wWpv8XW_8VOHXupwLKzs"; // Replace with your actual API key

const LiveMapMobile = () => {
  const [sellerLocation, setSellerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [buyerLocation, setBuyerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [directions, setDirections] = useState<{ latitude: number; longitude: number }[]>([]);
  const [eta, setEta] = useState('');

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

        console.log("Raw sellerLocation:", storedSellerLocation);
        console.log("Raw buyerLocation:", storedBuyerLocation);

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

    console.log("Transporter Location:", currentLocation);
    console.log("Seller Location:", sellerLocation);
    console.log("Buyer Location:", buyerLocation);

    const fetchDirections = async () => {
      try {
        const directionsServiceUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${buyerLocation.latitude},${buyerLocation.longitude}&waypoints=${sellerLocation.latitude},${sellerLocation.longitude}&mode=driving&key=${googleMapsApiKey}`;
        
        const response = await fetch(directionsServiceUrl);
        const data = await response.json();

        if (data.routes.length > 0 && data.routes[0].legs.length > 0) {
          const firstLeg = data.routes[0].legs[0]; 
          const secondLeg = data.routes[0].legs[1]; 

          const routeCoordinates = decodePolyline(data.routes[0].overview_polyline.points);
          const etaText = `${firstLeg.duration.text} to Seller, then ${secondLeg.duration.text} to Buyer`;

          setDirections(routeCoordinates);
          setEta(etaText);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        Alert.alert("Directions Error", "Unable to fetch directions.");
      }
    };

    fetchDirections();
  }, [currentLocation, sellerLocation, buyerLocation]);

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

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }} showsUserLocation={true}>
        {currentLocation && <Marker coordinate={currentLocation} title="You" />}
        {sellerLocation && <Marker coordinate={sellerLocation} title="Seller" />}
        {buyerLocation && <Marker coordinate={buyerLocation} title="Buyer" />}
        {directions.length > 0 && <Polyline coordinates={directions} strokeWidth={4} strokeColor="blue" />}
      </MapView>

      {eta && <View style={styles.etaContainer}><Text style={styles.etaText}>ETA: {eta}</Text></View>}
    </View>
  );
};

const styles = StyleSheet.create({ etaContainer: { position: 'absolute', top: 20, left: 20, backgroundColor: 'white', padding: 10, borderRadius: 8 }, etaText: { fontSize: 18, fontWeight: 'bold' } });

export default LiveMapMobile;
