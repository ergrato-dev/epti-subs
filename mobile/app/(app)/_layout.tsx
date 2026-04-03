import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  // Guard: redirige a auth si no hay sesión activa
  if (!isSignedIn) return <Redirect href="/(auth)/onboarding" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
