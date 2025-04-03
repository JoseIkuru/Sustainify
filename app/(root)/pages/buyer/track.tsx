import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/fetch'; // Your fetch helper that calls your API

const Track = ({ orderId }) => {
  const [statusUpdates, setStatusUpdates] = useState<{ id: string; status_message: string; status_time: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatusUpdates = async () => {
      try {
        const response = await fetchAPI('/(api)/get-status-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId: orderId }),
        });

        const data = await response;

        if (data.error) {
          setError(data.error);
        } else {
          setStatusUpdates(data.data);
        }
      } catch (err) {
        console.error("Error fetching tracking data:", err);
        setError("Error fetching tracking data");
      }
    };

    if (orderId) {
      fetchStatusUpdates();
    }
  }, [orderId]);

  return (
    <View style={styles.container}>
      <Text>Tracking Order ID: {orderId}</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {statusUpdates.length > 0 ? (
        <View>
          {statusUpdates.map((update) => (
            <View key={update.id} style={styles.statusUpdate}>
              <Text>{update.status_message}</Text>
              <Text>{new Date(update.status_time).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      ) : (
        !error && <Text>No status updates found for this order.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  statusUpdate: {
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default Track;
