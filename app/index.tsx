import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      // Update path based on new folder structure
      setInitialRoute(userData ? '/(app)/(tabs)/medicines' : '/auth/SignIn');
    } catch (error) {
      console.error('Error checking auth status:', error);
      setInitialRoute('/auth/SignIn');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#192f6a" />
      </View>
    );
  }
  if (!initialRoute) {
    return null;
  }

  return <Redirect href={{ pathname: initialRoute as any, params: {} }} />;

}