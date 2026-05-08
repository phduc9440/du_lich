import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix lỗi icon bị mất khi dùng với webpack/Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
interface MapViewProps {
    position : {
        latidute: number,
        longidute: number
    }
}
const MapView:React.FC<MapViewProps> = ({position}) => {
  return (
    <MapContainer center={[position.latidute, position.longidute]} zoom={13} style={{ height: '400px', width: '100%' }}
        // dragging={false}            // tắt kéo
        // zoomControl={false}         // tắt nút zoom (+/-)
        // scrollWheelZoom={false}     // tắt zoom bằng chuột
        // doubleClickZoom={false}     // tắt zoom bằng double-click
        // touchZoom={false}           // tắt zoom bằng chạm
        // keyboard={false}            // tắt điều khiển bằng bàn phím
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/" target="_blank">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[position.latidute, position.longidute]}>
      </Marker>
    </MapContainer>
  );
};

export default MapView;
