import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { Picker } from "@react-native-picker/picker";
import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from "expo-router";
import InputField from "@/component/InputField";
import OAuth from "@/component/OAuth";
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "", 
  });

  // Debugging useEffect to track state changes
  useEffect(() => {
    console.log("Updated form state:", form);
  }, [form]);

  // Handle the submission of the sign-in form
  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    console.log("Final form state before sign-in:", form); // Debugging log

    if (!form.role) {
      console.error("Role is not selected before signing in!");
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      console.log("Form role before sign-in:", form.role);

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        await AsyncStorage.setItem("userRole", form.role);
        console.log("Role saved successfully:", form.role);

        setTimeout(async () => {
          const savedRole = await AsyncStorage.getItem("userRole");
          console.log("Retrieved role from storage:", savedRole);
          router.push("/");
        }, 1000);
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, form]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <SafeAreaView style={styles.container}>
        <Text style={styles.welcomeText}>WELCOME TO SUSTAINIFY</Text>
        <Text style={styles.createText}>Login To Your Account</Text>
      </SafeAreaView>

      {/* Form Inputs */}
      <View style={styles.formContainer}>
        <InputField
          label="Email"
          placeholder="Enter your email"
          value={form.email}
          onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
        />
        <InputField
          label="Password"
          placeholder="Enter your password"
          secureTextEntry={true}
          value={form.password}
          onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
        />

        {/* Role Selection Dropdown */}
        <Text style={styles.label}>Select Role</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.role}
            onValueChange={(value) => {
              console.log("Role selected:", value); // Debugging log
              setForm((prev) => ({ ...prev, role: value }));
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select Role" value="" />
            <Picker.Item label="Buyer" value="buyer" />
            <Picker.Item label="Transporter" value="transporter" />
            <Picker.Item label="Seller" value="seller" />
          </Picker>
        </View>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity style={styles.button} onPress={onSignInPress}>
        <Text style={styles.buttonText}>Sign in</Text>
      </TouchableOpacity>

      <OAuth />

      {/* Link to Sign Up */}
      <View style={styles.contain}>
        <Text style={styles.text}>Don't have an account? </Text>
        <Link href="/sign-up" style={styles.linkText}>Sign Up</Link>
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  contain: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: "#AAA",
  },
  linkText: {
    fontSize: 16,
    color: "#085A2D",
    fontWeight: "600",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  container: {
    alignItems: "center",
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#085A2D",
    paddingBottom: 10,
    textAlign: "center",
  },
  createText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
    textAlign: "center",
    paddingBottom: 15,
  },
  formContainer: {
    width: "90%",
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  pickerWrapper: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#085A2D",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    width: "90%",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SignIn;
