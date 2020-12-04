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
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonActionSheet,
} from "@ionic/react";
import { add, camera, close, trash, map } from "ionicons/icons";
import Item from "./Car";
import { getLogger } from "../core";
import { CarContext } from "./CarProvider";
import { AuthContext } from "../auth";
import { CarProps } from "./CarProps";
import { useNetwork } from "../utils/useNetwork";
import { Photo, usePhotoGallery } from "../utils/usePhotoGallery";

const log = getLogger("ItemList");

const CarList: React.FC<RouteComponentProps> = ({ history }) => {
  const { items, fetching, fetchingError, updateServer } = useContext(
    CarContext
  );
  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(
    false
  );
  const { photos, takePhoto, deletePhoto } = usePhotoGallery();
  const [photoToDelete, setPhotoToDelete] = useState<Photo>();
  const { networkStatus } = useNetwork();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState<string>("");
  const [pos, setPos] = useState(16);
  const selectOptions = ["automatic", "manual"];
  const [itemsShow, setItemsShow] = useState<CarProps[]>([]);
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    logout?.();
    return <Redirect to={{ pathname: "/login" }} />;
  };
  useEffect(() => {
    if (networkStatus.connected === true) {
      updateServer && updateServer();
    }
  }, [networkStatus.connected]);
  useEffect(() => {
    if (items?.length) {
      setItemsShow(items.slice(0, 16));
    }
  }, [items]);
  log("render");
  async function searchNext($event: CustomEvent<void>) {
    if (items && pos < items.length) {
      setItemsShow([...itemsShow, ...items.slice(pos, 17 + pos)]);
      setPos(pos + 17);
    } else {
      setDisableInfiniteScroll(true);
    }
    ($event.target as HTMLIonInfiniteScrollElement).complete();
  }

  useEffect(() => {
    if (filter && items) {
      const boolType = filter === "automatic";
      setItemsShow(items.filter((car) => car.automatic === boolType));
    }
  }, [filter, items]);

  useEffect(() => {
    if (search && items) {
      setItemsShow(items.filter((car) => car.name.startsWith(search)));
    }
  }, [search, items]);
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Car List</IonTitle>
          <IonButton onClick={handleLogout}>Logout</IonButton>
          <div>Network is {networkStatus.connected ? "online" : "offline"}</div>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonLoading isOpen={fetching} message="Fetching items" />
        <IonSearchbar
          value={search}
          debounce={1000}
          onIonChange={(e) => setSearch(e.detail.value!)}
        ></IonSearchbar>
        <IonSelect
          value={filter}
          placeholder="Select transmission type"
          onIonChange={(e) => setFilter(e.detail.value)}
        >
          {selectOptions.map((option) => (
            <IonSelectOption key={option} value={option}>
              {option}
            </IonSelectOption>
          ))}
        </IonSelect>
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
                status={car.status}
                version={car.version}
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
        <IonFab vertical="bottom" horizontal="start" slot="fixed">
          <IonFabButton
            onClick={() => {
              history.push("/items/map");
            }}
          >
            <IonIcon icon={map} />
          </IonFabButton>
        </IonFab>
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={() => takePhoto()}>
            <IonIcon icon={camera} />
          </IonFabButton>
        </IonFab>
        <IonActionSheet
          isOpen={!!photoToDelete}
          buttons={[
            {
              text: "Delete",
              role: "destructive",
              icon: trash,
              handler: () => {
                if (photoToDelete) {
                  deletePhoto(photoToDelete);
                  setPhotoToDelete(undefined);
                }
              },
            },
            {
              text: "Cancel",
              icon: close,
              role: "cancel",
            },
          ]}
          onDidDismiss={() => setPhotoToDelete(undefined)}
        />
      </IonContent>
    </IonPage>
  );
};

export default CarList;
