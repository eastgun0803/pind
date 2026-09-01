import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import type { MyMapDTO } from "@/lib/dto";
import { supabase } from "@/lib/supabase";

type CollectionPlaceRow = { collection_id: string; place_id: string; position: number };

export interface MyMapWithPlaceIds extends MyMapDTO {
  placeIds: string[];
}

export function useMyMaps() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const collectionsQuery = useQuery<MyMapDTO[]>({
    queryKey: ["my-maps", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MyMapDTO[];
    },
    enabled: !!user,
  });

  const placesQuery = useQuery<CollectionPlaceRow[]>({
    queryKey: ["my-maps-places", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_places")
        .select("collection_id, place_id, position")
        .in("collection_id", (collectionsQuery.data ?? []).map((c) => c.id))
        .order("position", { ascending: true });
      if (error) throw error;
      return data as CollectionPlaceRow[];
    },
    enabled: !!user && (collectionsQuery.data?.length ?? 0) > 0,
  });

  const myMaps: MyMapWithPlaceIds[] = (collectionsQuery.data ?? []).map((c) => ({
    ...c,
    placeIds: (placesQuery.data ?? [])
      .filter((row) => row.collection_id === c.id)
      .map((row) => row.place_id),
  }));

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["my-maps", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["my-maps-places", user?.id] }),
    ]);

  const createMap = async (name: string, emoji = "🗺️"): Promise<string> => {
    const { data, error } = await supabase
      .from("collections")
      .insert({ user_id: user!.id, name, emoji })
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error("컬렉션 생성 실패");
    await invalidate();
    return (data as { id: string }).id;
  };

  const addPlacesToMap = async (mapId: string, placeIds: string[]) => {
    const existing = (placesQuery.data ?? [])
      .filter((row) => row.collection_id === mapId)
      .map((row) => row.place_id);
    const startPosition = existing.length;
    const rows = placeIds
      .filter((id) => !existing.includes(id))
      .map((placeId, i) => ({ collection_id: mapId, place_id: placeId, position: startPosition + i }));
    if (rows.length === 0) return;
    const { error } = await supabase.from("collection_places").insert(rows);
    if (error) throw error;
    await invalidate();
  };

  const reorderMap = async (mapId: string, orderedPlaceIds: string[]) => {
    await Promise.all(
      orderedPlaceIds.map((placeId, position) =>
        supabase
          .from("collection_places")
          .update({ position })
          .eq("collection_id", mapId)
          .eq("place_id", placeId),
      ),
    );
    await invalidate();
  };

  return {
    myMaps,
    isLoading: collectionsQuery.isLoading,
    createMap,
    addPlacesToMap,
    reorderMap,
  };
}
