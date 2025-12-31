import { useEffect, useRef } from "react";

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
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    const handler = (event: Event) => {
      listenerRef.current(event);
    };

    target.addEventListener(type, handler, options);

    return () => {
      target.removeEventListener(type, handler, options);
    };
  }, [target, type, options]);
}
