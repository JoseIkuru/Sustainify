import { View, Text, TextInput, StyleSheet } from "react-native";

const InputField = ({ label, secureTextEntry = false, ...props }) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput 
          style={styles.input}
          secureTextEntry={secureTextEntry}
          {...props}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginVertical: 8,
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  inputWrapper: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 15,
    height: 50,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
});

export default InputField;
