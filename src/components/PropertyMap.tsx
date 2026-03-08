import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapProperty {
  id: string;
  name: string;
  city: string;
  lat?: number;
  lng?: number;
}

// Approximate coordinates for major Indian cities
const cityCoords: Record<string, [number, number]> = {
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  delhi: [28.7041, 77.1025],
  "new delhi": [28.6139, 77.209],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  nagpur: [21.1458, 79.0882],
  nashik: [19.9975, 73.7898],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  indore: [22.7196, 75.8577],
  gurgaon: [28.4595, 77.0266],
  noida: [28.5355, 77.391],
  thane: [19.2183, 72.9781],
};

const getCityCoords = (city: string): [number, number] | null => {
  const key = city.toLowerCase().trim();
  return cityCoords[key] || null;
};

const PropertyMap = ({ properties }: { properties: MapProperty[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const bounds: L.LatLngBoundsExpression = [];

    properties.forEach(p => {
      const coords = getCityCoords(p.city);
      if (!coords) return;
      // Add small random offset to prevent overlap
      const lat = coords[0] + (Math.random() - 0.5) * 0.02;
      const lng = coords[1] + (Math.random() - 0.5) * 0.02;
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<strong>${p.name}</strong><br/>${p.city}`);
      (bounds as [number, number][]).push([lat, lng]);
    });

    if ((bounds as any[]).length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50], maxZoom: 12 });
    }
  }, [properties]);

  return <div ref={mapRef} className="w-full h-[400px] rounded-lg border border-border z-0" />;
};

export default PropertyMap;
