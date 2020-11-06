import React, { useContext, useState, useEffect } from "react";
import { RouteComponentProps } from "react-router";
import { Redirect } from "react-router-dom";
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import { add } from "ionicons/icons";
import Item from "./Car";
import { getLogger } from "../core";
import { CarContext } from "./CarProvider";
import { AuthContext } from "../auth";
import { CarProps } from "./CarProps";

const log = getLogger("ItemList");

const CarList: React.FC<RouteComponentProps> = ({ history }) => {
  const { items, fetching, fetchingError } = useContext(CarContext);
  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(
    false
  );
  const [pos, setPos] = useState(16);
  const [itemsShow, setItemsShow] = useState<CarProps[]>([]);
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    logout?.();
    return <Redirect to={{ pathname: "/login" }} />;
  };
  useEffect(() => {
    if (items?.length) {
      setItemsShow(items.slice(0, 16));
    }
  }, [items]);
  log("render");
  async function searchNext($event: CustomEvent<void>) {
    if (items && pos<items.length) {
      setItemsShow([...itemsShow, ...items.slice(pos, 17 + pos)]);
      setPos(pos + 17);
    }
    else{
      setDisableInfiniteScroll(true);
    }
    ($event.target as HTMLIonInfiniteScrollElement).complete();

  }
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Car List</IonTitle>
          <IonButton onClick={handleLogout}>Logout</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonLoading isOpen={fetching} message="Fetching items" />
        {itemsShow &&
          itemsShow.map((car: CarProps) => {
            return (
              <Item
                key={car._id}
                _id={car._id}
                name={car.name}
                horsepower={car.horsepower}
                automatic={car.automatic}
                releaseDate={car.releaseDate}
                onEdit={(id) => history.push(`/item/${id}`)}
              />
            );
          })}
        <IonInfiniteScroll
          threshold="100px"
          disabled={disableInfiniteScroll}
          onIonInfinite={(e: CustomEvent<void>) => searchNext(e)}
        >
          <IonInfiniteScrollContent loadingText="Loading more good doggos..."></IonInfiniteScrollContent>
        </IonInfiniteScroll>
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
