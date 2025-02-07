import { Redirect } from "expo-router";
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  const { isSignedIn } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Added error state for error handling

  useEffect(() => {
    const fetchRole = async () => {
      try {
        console.log('Fetching role from AsyncStorage...');
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole) {
          console.log('Role fetched successfully:', storedRole);
          setRole(storedRole);
        } else {
          console.log('No role found in AsyncStorage');
          setError('No role found. Please select a role.');
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setError('Error fetching role');
      } finally {
        setLoading(false);  // Set loading to false after role fetch attempt
      }
    };

    if (isSignedIn) {
      fetchRole();
    } else {
      console.log('User is not signed in');
      setLoading(false);  // Set loading to false if not signed in
    }
  }, [isSignedIn]);

  // Loading state
  if (loading) {
    return <Text>Loading...</Text>;
  }

  // Error handling
  if (error) {
    return <Text>{error}</Text>;
  }

  if(isSignedIn){
    console.log("We are signed in")
    console.log(role)
  }
  else{
    console.log("We are not")
  }

  // Redirect based on role
  if (isSignedIn && role) {
    console.log('User signed in with role:', role); // Log role for debugging
    switch (role) {
      case 'buyer':
      return <Redirect href="/(root)/pages/buyer/dashboard" />;
      case 'transporter':
        return <Redirect href="/(root)/pages/transporter/dashboard" />;
      case 'seller':
        return <Redirect href="/(root)/pages/seller/dashboard" />;
      default:
        console.log('Role not recognized:', role);
        return <Text>Invalid role. Please select a valid role.</Text>;
    }

    
    
  }

  

  // If not signed in or role is missing, redirect to welcome page
  return <Redirect href="/(auth)/welcome" />;
};

export default Home;
