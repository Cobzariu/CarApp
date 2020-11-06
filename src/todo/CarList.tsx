import React, { useContext } from "react";
import { RouteComponentProps } from "react-router";
import { Redirect } from 'react-router-dom';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton
} from "@ionic/react";
import { add } from "ionicons/icons";
import Item from "./Car";
import { getLogger } from "../core";
import { CarContext } from "./CarProvider";
import { AuthContext } from '../auth';

const log = getLogger("ItemList");

const CarList: React.FC<RouteComponentProps> = ({ history }) => {
  const { items, fetching, fetchingError } = useContext(CarContext);
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    logout?.();
    return <Redirect to={{ pathname: '/login' }} />
  };
  log("render");
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Car List</IonTitle>
        </IonToolbar>
        <IonButton onClick={handleLogout}>Logout</IonButton>
      </IonHeader>
      <IonContent>
        <IonLoading isOpen={fetching} message="Fetching items" />
        {items && (
          <IonList>
            {items.map(({ _id, name, horsepower, automatic, releaseDate }) => (
              <Item
                key={_id}
                _id={_id}
                name={name}
                horsepower={horsepower}
                automatic={automatic}
                releaseDate={releaseDate}
                onEdit={(id) => history.push(`/item/${id}`)}
              />
            ))}
          </IonList>
        )}
        {fetchingError && (
          <div>{fetchingError.message || "Failed to fetch items"}</div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push("/item")}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default CarList;
