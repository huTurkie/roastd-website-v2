import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to onboarding screen immediately
    router.replace('/onboarding');
  }, []);

  return null;
}
