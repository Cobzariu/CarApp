import React from "react";
import { IonItem, IonLabel } from "@ionic/react";
import { CarProps } from "./CarProps";

interface CarPropsExt extends CarProps {
  onEdit: (_id?: string) => void;
}

const Item: React.FC<CarPropsExt> = ({ _id, name, onEdit, photoPath }) => {
  return (
    <IonItem onClick={() => onEdit(_id)}>
      <IonLabel>{name}</IonLabel>
      <img src={photoPath} style={{ height: 50 }} />
    </IonItem>
  );
};

export default Item;
