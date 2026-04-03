import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  return isSignedIn ? (
    <Redirect href="/(app)/(tabs)/home" />
  ) : (
    <Redirect href="/(auth)/onboarding" />
  );
}
