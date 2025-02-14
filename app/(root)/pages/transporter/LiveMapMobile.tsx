import React, { useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

const LiveMapMobile = () => {
  const sellerLocation = { latitude: 6.5244, longitude: 3.3792 }; // Example seller location
  const buyerLocation = { latitude: 6.5321, longitude: 3.3756 }; // Example buyer location

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [directions, setDirections] = useState<{ latitude: number; longitude: number }[]>([]);
  const [eta, setEta] = useState('');
  const googleMapsApiKey = "AIzaSyBaAUy-Z9j0yy_wWpv8XW_8VOHXupwLKzs"; // Replace with your actual API key

  // Request and watch the current location
  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "We need location permissions to show your location.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    getLocation();
  }, []);

  // Fetch directions using Google Maps Directions API
  useEffect(() => {
    if (!currentLocation || !sellerLocation || !buyerLocation) return;

    const fetchDirections = async () => {
      try {
        // Adding waypoints to route: from transporter to seller and then seller to buyer
        const directionsServiceUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${buyerLocation.latitude},${buyerLocation.longitude}&waypoints=${sellerLocation.latitude},${sellerLocation.longitude}&mode=driving&key=${googleMapsApiKey}`;
        
        const response = await fetch(directionsServiceUrl);
        const data = await response.json();

        if (data.routes.length > 0 && data.routes[0].legs.length > 0) {
          const firstLeg = data.routes[0].legs[0]; // Transporter to Seller
          const secondLeg = data.routes[0].legs[1]; // Seller to Buyer

          const routeCoordinates = data.routes[0].overview_polyline.points;
          const etaText = `${firstLeg.duration.text} to Seller, then ${secondLeg.duration.text} to Buyer`;

          setDirections(decodePolyline(routeCoordinates));
          setEta(etaText);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        Alert.alert("Directions Error", "Unable to fetch directions.");
      }
    };

    fetchDirections();
  }, [currentLocation]);

  // Decode polyline function to render directions as a Polyline on the map
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
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 6.5244, // Default center location
          longitude: 3.3792,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
      >
        {currentLocation && <Marker coordinate={currentLocation} title="You" />}
        {sellerLocation && <Marker coordinate={sellerLocation} title="Seller" />}
        {buyerLocation && <Marker coordinate={buyerLocation} title="Buyer" />}
        {directions.length > 0 && (
          <Polyline coordinates={directions} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>

      {eta && (
        <View style={styles.etaContainer}>
          <Text style={styles.etaText}>ETA: {eta}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  etaContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  etaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#085A2D',
  },
});

export default LiveMapMobile;
