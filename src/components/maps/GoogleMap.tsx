import { useCallback, useEffect, useMemo, useState } from "react";
import { useJsApiLoader, GoogleMap, Marker, Circle } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { config } from "@/config";
import { themeColor } from "@/utils/helpers";

export interface LatLng {
  lat: number;
  lng: number;
}

interface GoogleMapProps {
  center: LatLng;
  radiusMeters?: number;
  label?: string;
  onSelect?: (position: LatLng) => void;
  height?: number;
}

const CONTAINER_STYLE = { width: "100%" } as const;

export default function GoogleMapView({
  center,
  radiusMeters,
  label,
  onSelect,
  height = 280,
}: GoogleMapProps) {
  const hasKey = Boolean(config.googleMapsApiKey);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: config.googleMapsApiKey,
    libraries: ["places"],
  });

  const [position, setPosition] = useState<LatLng>(center);

  useEffect(() => {
    setPosition(center);
  }, [center.lat, center.lng]);

  const handleClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!onSelect) return;
      const lat = event.latLng?.lat();
      const lng = event.latLng?.lng();
      if (lat !== undefined && lng !== undefined) {
        const next = { lat, lng };
        setPosition(next);
        onSelect(next);
      }
    },
    [onSelect]
  );

  const mapOptions = useMemo(
    () =>
      ({
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "cooperative",
      }) as google.maps.MapOptions,
    []
  );

  const circleOptions = useMemo(
    () =>
      ({
        strokeColor: themeColor("--primary"),
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: themeColor("--primary"),
        fillOpacity: 0.15,
      }) as google.maps.CircleOptions,
    []
  );

  if (!hasKey || loadError || !isLoaded || typeof google === "undefined") {
    return (
      <div
        style={{ height }}
        className="w-full rounded-xl border border-dashed border-app flex flex-col items-center justify-center gap-2 bg-surface-muted/40 p-4 text-center"
      >
        <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm font-medium text-app">
          {!hasKey
            ? "Interactive map unavailable"
            : loadError
              ? "Couldn't load Google Maps"
              : "Loading map…"}
        </p>
        <p className="text-xs text-app-muted">
          {label ?? "Office location"}
          {" · "}
          {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
          {radiusMeters ? ` · ${radiusMeters}m radius` : ""}
        </p>
        {!hasKey && (
          <p className="text-[11px] text-app-muted">
            Set <code className="text-primary">VITE_GOOGLE_MAPS_API_KEY</code> to enable the
            interactive map.
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-app">
      <GoogleMap
        mapContainerStyle={{ ...CONTAINER_STYLE, height }}
        center={position}
        zoom={15}
        options={mapOptions}
        onClick={handleClick}
      >
        {onSelect && <Circle center={position} radius={8} options={{ strokeColor: themeColor("--text"), strokeWeight: 1 }} />}
        <Marker position={position} />
        {radiusMeters !== undefined && radiusMeters > 0 && (
          <Circle center={position} radius={radiusMeters} options={circleOptions} />
        )}
      </GoogleMap>
    </div>
  );
}