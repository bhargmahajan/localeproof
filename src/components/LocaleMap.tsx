"use client";

import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface LocaleMapProps {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void;
  routeGeoJson?: any;
  destinationCoords?: { lat: number; lng: number } | null;
  destinationName?: string;
}

export default function LocaleMap({
  lat,
  lng,
  onLocationSelect,
  routeGeoJson,
  destinationCoords,
  destinationName,
}: LocaleMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerInstance = useRef<maplibregl.Marker | null>(null);
  const destMarkerInstance = useRef<maplibregl.Marker | null>(null);

  const loadIsochrones = async (targetLat: number, targetLng: number, map: maplibregl.Map) => {
    try {
      const res = await fetch(`/api/isochrone?lat=${targetLat}&lng=${targetLng}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load isochrones");

      const sourceId = "isochrones-source";
      const layerId = "isochrones-layer";

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(json.data);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: json.data,
        });

        map.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          layout: {},
          paint: {
            "fill-color": [
              "match",
              ["get", "value"],
              300, "#22c55e", // 5 min walk: Green
              600, "#3b82f6", // 10 min walk: Blue
              900, "#eab308", // 15 min walk: Yellow
              "#94a3b8",
            ],
            "fill-opacity": 0.3,
            "fill-outline-color": "#ffffff",
          },
        });
      }
    } catch (err) {
      console.error("Error fetching pedestrian isochrones:", err);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19,
            attribution: "&copy; OpenStreetMap Contributors",
          },
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [lng, lat],
      zoom: 14,
      maxZoom: 19,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const marker = new maplibregl.Marker({ color: "#2563eb", draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);

    map.on("load", () => {
      loadIsochrones(lat, lng, map);
    });

    marker.on("dragend", () => {
      const pos = marker.getLngLat();
      const newLat = Number(pos.lat.toFixed(5));
      const newLng = Number(pos.lng.toFixed(5));
      onLocationSelect(newLat, newLng);
      loadIsochrones(newLat, newLng, map);
    });

    map.on("click", (e) => {
      const clickedLat = Number(e.lngLat.lat.toFixed(5));
      const clickedLng = Number(e.lngLat.lng.toFixed(5));
      marker.setLngLat([clickedLng, clickedLat]);
      onLocationSelect(clickedLat, clickedLng);
      loadIsochrones(clickedLat, clickedLng, map);
    });

    mapInstance.current = map;
    markerInstance.current = marker;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Draw or clear the verified walking route and red destination pin
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;

    const routeSourceId = "commute-route-source";
    const routeLayerId = "commute-route-layer";

    if (destMarkerInstance.current) {
      destMarkerInstance.current.remove();
      destMarkerInstance.current = null;
    }

    if (routeGeoJson && destinationCoords) {
      const featureData: any = {
        type: "Feature",
        geometry: routeGeoJson,
      };

      if (map.getSource(routeSourceId)) {
        (map.getSource(routeSourceId) as maplibregl.GeoJSONSource).setData(featureData);
      } else {
        map.addSource(routeSourceId, {
          type: "geojson",
          data: featureData,
        });

        map.addLayer({
          id: routeLayerId,
          type: "line",
          source: routeSourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#ef4444",
            "line-width": 4,
            "line-dasharray": [2, 1],
          },
        });
      }

      const popup = new maplibregl.Popup({ offset: 25 }).setText(
        destinationName || "Nearest Service"
      );

      destMarkerInstance.current = new maplibregl.Marker({ color: "#ef4444" })
        .setLngLat([destinationCoords.lng, destinationCoords.lat])
        .setPopup(popup)
        .addTo(map);

      destMarkerInstance.current.togglePopup();
    } else if (map.getSource(routeSourceId)) {
      (map.getSource(routeSourceId) as maplibregl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [routeGeoJson, destinationCoords, destinationName]);

  // Add this effect to make the map fly to new coordinates when searched
  useEffect(() => {
    if (mapInstance.current && markerInstance.current) {
      // Only fly if the map's current center is different from the new props
      const currentCenter = mapInstance.current.getCenter();
      if (Math.abs(currentCenter.lat - lat) > 0.0001 || Math.abs(currentCenter.lng - lng) > 0.0001) {
        mapInstance.current.flyTo({ center: [lng, lat], zoom: 14, speed: 1.5 });
        markerInstance.current.setLngLat([lng, lat]);
      }
    }
  }, [lat, lng]);


  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800 shadow-lg">
      <div ref={mapContainer} className="w-full h-full min-h-[550px]" />
    </div>
  );
}