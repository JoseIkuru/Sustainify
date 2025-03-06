import fetch from 'node-fetch';

// Helper function: Geocode an address using Google Geocoding API
const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number }> => {
  const googleMapsAPIKey = "AIzaSyBaAUy-Z9j0yy_wWpv8XW_8VOHXupwLKzs"; // Ensure this API key is enabled for Geocoding
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsAPIKey}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status === "OK" && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return { latitude: location.lat, longitude: location.lng };
  }
  throw new Error("Unable to geocode address: " + address);
};

// Helper function: Calculate distance using the Haversine formula (returns miles)
const haversineDistance = (
  coords1: { latitude: number; longitude: number },
  coords2: { latitude: number; longitude: number }
): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const lat1 = coords1.latitude;
  const lon1 = coords1.longitude;
  const lat2 = coords2.latitude;
  const lon2 = coords2.longitude;
  const R = 6371; // Radius of the earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInKm = R * c; // Distance in km
  return distanceInKm * 0.621371; // Convert km to miles
};

export async function POST(request: Request) {
  try {
    const { buyerLocation, sellerLocation } = await request.json();
    console.log("Received buyerLocation:", buyerLocation, "sellerLocation:", sellerLocation);
    
    if (!buyerLocation || !sellerLocation) {
      return new Response(JSON.stringify({ error: "Missing buyerLocation or sellerLocation" }), { status: 400 });
    }

    // Geocode both addresses
    const buyerCoords = await geocodeAddress(buyerLocation);
    const sellerCoords = await geocodeAddress(sellerLocation);

    // Calculate the straight-line (great-circle) distance in miles
    const totalMiles = haversineDistance(buyerCoords, sellerCoords);
    console.log("Calculated totalMiles:", totalMiles);

    return new Response(JSON.stringify({ totalMiles }), { status: 200 });
  } catch (error: any) {
    console.error("Error calculating distance:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
