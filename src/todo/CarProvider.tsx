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
} from "./carApi";
import { AuthContext } from "../auth";
import { useNetwork } from "../utils/useNetwork";

const log = getLogger("ItemProvider");
const { Storage } = Plugins;
type SaveItemFn = (item: CarProps, connected: boolean) => Promise<any>;
type DeleteItemFn = (item: CarProps, connected: boolean) => Promise<any>;
type UpdateServerFn = () => Promise<any>;

export interface CarsState {
  items?: CarProps[];
  fetching: boolean;
  fetchingError?: Error | null;
  saving: boolean;
  deleting: boolean;
  savingError?: Error | null;
  deletingError?: Error | null;
  saveItem?: SaveItemFn;
  deleteItem?: DeleteItemFn;
  updateServer?: UpdateServerFn;
}

interface ActionProps {
  type: string;
  payload?: any;
}

const initialState: CarsState = {
  fetching: false,
  saving: false,
  deleting: false,
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
        const index = items.findIndex((it) => it._id === item._id);
        if (index === -1) {
          items.splice(0, 0, item);
        } else {
          items[index] = item;
        }
        return { ...state, items, saving: false };
      }
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
  } = state;
  useEffect(getItemsEffect, [token]);
  useEffect(wsEffect, [token]);
  const saveItem = useCallback<SaveItemFn>(saveItemCallback, [token]);
  const deleteItem = useCallback<DeleteItemFn>(deleteItemCallback, [token]);
  const updateServer = useCallback<UpdateServerFn>(updateServerCallback, [
    token,
  ]);
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
  };
  log("returns");
  return <CarContext.Provider value={value}>{children}</CarContext.Provider>;

  async function updateServerCallback() {
    const allKeys = Storage.keys();
    log("IN updateServer token is:", token);
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
      const plant = await promise.then(function (it) {
        var object; // TODO: extracted var from try scope
        try {
          object = JSON.parse(it.value!);
        } catch (e) {
          return null;
        }
        return object;
      });
      if (plant !== null) {
        if (plant.status === 1) {
          log("add plant:", JSON.stringify(plant));
          saveItem(plant, true);
        } else if (plant.status === 2) {
          deleteItem(plant, true);
          await Storage.remove({ key: plant._id });
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

        const plantItems = [];
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
            if (object.status != 2) {
              return object;
            }
            return null;
          });
          if (plant != null) {
            plantItems.push(plant);
          }
        }

        const items = plantItems;
        dispatch({ type: FETCH_ITEMS_SUCCEEDED, payload: { items: items } });
      }
    }
  }
  function random_id() {
    return Date.now().toString();
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
    } catch (error) {
      log("saveItem failed with errror:", error);

      // TODO: the apps stores data locally
      item.status = 1; // todo: set the data status as MODIFIED OFFLINE
      if (item._id === undefined) item._id = random_id();
      await Storage.set({
        key: JSON.stringify(item._id),
        value: JSON.stringify(item),
      });

      // TODO: Inform user about the items not sent to the server
      alert("ITEM WAS SAVED LOCALLY!");

      dispatch({ type: SAVE_ITEM_SUCCEEDED_OFFLINE, payload: { item: item } });
    }
  }

  async function deleteItemCallback(item: CarProps, connected: boolean) {
    try {
      if (!connected) {
        throw new Error();
      }
      log("delete started");
      dispatch({ type: DELETE_ITEM_STARTED });
      const deletedItem = await eraseItem(token, item);
      log("delete succeeded");
      console.log(deletedItem);
      dispatch({ type: DELETE_ITEM_SUCCEEDED, payload: { item: item } });
    } catch (error) {
      log("delete failed");

      // TODO: the apps stores data locally
      item.status = 2; // todo: set the data status as DELETED OFFLINE
      await Storage.set({
        key: JSON.stringify(item._id),
        value: JSON.stringify(item),
      });

      // TODO: Inform user about the items not sent to the server
      alert("ITEM WAS DELETED LOCALLY!");

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
        log(`ws message, item ${type}`);
        if (type === "created" || type === "updated") {
          dispatch({ type: SAVE_ITEM_SUCCEEDED, payload: { item } });
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
