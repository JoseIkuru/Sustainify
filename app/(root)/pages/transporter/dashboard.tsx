import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { Text, View, Button } from 'react-native';

const TransporterDashboard = () => {
  const { user } = useUser()
  const { signOut } = useAuth(); // Use useAuth for signing out
  return (
    <View>
      <SignedIn>
        <Text>Hello {user?.emailAddresses[0].emailAddress} welcome to Transporter dashboard</Text>
        <Button title="Sign Out" onPress={() => signOut()} />
      </SignedIn>
      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text>Sign in</Text>
        </Link>
        <Link href="/(auth)/sign-up">
          <Text>Sign up</Text>
        </Link>
      </SignedOut>
    </View>
  );
};

export default TransporterDashboard;
