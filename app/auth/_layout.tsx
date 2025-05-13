import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#161D29',
          paddingTop: '8%',
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SignIn" />
      <Stack.Screen name="SignUp" />
    </Stack>
  );
}
