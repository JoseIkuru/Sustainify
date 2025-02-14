import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import * as Location from "expo-location";
// Try importing useSearchParams from "expo-router" or "expo-router/entry" if needed.
import { useLocalSearchParams } from "expo-router"; 

const LiveMapMobile = () => {
  // Retrieve query parameters passed via router.push()
  const { sellerLocation: sellerLoc, buyerLocation: buyerLoc } = useLocalSearchParams();

  // Ensure the values are strings (if they come as an array, take the first element)
  const sellerLocStr = Array.isArray(sellerLoc) ? sellerLoc[0] : sellerLoc;
  const buyerLocStr = Array.isArray(buyerLoc) ? buyerLoc[0] : buyerLoc;

  // Parse the parameters from JSON strings into objects.
  let sellerLocation, buyerLocation;
  try {
    sellerLocation = sellerLocStr ? JSON.parse(sellerLocStr) : null;
    buyerLocation = buyerLocStr ? JSON.parse(buyerLocStr) : null;
  } catch (error) {
    console.error("Error parsing location params:", error);
    Alert.alert("Error", "Failed to parse location data.");
    return null;
  }

  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permissions are required.");
        return;
      }
      // Get the initial current location of the transporter
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location.coords);

      // Optionally: Watch the location for live updates
      const locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (locationUpdate) => {
          setCurrentLocation(locationUpdate.coords);
          mapRef.current?.animateToRegion({
            latitude: locationUpdate.coords.latitude,
            longitude: locationUpdate.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      );

      return () => locationSubscription.remove();
    })();
  }, []);

  if (!currentLocation || !sellerLocation || !buyerLocation) {
    return <ActivityIndicator size="large" color="#085A2D" />;
  }

  // Optionally, calculate an initial region (here we center on the transporter)
  const initialRegion = {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {/* Transporter's Current Location */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Your Location"
          pinColor="blue"
        />

        {/* Seller's Location */}
        <Marker
          coordinate={{
            latitude: sellerLocation.lat,
            longitude: sellerLocation.lng,
          }}
          title="Seller Location"
        />

        {/* Buyer's Location */}
        <Marker
          coordinate={{
            latitude: buyerLocation.lat,
            longitude: buyerLocation.lng,
          }}
          title="Buyer Location"
        />

        {/* Directions from current location to buyer's location using MapViewDirections */}
        <MapViewDirections
          origin={currentLocation}
          destination={{
            latitude: buyerLocation.lat,
            longitude: buyerLocation.lng,
          }}
          apikey="AIzaSyBaAUy-Z9j0yy_wWpv8XW_8VOHXupwLKzs" // Replace with your actual API key (securely stored)
          strokeWidth={4}
          strokeColor="green"
          onError={(errorMessage) => {
            console.error("Directions API error:", errorMessage);
            Alert.alert("Directions Error", errorMessage);
          }}
        />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default LiveMapMobile;
