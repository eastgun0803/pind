import type { PlaceDTO } from "@/lib/dto";

export function googleMapsUrl(place: PlaceDTO): string {
  if (place.google_place_id) {
    return `https://www.google.com/maps/place/?q=place_id:${place.google_place_id}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
}
