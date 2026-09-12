import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { Lake } from "../types";
import { riskColor } from "./RiskBadge";

export default function RiskMap({ lakes, height = "480px" }: { lakes: Lake[]; height?: string }) {
  const navigate = useNavigate();
  const center: [number, number] = [17.42, 78.42];

  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-panelBorder">
      <MapContainer center={center} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        />
        {lakes.map((lake) => (
          <CircleMarker
            key={lake._id}
            center={[lake.location.lat, lake.location.lng]}
            radius={12 + lake.latest.overallRisk / 8}
            pathOptions={{
              color: riskColor(lake.latest.riskBand),
              fillColor: riskColor(lake.latest.riskBand),
              fillOpacity: 0.55,
              weight: 2,
            }}
            eventHandlers={{ click: () => navigate(`/lakes/${lake._id}`) }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <div className="font-medium">{lake.name}</div>
              <div>Risk: {lake.latest.overallRisk}/100 · {lake.latest.riskBand}</div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
