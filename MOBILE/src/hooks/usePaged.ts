import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../state/AppContext";
import { items } from "../lib/api";
export function usePaged<T = any>(path: string) {
  const { api } = useApp();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const page = useRef(0);
  const inFlight = useRef(false);
  const generation = useRef(0);
  const load = useCallback(
    async (reset = true) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(true);
      setError("");
      const epoch = generation.current;
      const next = reset ? 1 : page.current + 1;
      try {
        const result = await api<any>(
          `${path}${path.includes("?") ? "&" : "?"}pageNumber=${next}&pageSize=20`,
        );
        if (epoch !== generation.current) return;
        const rows = items<T>(result);
        setData((prev) => (reset ? rows : [...prev, ...rows]));
        page.current = next;
        setMore(!Array.isArray(result) && next < (result.totalPages || 1));
      } catch (e) {
        if (epoch === generation.current) setError((e as Error).message);
      } finally {
        if (epoch === generation.current) {
          setLoading(false);
          inFlight.current = false;
        }
      }
    },
    [api, path],
  );
  useFocusEffect(
    useCallback(() => {
      generation.current++;
      inFlight.current = false;
      page.current = 0;
      setMore(false);
      setData([]);
      load(true);
      return () => {
        generation.current++;
        inFlight.current = false;
      };
    }, [load]),
  );
  return {
    data,
    loading,
    error,
    more,
    reload: () => load(true),
    loadMore: () => {
      if (more) load(false);
    },
  };
}
