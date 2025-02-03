import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from "expo-router";  // Updated import from expo-router
import InputField from "@/component/InputField";  // Assuming this is a custom component
import OAuth from "@/component/OAuth";
import React from 'react'

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "",
  });

// Handle the submission of the sign-in form
const onSignInPress = React.useCallback(async () => {
  if (!isLoaded) return

  // Start the sign-in process using the email and password provided
  try {
    const signInAttempt = await signIn.create({
      identifier:form.email,
      password: form.password,
    })

    // If sign-in process is complete, set the created session as active
    // and redirect the user
    if (signInAttempt.status === 'complete') {
      await setActive({ session: signInAttempt.createdSessionId })
      router.replace('/')
    } else {
      // If the status isn't complete, check why. User might need to
      // complete further steps.
      console.error(JSON.stringify(signInAttempt, null, 2))
    }
  } catch (err) {
    // See https://clerk.com/docs/custom-flows/error-handling
    // for more info on error handling
    console.error(JSON.stringify(err, null, 2))
  }
}, [isLoaded, form.email, form.password])

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
          onChangeText={(value) => setForm({ ...form, email: value })}
        />
        <InputField
          label="Password"
          placeholder="Enter your password"
          secureTextEntry={true}
          value={form.password}
          onChangeText={(value) => setForm({ ...form, password: value })}
        />

        {/* Role Selection Dropdown */}
        <Text style={styles.label}>Select Role</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.role}
            onValueChange={(value) => setForm({ ...form, role: value })}
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

      <OAuth/>

      {/* Link to Sign In */}
      <View style={styles.contain}>
        <Text style={styles.text}>Don't have an account? </Text>
        <Link href="/sign-up" style={styles.linkText}>Sign Up</Link> {/* Fixed Link */}
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
    color: "#AAA", // Adjust color to match text-general-200
  },
  linkText: {
    fontSize: 16,
    color: "#085A2D", // Adjust color to match text-primary-500
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
