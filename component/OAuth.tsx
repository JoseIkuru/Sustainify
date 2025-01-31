import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const OAuth = () => {
  return (
    <View>
      <View style={styles.separatorContainer}>
        <View style={styles.separator} />
        <Text style={styles.orText}>Or</Text>
        <View style={styles.separator} />
      </View>
      <View>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Login with Google</Text>
    </TouchableOpacity>
    </View>
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4, // Adjust as needed
    gap: 3, // Adjust gap between the elements
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0', // Replace with your bg-general-100 color
  },
  orText: {
    fontSize: 18,
    color: '#333', // Adjust color as needed
    fontWeight: '600',
  },
  button: {
    marginTop: 10,
    backgroundColor: "#085A2D",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "90%",
  },
  buttonText: {
    marginTop: 20, // Adds some space above the text
    fontSize: 16,
    color: 'white', // Adjust to your desired color
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OAuth;
