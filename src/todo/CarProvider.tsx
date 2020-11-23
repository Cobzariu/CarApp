import React, { useCallback, useContext, useEffect, useReducer } from "react";
import PropTypes from "prop-types";
import { getLogger } from "../core";
import { CarProps } from "./CarProps";
import { Plugins } from "@capacitor/core";

import {
  createItem,
  getItems,
  newWebSocket,
  updateItem,
  eraseItem,
  getItem,
} from "./carApi";
import { AuthContext } from "../auth";

const log = getLogger("ItemProvider");
const { Storage } = Plugins;
type SaveItemFn = (item: CarProps, connected: boolean) => Promise<any>;
type DeleteItemFn = (item: CarProps, connected: boolean) => Promise<any>;
type UpdateServerFn = () => Promise<any>;
type ServerItem = (id: string, version: number) => Promise<any>;

export interface CarsState {
  items?: CarProps[];
  oldItem?: CarProps;
  fetching: boolean;
  fetchingError?: Error | null;
  saving: boolean;
  deleting: boolean;
  savingError?: Error | null;
  deletingError?: Error | null;
  saveItem?: SaveItemFn;
  deleteItem?: DeleteItemFn;
  updateServer?: UpdateServerFn;
  getServerItem?: ServerItem;
}

interface ActionProps {
  type: string;
  payload?: any;
}

const initialState: CarsState = {
  fetching: false,
  saving: false,
  deleting: false,
  oldItem: undefined,
};

const FETCH_ITEMS_STARTED = "FETCH_ITEMS_STARTED";
const FETCH_ITEMS_SUCCEEDED = "FETCH_ITEMS_SUCCEEDED";
const FETCH_ITEMS_FAILED = "FETCH_ITEMS_FAILED";
const SAVE_ITEM_STARTED = "SAVE_ITEM_STARTED";
const SAVE_ITEM_SUCCEEDED = "SAVE_ITEM_SUCCEEDED";
const SAVE_ITEM_SUCCEEDED_OFFLINE = "SAVE_ITEM_SUCCEEDED_OFFLINE";
const SAVE_ITEM_FAILED = "SAVE_ITEM_FAILED";
const DELETE_ITEM_STARTED = "DELETE_ITEM_STARTED";
const DELETE_ITEM_SUCCEEDED = "DELETE_ITEM_SUCCEEDED";
const DELETE_ITEM_FAILED = "DELETE_ITEM_FAILED";
const CONFLICT = "CONFLICT";
const CONFLICT_SOLVED = "CONFLICT_SOLVED";

const reducer: (state: CarsState, action: ActionProps) => CarsState = (
  state,
  { type, payload }
) => {
  switch (type) {
    case FETCH_ITEMS_STARTED:
      return { ...state, fetching: true, fetchingError: null };
    case FETCH_ITEMS_SUCCEEDED:
      return { ...state, items: payload.items, fetching: false };
    case FETCH_ITEMS_FAILED:
      return { ...state, fetchingError: payload.error, fetching: false };

    case SAVE_ITEM_STARTED:
      return { ...state, savingError: null, saving: true };
    case SAVE_ITEM_SUCCEEDED:
      const items = [...(state.items || [])];
      const item = payload.item;
      if (item._id !== undefined) {
        log("ITEM in Car Provider: " + JSON.stringify(item));
        const index = items.findIndex((it) => it._id === item._id);
        if (index === -1) {
          items.splice(0, 0, item);
        } else {
          items[index] = item;
        }
        return { ...state, items, saving: false };
      }
      return { ...state, items };
    case SAVE_ITEM_SUCCEEDED_OFFLINE: {
      const items = [...(state.items || [])];
      const item = payload.item;
      const index = items.findIndex((it) => it._id === item._id);
      if (index === -1) {
        items.splice(0, 0, item);
      } else {
        items[index] = item;
      }
      return { ...state, items, saving: false };
    }

    case SAVE_ITEM_FAILED:
      return { ...state, savingError: payload.error, saving: false };

    case DELETE_ITEM_STARTED:
      return { ...state, deletingError: null, deleting: true };
    case DELETE_ITEM_SUCCEEDED: {
      const items = [...(state.items || [])];
      const item = payload.item;
      const index = items.findIndex((it) => it._id === item._id);
      items.splice(index, 1);
      return { ...state, items, deleting: false };
    }

    case DELETE_ITEM_FAILED:
      return { ...state, deletingError: payload.error, deleting: false };
    case CONFLICT: {
      log("CONFLICT: " + JSON.stringify(payload.item));
      return { ...state, oldItem: payload.item };
    }
    case CONFLICT_SOLVED: {
      log("CONFLICT_SOLVED");
      return { ...state, oldItem: undefined };
    }
    default:
      return state;
  }
};

export const CarContext = React.createContext<CarsState>(initialState);

interface CarProviderProps {
  children: PropTypes.ReactNodeLike;
}

export const CarProvider: React.FC<CarProviderProps> = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    items,
    fetching,
    fetchingError,
    saving,
    savingError,
    deleting,
    oldItem,
  } = state;
  useEffect(getItemsEffect, [token]);
  useEffect(wsEffect, [token]);
  const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
  const deleteItem = useCallback<DeleteItemFn>(deleteItemCallback, [token]);
  const updateServer = useCallback<UpdateServerFn>(updateServerCallback, [
    token,
  ]);
  const getServerItem = useCallback<ServerItem>(itemServer, [token]);
  const value = {
    items,
    fetching,
    fetchingError,
    saving,
    savingError,
    saveItem,
    deleting,
    deleteItem,
    updateServer,
    getServerItem,
    oldItem,
  };
  return <CarContext.Provider value={value}>{children}</CarContext.Provider>;

  async function itemServer(id: string, version: number) {
    const oldItem = await getItem(token, id);
    if (oldItem.version !== version)
      dispatch({ type: CONFLICT, payload: { item: oldItem } });
  }

  async function updateServerCallback() {
    const allKeys = Storage.keys();
    let promisedItems;
    var i;

    promisedItems = await allKeys.then(function (allKeys) {
      const promises = [];
      for (i = 0; i < allKeys.keys.length; i++) {
        const promiseItem = Storage.get({ key: allKeys.keys[i] });

        promises.push(promiseItem);
      }
      return promises;
    });

    for (i = 0; i < promisedItems.length; i++) {
      const promise = promisedItems[i];
      const car = await promise.then(function (it) {
        var object; // TODO: extracted var from try scope
        try {
          object = JSON.parse(it.value!);
        } catch (e) {
          return null;
        }
        return object;
      });
      log("CAR: " + JSON.stringify(car));
      if (car !== null) {
        if (car.status === 1) {
          dispatch({ type: DELETE_ITEM_SUCCEEDED, payload: { item: car } });
          await Storage.remove({ key: car._id });
          const oldCar = car;
          delete oldCar._id;
          oldCar.status = 0;
          const newCar = await createItem(token, oldCar);
          dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: newCar } });
          await Storage.set({
            key: JSON.stringify(newCar._id),
            value: JSON.stringify(newCar),
          });
        } else if (car.status === 2) {
          car.status = 0;
          const newCar = await updateItem(token, car);
          dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: newCar } });
          await Storage.set({
            key: JSON.stringify(newCar._id),
            value: JSON.stringify(newCar),
          });
        } else if (car.status === 3) {
          car.status = 0;
          await eraseItem(token, car);
          await Storage.remove({ key: car._id });
        }
      }
    }
  }

  function getItemsEffect() {
    let canceled = false;
    fetchItems();
    return () => {
      canceled = true;
    };

    async function fetchItems() {
      if (!token?.trim()) {
        return;
      }
      try {
        log("fetchItems started");
        dispatch({ type: FETCH_ITEMS_STARTED });
        const items = await getItems(token);
        log("fetchItems succeeded");
        if (!canceled) {
          dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items } });
        }
      } catch (error) {
        const allKeys = Storage.keys();
        console.log(allKeys);
        let promisedItems;
        var i;

        promisedItems = await allKeys.then(function (allKeys) {
          // local storage also storages the login token, therefore we must get only Plant objects

          const promises = [];
          for (i = 0; i < allKeys.keys.length; i++) {
            const promiseItem = Storage.get({ key: allKeys.keys[i] });

            promises.push(promiseItem);
          }
          return promises;
        });

        const cars = [];
        for (i = 0; i < promisedItems.length; i++) {
          const promise = promisedItems[i];
          const plant = await promise.then(function (it) {
            var object; // TODO: extracted var from try scope
            try {
              object = JSON.parse(it.value!);
            } catch (e) {
              return null;
            }
            console.log(typeof object);
            console.log(object);
            if (object.status !== 2) {
              return object;
            }
            return null;
          });
          if (plant != null) {
            cars.push(plant);
          }
        }

        const items = cars;
        dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items: items } });
      }
    }
  }
  function random_id() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }

  async function saveItemCallback(item: CarProps, connected: boolean) {
    try {
      if (!connected) {
        throw new Error();
      }
      log("saveItem started");
      dispatch({ type: SAVE_ITEM_STARTED });
      const savedItem = await (item._id
        ? updateItem(token, item)
        : createItem(token, item));

      log("saveItem succeeded");
      dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item: savedItem } });
      dispatch({ type: CONFLICT_SOLVED });
    } catch (error) {
      log("saveItem failed with errror:", error);

      if (item._id === undefined) {
        item._id = random_id();
        item.status = 1;
        alert("Car saved locally");
      } else {
        item.status = 2;
        alert("Car updated locally");
      }
      await Storage.set({
        key: item._id,
        value: JSON.stringify(item),
      });

      dispatch({ type: SAVE_ITEM_SUCCEEDED_OFFLINE, payload: { item: item } });
    }
  }

  async function deleteItemCallback(item: CarProps, connected: boolean) {
    try {
      if (!connected) {
        throw new Error();
      }
      dispatch({ type: DELETE_ITEM_STARTED });
      const deletedItem = await eraseItem(token, item);
      console.log(deletedItem);
      await Storage.remove({ key: item._id! });
      dispatch({ type: DELETE_ITEM_SUCCEEDED, payload: { item: item } });
    } catch (error) {

      item.status = 3; 
      await Storage.set({
        key: JSON.stringify(item._id),
        value: JSON.stringify(item),
      });
      alert("Car deleted locally");
      dispatch({ type: DELETE_ITEM_SUCCEEDED, payload: { item: item } });
    }
  }

  function wsEffect() {
    let canceled = false;
    log("wsEffect - connecting");
    let closeWebSocket: () => void;
    if (token?.trim()) {
      closeWebSocket = newWebSocket(token, (message) => {
        if (canceled) {
          return;
        }
        const { type, payload: item } = message;
        log(`ws message, item ${type} ${item._id}`);
        if (type === "created" || type === "updated") {
          //dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
        }
      });
    }
    return () => {
      log("wsEffect - disconnecting");
      canceled = true;
      closeWebSocket?.();
    };
  }
};
