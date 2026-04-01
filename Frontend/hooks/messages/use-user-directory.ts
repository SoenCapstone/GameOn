import { fetchUserDirectory } from "@/hooks/messages/api";
import { messagingKeys, type UserDirectoryEntry } from "@/constants/messaging";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

export function useUserDirectory() {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  return useQuery<UserDirectoryEntry[]>({
    queryKey: messagingKeys.userDirectory(userId),
    queryFn: () => fetchUserDirectory(api),
    staleTime: 60_000,
    refetchOnMount: false,
    enabled: Boolean(userId),
  });
}
