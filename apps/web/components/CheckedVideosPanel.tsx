"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, MapPin, Tag, ExternalLink } from "lucide-react";
import { usePlacesByVideos } from "@/hooks/usePlacesByVideo";
import { googleMapsUrl } from "@/lib/googleMaps";
import type { VideoDTO } from "@/lib/dto";

interface CheckedVideosPanelProps {
  videos: VideoDTO[];
  selectedVideos: string[];
  onClose: () => void;
}

export function CheckedVideosPanel({ videos, selectedVideos, onClose }: CheckedVideosPanelProps) {
  const checkedVideos = videos.filter((video) => selectedVideos.includes(video.id));
  const placesResults = usePlacesByVideos(checkedVideos.map((v) => v.id));

  const videoPlaces = checkedVideos.map((video, index) => ({
    video,
    places: placesResults[index]?.data ?? [],
  }));
  const totalLocations = videoPlaces.reduce((sum, v) => sum + v.places.length, 0);

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col animate-in slide-in-from-left duration-300">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Checked Videos</h2>
          <p className="text-sm text-gray-500">
            {checkedVideos.length} video{checkedVideos.length !== 1 ? "s" : ""} • {totalLocations} location
            {totalLocations !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {checkedVideos.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm">No videos selected</p>
              <p className="text-gray-400 text-xs mt-1">Check videos from History to see their locations</p>
            </div>
          ) : (
            videoPlaces.map(({ video, places }, videoIndex) => (
              <div key={video.id}>
                {videoIndex > 0 && (
                  <div className="relative my-6">
                    <Separator />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white px-3 text-xs font-medium text-gray-500 max-w-[250px] truncate">
                        {video.title ?? video.url}
                      </div>
                    </div>
                  </div>
                )}

                {videoIndex === 0 && videoPlaces.length > 1 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-gray-500 truncate">{video.title ?? video.url}</h3>
                  </div>
                )}

                <div className="space-y-3">
                  {places.map((place) => (
                    <a
                      key={place.id}
                      href={googleMapsUrl(place)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <MapPin className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{place.name}</h4>
                        {place.category && (
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Tag className="w-3 h-3" />
                            <span>{place.category}</span>
                          </div>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 mt-1 text-gray-300 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
