import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { toast } from "@/components/sign-up/utils"; 

export function useUpsertUser() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  return useMutation({
    retry: 3,    
    retryDelay: 400,
    mutationFn: async (payload) => {
      if (!isLoaded || !isSignedIn) {
        throw new Error("Clerk is not loaded or user is not signed in");
      }

      const url = `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/user/create`;
      const token = await getToken();

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed with ${res.status}: ${text}`);
      }

      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      toast("Profile created successfully!");
    },
    onError: () => toast("Error while creating profile!")
  });
}
