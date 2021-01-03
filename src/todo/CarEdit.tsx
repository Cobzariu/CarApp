import React, { useContext, useEffect, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCheckbox,
  IonLabel,
  IonItem,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonIcon,
  IonActionSheet,
} from "@ionic/react";
import { camera, trash, close } from "ionicons/icons";
import { createAnimation } from "@ionic/react";
import { CarContext } from "./CarProvider";
import { RouteComponentProps } from "react-router";
import { CarProps } from "./CarProps";
import { useNetwork } from "../utils/useNetwork";
import { Photo, usePhotoGallery } from "../utils/usePhotoGallery";
import { PhotoViewer } from "@ionic-native/photo-viewer";
import { MyMap } from "../utils/MyMap";
// const log = getLogger("ItemEdit");

interface CarEditProps
  extends RouteComponentProps<{
    id?: string;
  }> {}

const CarEdit: React.FC<CarEditProps> = ({ history, match }) => {
  const {
    items,
    saving,
    savingError,
    saveItem,
    deleteItem,
    getServerItem,
    oldItem,
  } = useContext(CarContext);
  const [name, setName] = useState("");
  const [horsepower, setHorsepower] = useState(0);
  const [automatic, setAutomatic] = useState(false);
  const [releaseDate, setReleaseDate] = useState("");
  const [photoPath, setPhotoPath] = useState("");
  const [latitude, setLatitude] = useState(46.7533824);
  const [longitude, setLongitude] = useState(23.5831296);
  const [item, setItem] = useState<CarProps>();
  const [itemV2, setItemV2] = useState<CarProps>();
  const { networkStatus } = useNetwork();

  const { photos, takePhoto, deletePhoto } = usePhotoGallery();
  const [photoToDelete, setPhotoToDelete] = useState<Photo>();
  useEffect(() => {
    const routeId = match.params.id || "";
    const item = items?.find((it) => it._id === routeId);
    setItem(item);
    if (item) {
      setName(item.name);
      setHorsepower(item.horsepower);
      setAutomatic(item.automatic);
      setReleaseDate(item.releaseDate);
      setPhotoPath(item.photoPath);
      if (item.latitude) setLatitude(item.latitude);
      if (item.longitude) setLongitude(item.longitude);
      getServerItem && getServerItem(match.params.id!, item?.version);
    }
  }, [match.params.id, items, getServerItem]);
  useEffect(() => {
    setItemV2(oldItem);
    // log("SET OLD ITEM: " + JSON.stringify(oldItem));
  }, [oldItem]);
  // log("intra");
  const handleSave = () => {
    const editedItem = item
      ? {
          ...item,
          name,
          horsepower,
          automatic,
          releaseDate,
          status: 0,
          version: item.version ? item.version + 1 : 1,
          photoPath,
          latitude,
          longitude
        }
      : {
          name,
          horsepower,
          automatic,
          releaseDate,
          status: 0,
          version: 1,
          photoPath,
          latitude,
          longitude
          
        };
    saveItem &&
      saveItem(editedItem, networkStatus.connected).then(() => {
        // log(JSON.stringify(itemV2));
        if (itemV2 === undefined) history.goBack();
      });
  };
  const handleConflict1 = () => {
    if (oldItem) {
      const editedItem = {
        ...item,
        name,
        horsepower,
        automatic,
        releaseDate,
        status: 0,
        version: oldItem?.version + 1,
        photoPath,
        latitude,
        longitude
      };
      saveItem &&
        saveItem(editedItem, networkStatus.connected).then(() => {
          history.goBack();
        });
    }
  };
  const handleConflict2 = () => {
    if (oldItem) {
      const editedItem = {
        ...item,
        name: oldItem?.name,
        horsepower: oldItem?.horsepower,
        automatic: oldItem?.automatic,
        releaseDate: oldItem?.releaseDate,
        status: oldItem?.status,
        version: oldItem?.version + 1,
        photoPath,
        latitude,
        longitude
      };
      saveItem &&
        editedItem &&
        saveItem(editedItem, networkStatus.connected).then(() => {
          history.goBack();
        });
    }
  };
  const handleDelete = () => {
    const editedItem = item
      ? {
          ...item,
          name,
          horsepower,
          automatic,
          releaseDate,
          status: 0,
          version: 0,
          photoPath,
          latitude,
          longitude
        }
      : {
          name,
          horsepower,
          automatic,
          releaseDate,
          status: 0,
          version: 0,
          photoPath,
          latitude,
          longitude
        };
    deleteItem &&
      deleteItem(editedItem, networkStatus.connected).then(() =>
        history.goBack()
      );
  };
  function chainAnimations() {
    const elB = document.querySelector('.carName');
    const elC = document.querySelector('.carHorsepower');
    if (elB && elC) {
      const animationA = createAnimation()
        .addElement(elB)
        .duration(5000)
        .fromTo('transform', 'rotate(0)', 'rotate(45deg)');
        
      const animationB = createAnimation()
        .addElement(elC)
        .duration(7000)
        .fromTo('transform', 'scale(1)', 'scale(0.8)');
        (async () => {
        await animationA.play();
        await animationB.play();
      })();
    }
  }
  useEffect(chainAnimations, []);
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {/* <div className="edit"> */}
          <IonTitle>Edit</IonTitle>
          {/* </div> */}
          {/* <div className="buttons"> */}
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>Save</IonButton>
            <IonButton onClick={handleDelete}>Delete</IonButton>
          </IonButtons>
          {/* </div> */}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <div className="carName">
          <IonLabel>Name: </IonLabel>
          </div>
          <IonInput
            value={name}
            onIonChange={(e) => setName(e.detail.value || "")}
          />
        </IonItem>
        <IonItem>
          <div className="carHorsepower">
          <IonLabel>Horsepower:</IonLabel>
          </div>
          <IonInput
            value={horsepower}
            onIonChange={(e) => setHorsepower(Number(e.detail.value))}
          />
        </IonItem>

        <IonItem>
          <IonLabel>Automatic: </IonLabel>
          <IonCheckbox
            checked={automatic}
            onIonChange={(e) => setAutomatic(e.detail.checked)}
          />
        </IonItem>
        <IonDatetime
          value={releaseDate}
          onIonChange={(e) => setReleaseDate(e.detail.value?.split("T")[0]!)}
        ></IonDatetime>
        <img src={photoPath} />
        <MyMap
            lat={latitude}
            lng={longitude}
            onMapClick={(location: any) => {
              setLatitude(location.latLng.lat());
              setLongitude(location.latLng.lng());
            }}
          />
        {itemV2 && (
          <>
            <IonItem>
              <IonLabel>Name: {itemV2.name}</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>Horsepower: {itemV2.horsepower}</IonLabel>
            </IonItem>

            <IonItem>
              <IonLabel>Automatic: </IonLabel>
              <IonCheckbox checked={itemV2.automatic} disabled />
            </IonItem>
            <IonDatetime value={itemV2.releaseDate} disabled></IonDatetime>
            <IonButton onClick={handleConflict1}>First Version</IonButton>
            <IonButton onClick={handleConflict2}>Second Version</IonButton>
          </>
        )}
        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || "Failed to save item"}</div>
        )}
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton
            onClick={() => {
              const photoTaken = takePhoto();
              photoTaken.then((data) => {
                setPhotoPath(data.webviewPath!);
              });
            }}
          >
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

export default CarEdit;
