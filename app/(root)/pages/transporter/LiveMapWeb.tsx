import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View, Text, StyleSheet } from "react-native";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";

const mapContainerStyle = { width: "100vw", height: "100vh" };
const defaultCenter = { lat: 6.5244, lng: 3.3792 };
const defaultOptions = {
  mapTypeId: "roadmap",
  disableDefaultUI: false,
  zoomControl: true,
};

const thresholdDistance = 0.1; // in kilometers

const LiveMapWeb = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const sellerLocStr = searchParams.get("sellerLocation");
  const buyerLocStr = searchParams.get("buyerLocation");

  const sellerLocation = sellerLocStr ? JSON.parse(sellerLocStr) : null;
  const buyerLocation = buyerLocStr ? JSON.parse(buyerLocStr) : null;

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>(defaultCenter);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [eta, setEta] = useState("");

  // Watch current location
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
          Alert.alert("Geolocation Error", "Unable to fetch your current location.");
        },
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      Alert.alert("Geolocation Error", "Geolocation is not supported by this browser.");
    }
  }, []);

  // Fetch directions
  useEffect(() => {
    if (!isGoogleLoaded || !sellerLocation || !buyerLocation || !currentLocation.lat) return;

    const fetchDirections = async () => {
      try {
        const directionsService = new google.maps.DirectionsService();
        const result = await directionsService.route({
          origin: currentLocation,
          destination: buyerLocation,
          waypoints: [{ location: sellerLocation, stopover: true }],
          travelMode: google.maps.TravelMode.DRIVING,
        });

        console.log("Directions result:", result);
        setDirections(result);

        if (result.routes.length > 0 && result.routes[0].legs.length > 0) {
          const leg = result.routes[0].legs[0];
          if (leg && leg.duration && leg.duration.text) {
            setEta(leg.duration.text);
          } else {
            setEta("ETA not available");
            console.warn("No duration info found in leg:", leg);
          }
        }
      } catch (error: any) {
        console.error("Error fetching directions:", error);
        Alert.alert("Directions Error", error.message);
      }
    };

    fetchDirections();
  }, [isGoogleLoaded, currentLocation, sellerLocation, buyerLocation]);

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBaAUy-Z9j0yy_wWpv8XW_8VOHXupwLKzs"}
      onLoad={() => setIsGoogleLoaded(true)}
    >
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={currentLocation}
        zoom={15}
        options={defaultOptions}
      >
        {currentLocation?.lat && <Marker position={currentLocation} label="You" />}
        {sellerLocation?.lat && <Marker position={sellerLocation} label="Seller" />}
        {buyerLocation?.lat && <Marker position={buyerLocation} label="Buyer" />}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
      <View style={styles.infoContainer}>
        <Text style={styles.etaText}>ETA: {eta}</Text>
      </View>
    </LoadScript>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  etaText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#085A2D",
  },
});

export default LiveMapWeb;
