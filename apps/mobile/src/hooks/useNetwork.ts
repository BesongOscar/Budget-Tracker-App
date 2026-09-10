import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      const connected =
        state.isConnected !== null &&
        state.isConnected !== false &&
        state.isInternetReachable !== false;
      setIsConnected(connected);
    });
    return () => unsub();
  }, []);

  // null until first event → treat as connected to avoid a banner flash.
  return {
    isConnected: isConnected === false ? false : true,
    isOffline: isConnected === false,
  };
}
