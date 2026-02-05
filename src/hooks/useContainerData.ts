import { useState, useEffect, useCallback } from "react";
import { containerCli } from "../services/container-cli.js";
import type { Container, Image, Network, Volume } from "../types/index.js";

interface UseContainerDataResult {
  containers: Container[];
  images: Image[];
  networks: Network[];
  volumes: Volume[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useContainerData(refreshInterval = 5000): UseContainerDataResult {
  const [containers, setContainers] = useState<Container[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [containerList, imageList, networkList, volumeList] = await Promise.all([
        containerCli.listContainers(true).catch(() => []),
        containerCli.listImages().catch(() => []),
        containerCli.listNetworks().catch(() => []),
        containerCli.listVolumes().catch(() => []),
      ]);

      setContainers(containerList);
      setImages(imageList);
      setNetworks(networkList);
      setVolumes(volumeList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refresh, refreshInterval]);

  return {
    containers,
    images,
    networks,
    volumes,
    loading,
    error,
    refresh,
  };
}
