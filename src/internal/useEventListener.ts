import { useEffect } from "react";
import { useLatestRef } from "./useLatestRef";

type WindowEventName = keyof WindowEventMap;
type DocumentEventName = keyof DocumentEventMap;

export function useEventListener<K extends WindowEventName>(
  target: Window,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void;

export function useEventListener<K extends DocumentEventName>(
  target: Document,
  type: K,
  listener: (event: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void;

export function useEventListener<K extends WindowEventName | DocumentEventName>(
  target: Window | Document,
  type: K,
  listener: (event: Event) => void,
  options?: boolean | AddEventListenerOptions,
): void {
  const latestListenerRef = useLatestRef(listener);

  useEffect(() => {
    function handleEvent(event: Event) {
      latestListenerRef.current(event);
    }

    target.addEventListener(type, handleEvent, options);

    return () => {
      target.removeEventListener(type, handleEvent, options);
    };
  }, [target, type, latestListenerRef, options]);
}
