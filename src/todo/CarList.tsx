import React, { useContext, useState, useEffect } from "react";
import { createAnimation } from "@ionic/react";
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
} from "@ionic/react";
import { add } from "ionicons/icons";
import Item from "./Car";
import { getLogger } from "../core";
import { CarContext } from "./CarProvider";
import { AuthContext } from "../auth";
import { CarProps } from "./CarProps";
import { useNetwork } from "../utils/useNetwork";

const log = getLogger("ItemList");

const CarList: React.FC<RouteComponentProps> = ({ history }) => {
  const { items, fetching, fetchingError, updateServer } = useContext(
    CarContext
  );
  const [disableInfiniteScroll, setDisableInfiniteScroll] = useState<boolean>(
    false
  );
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

  function simpleAnimation() {
    const el = document.querySelector(".networkStatus");
    if (el) {
      const animation = createAnimation()
        .addElement(el)
        .duration(1000)
        .direction("alternate")
        .iterations(Infinity)
        .keyframes([
          { offset: 0, transform: "scale(1)", opacity: "1" },
          {
            offset: 1,
            transform: "scale(0.5)",
            opacity: "0.5",
          },
        ]);
      animation.play();
    }
  }
  useEffect(simpleAnimation, []);
  function groupAnimations() {
    const elB = document.querySelector('.searchBar');
    const elC = document.querySelector('.select');
    if (elB && elC) {
      const animationA = createAnimation()
        .addElement(elB)
        .fromTo('transform', 'scale(1)','scale(0.75)');
      const animationB = createAnimation()
        .addElement(elC)
        .fromTo('transform', 'rotate(0)', 'rotate(180deg)');
      const parentAnimation = createAnimation()
        .duration(10000)
        .addAnimation([animationA, animationB]);
      parentAnimation.play();    }
  }
  useEffect(groupAnimations, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Car List</IonTitle>
          <IonButton onClick={handleLogout}>Logout</IonButton>
          <div className="networkStatus">
            Network is {networkStatus.connected ? "online" : "offline"}
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonLoading isOpen={fetching} message="Fetching items" />
        <div className="searchBar">
        <IonSearchbar
          value={search}
          debounce={1000}
          onIonChange={(e) => setSearch(e.detail.value!)}
        ></IonSearchbar>
        </div>
        <div className="select">
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
        </div>
        
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
                photoPath={car.photoPath}
                latitude={car.latitude}
                longitude={car.longitude}
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
