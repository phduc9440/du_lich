import { Typography } from "antd";
import MapView from "../MapView";

const LocationTab = ({ data }) => {
  return (
    <>
      <Typography.Title level={3}>Vị trí</Typography.Title>
      <div className="w-full h-[400px] bg-gray-200">
        <MapView position={{latidute: data.latitude, longidute: data.longitude}}/>
      </div>
    </>
  );
};

export default LocationTab;
