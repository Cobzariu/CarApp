import React, { useState } from "react";
import {
  IonItem,
  IonLabel,
  IonModal,
  createAnimation,
  IonButton,
} from "@ionic/react";
import { CarProps } from "./CarProps";

interface CarPropsExt extends CarProps {
  onEdit: (_id?: string) => void;
}

const Item: React.FC<CarPropsExt> = ({ _id, name, onEdit, photoPath }) => {
  const [showModal, setShowModal] = useState(false);
  const enterAnimation = (baseEl: any) => {
    const backdropAnimation = createAnimation()
      .addElement(baseEl.querySelector("ion-backdrop")!)
      .fromTo("opacity", "0.01", "var(--backdrop-opacity)");

    const wrapperAnimation = createAnimation()
      .addElement(baseEl.querySelector(".modal-wrapper")!)
      .keyframes([
        { offset: 0, opacity: "0", transform: "scale(0)" },
        { offset: 1, opacity: "0.99", transform: "scale(1)" },
      ]);

    return createAnimation()
      .addElement(baseEl)
      .easing("ease-out")
      .duration(500)
      .addAnimation([backdropAnimation, wrapperAnimation]);
  };

  const leaveAnimation = (baseEl: any) => {
    return enterAnimation(baseEl).direction("reverse");
  };
  return (
    <>
      <IonItem>
        <IonLabel onClick={() => onEdit(_id)}>{name}</IonLabel>
        <img
          src={photoPath}
          style={{ height: 50 }}
          onClick={() => {
            setShowModal(true);
          }}
        />
        <IonModal
          isOpen={showModal}
          enterAnimation={enterAnimation}
          leaveAnimation={leaveAnimation}
        >
          <img src={photoPath} />
          <IonButton onClick={() => setShowModal(false)}>Close Modal</IonButton>
        </IonModal>
      </IonItem>
    </>
  );
};

export default Item;
