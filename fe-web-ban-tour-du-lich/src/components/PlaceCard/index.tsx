import React from "react";
import { Card, Image } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

interface PlaceCardProps {
  title: string;
  destination: string;
  main_image: string;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ title, destination, main_image }) => {
  return (
    <Card
      hoverable
      className="w-[250px] h-[320px] overflow-hidden rounded-lg transition-transform duration-300 ease-in-out hover:scale-105"
      styles={{
        body: {
          padding: 0,
        },
      }}
      cover={
        <div className="relative w-full h-[320px]">
          <Image
            src={main_image}
            alt={title}
            height={"100%"}
            width={"100%"}
            className="object-cover"
          />
          <div
            className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 text-white p-4"
          >
            <p className="m-0 text-sm">
              <EnvironmentOutlined /> {destination}
            </p>
          </div>
        </div>
      }
    />
  );
};

export default PlaceCard;
