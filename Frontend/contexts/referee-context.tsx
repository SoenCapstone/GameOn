import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  ReactNode,
  useMemo,
  useState,
} from "react";
import {
  useAxiosWithClerk,
  GO_REFEREE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { log } from "@/utils/logger";
import { useAuth } from "@clerk/clerk-expo";

type RefereeContextValue = {
  isReferee: boolean | null;
  isActive: boolean | null;
  sports: string[];
  regions: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  registerAsReferee: () => Promise<void>;
  toggleRefereeStatus: () => Promise<void>;
  saveSports: (nextSports: string[]) => Promise<void>;
  saveRegions: (nextRegions: string[]) => Promise<void>;
};

const RefereeContext = createContext<RefereeContextValue | undefined>(
  undefined,
);

type RefereeProviderProps = {
  readonly children: ReactNode;
};

export function RefereeProvider({ children }: Readonly<RefereeProviderProps>) {
  const { isLoaded, isSignedIn } = useAuth();
  const axios = useAxiosWithClerk();

  const [isReferee, setIsReferee] = useState<boolean | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [sports, setSports] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(
    async (shouldFetch: boolean) => {
      if (!shouldFetch) return;
      try {
        const response = await axios.get(GO_REFEREE_SERVICE_ROUTES.PROFILE);
        setSports(response.data.sports || []);
        setRegions(response.data.allowedRegions || []);
      } catch (err) {
        log.error("Failed to load referee preferences:", err);
      }
    },
    [axios],
  );

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(GO_REFEREE_SERVICE_ROUTES.STATUS);

      const statusIsReferee = !!response.data.isReferee;

      setIsReferee(statusIsReferee);
      setIsActive(response.data.isActive ?? false);

      await fetchProfile(statusIsReferee);
    } catch (err) {
      log.error("Error checking referee status:", err);
      setError("Failed to load referee status");

      setIsReferee((prev) => (prev === null ? false : prev));
      setIsActive((prev) => (prev === null ? false : prev));
    } finally {
      setLoading(false);
    }
  }, [axios, fetchProfile]);

  const fetchStatusRef = useRef(fetchStatus);
  fetchStatusRef.current = fetchStatus;

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    fetchStatusRef.current().catch((error) => {
      log.error("Failed to fetch referee status", error);
    });
  }, [isLoaded, isSignedIn]);

  const registerAsReferee = useCallback(async () => {
    try {
      await axios.post(GO_REFEREE_SERVICE_ROUTES.REGISTER, {
        isActive: true,
      });

      setIsReferee(true);
      setIsActive(true);
      await fetchProfile(true);
    } catch (err) {
      log.error("Error registering referee:", err);
      throw err;
    }
  }, [axios, fetchProfile]);

  const saveSports = useCallback(
    async (nextSports: string[]) => {
      await axios.put(GO_REFEREE_SERVICE_ROUTES.UPDATE_SPORTS, {
        sports: nextSports,
      });
      setSports(nextSports);
    },
    [axios],
  );

  const saveRegions = useCallback(
    async (nextRegions: string[]) => {
      await axios.put(GO_REFEREE_SERVICE_ROUTES.UPDATE_REGIONS, {
        allowedRegions: nextRegions,
      });
      setRegions(nextRegions);
    },
    [axios],
  );

  const toggleRefereeStatus = useCallback(async () => {
    if (isActive === null) return;

    try {
      const newStatus = !isActive;

      await axios.put(GO_REFEREE_SERVICE_ROUTES.STATUS, {
        isActive: newStatus,
      });

      setIsActive(newStatus);
    } catch (err) {
      log.error("Error updating referee status:", err);
      throw err;
    }
  }, [axios, isActive]);

  const value = useMemo<RefereeContextValue>(
    () => ({
      isReferee,
      isActive,
      sports,
      regions,
      loading,
      error,
      refresh: fetchStatus,
      registerAsReferee,
      toggleRefereeStatus,
      saveSports,
      saveRegions,
    }),
    [
      isReferee,
      isActive,
      sports,
      regions,
      loading,
      error,
      fetchStatus,
      registerAsReferee,
      toggleRefereeStatus,
      saveSports,
      saveRegions,
    ],
  );

  return (
    <RefereeContext.Provider value={value}>{children}</RefereeContext.Provider>
  );
}

export function useReferee() {
  const ctx = useContext(RefereeContext);
  if (!ctx) throw new Error("useReferee must be used within RefereeProvider");
  return ctx;
}
