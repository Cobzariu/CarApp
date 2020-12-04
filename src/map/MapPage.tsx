import { IonContent, IonPage } from "@ionic/react";
import React from "react";
import { useMyLocation } from "../utils/useMyLocation";
import { MyMap } from "./MyMap";
const MapPage: React.FC = () => {
  const myLocation = useMyLocation();
  const { latitude: lat, longitude: lng } = myLocation.position?.coords || {};
  return (
    <IonPage>
      <IonContent fullscreen>
        <div>My Location is</div>
        <div>Latitude: {lat}</div>
        <div>Longitude: {lng}</div>
        {lat && lng && (
          <MyMap
            lat={lat}
            lng={lng}
            onMapClick={log("onMap")}
            onMarkerClick={log("onMarker")}
          />
        )}
      </IonContent>
    </IonPage>
  );

  function log(source: string) {
    return (e: any) => console.log(source, e.latLng.lat(), e.latLng.lng());
  }
};

export default MapPage;
