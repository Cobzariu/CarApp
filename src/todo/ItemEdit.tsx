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
  IonDatetime
} from "@ionic/react";
import { getLogger } from "../core";
import { ItemContext } from "./ItemProvider";
import { RouteComponentProps } from "react-router";
import { ItemProps } from "./ItemProps";

const log = getLogger("ItemEdit");

interface ItemEditProps
  extends RouteComponentProps<{
    id?: string;
  }> {}

const ItemEdit: React.FC<ItemEditProps> = ({ history, match }) => {
  const { items, saving, savingError, saveItem, deleteItem } = useContext(
    ItemContext
  );
  const [name, setName] = useState("");
  const [horsepower, setHorsepower] = useState(0);
  const [automatic, setAutomatic] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');
  const [item, setItem] = useState<ItemProps>();
  useEffect(() => {
    log("useEffect");
    const routeId = match.params.id || "";
    const item = items?.find((it) => it._id === routeId);
    setItem(item);
    //console.log("DATE: "+releaseDate.toISOString());
    if (item) {
      setName(item.name);
      setHorsepower(item.horsepower);
      setAutomatic(item.automatic);
      setReleaseDate(item.releaseDate);
    }
  }, [match.params.id, items]);
  const handleSave = () => {
    const editedItem = item
      ? { ...item, name, horsepower, automatic, releaseDate }
      : { name, horsepower, automatic, releaseDate };
    saveItem && saveItem(editedItem).then(() => history.goBack());
  };
  const handleDelete = () => {
    const editedItem = item
      ? { ...item, name, horsepower, automatic, releaseDate }
      : { name, horsepower, automatic, releaseDate };
    deleteItem && deleteItem(editedItem).then(() => history.goBack());
  };
  log("render");
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Edit</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave}>Save</IonButton>
            <IonButton onClick={handleDelete}>Delete</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel>Name: </IonLabel>
          <IonInput
            value={name}
            onIonChange={(e) => setName(e.detail.value || "")}
          />
        </IonItem>
        <IonItem>
          <IonLabel>Horsepower</IonLabel>
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
        <IonDatetime value={releaseDate} onIonChange={e => setReleaseDate(e.detail.value!)}></IonDatetime>
        <IonLoading isOpen={saving} />
        {savingError && (
          <div>{savingError.message || "Failed to save item"}</div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ItemEdit;
