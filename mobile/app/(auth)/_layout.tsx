import { Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  // Si ya está autenticado, no tiene sentido mostrar auth screens
  if (isSignedIn) return <Redirect href="/(app)/(tabs)/home" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
  );
}
