import { useEffect, useRef } from "react";
import { assertNever } from "./internal/assertNever";
import { useDockLayout } from "./useDockLayout";

export function App() {
  const {
    root,
    addPanel,
    removePanel,
    containerRef,
    layoutRects,
    draggingRect,
    movingPanelId,
    focusedPanelId,
    getRectProps,
    getDropIndicatorProps,
    getDragHandleProps,
    getPanelA11yProps,
    getSplitBarA11yProps,
    getAnnouncementProps,
  } = useDockLayout<HTMLDivElement>(() => {
    const root = localStorage.getItem("layout");
    if (root === null) {
      return null;
    }
    return JSON.parse(root);
  });

  // Store refs for focus management
  const panelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Focus panel when focusedPanelId changes
  useEffect(() => {
    if (focusedPanelId !== null) {
      const panelRef = panelRefs.current.get(focusedPanelId);
      if (panelRef) {
        panelRef.focus();
      }
    }
  }, [focusedPanelId]);

  const announcementProps = getAnnouncementProps();

  return (
    <div>
      {/* Screen reader announcement region */}
      <div
        {...announcementProps}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {announcementProps.children}
      </div>

      <div style={{ height: "10vh", border: "1px solid white", padding: "8px" }}>
        <button
          type="button"
          onClick={() => {
            addPanel(Date.now().toString());
          }}
        >
          Add panel
        </button>

        <button
          type="button"
          onClick={() => {
            localStorage.setItem("layout", JSON.stringify(root));
          }}
          style={{ marginLeft: "8px" }}
        >
          Save to Local Storage
        </button>

        <span style={{ marginLeft: "16px", fontSize: "14px", color: "#888" }}>
          Keyboard: Tab to navigate, Arrow keys to resize splits or select drop
          targets, Enter/Space to move panels, Escape to cancel
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          height: "90vh",
          position: "relative",
        }}
        role="application"
        aria-label="Dock layout"
      >
        {layoutRects.map((rect) => {
          if (rect.type === "split") {
            const { style, ...props } = getRectProps(rect);
            const a11yProps = getSplitBarA11yProps(rect);

            return (
              <div
                key={rect.id}
                style={{
                  ...style,
                  backgroundColor: "white",
                  fontSize: 20,
                  outline: "none",
                }}
                {...props}
                {...a11yProps}
                // Focus indicator styles
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 2px #3182f6";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            );
          } else if (rect.type === "panel") {
            const { style, ...props } = getRectProps(rect);
            const dropIndicatorProps = getDropIndicatorProps(rect);
            const a11yProps = getPanelA11yProps(rect);
            const dragHandleProps = getDragHandleProps(rect);
            const isMoving = movingPanelId === rect.id;
            const isDragging = draggingRect?.id === rect.id;

            return (
              <div
                key={rect.id}
                id={rect.id}
                ref={(el) => {
                  if (el) {
                    panelRefs.current.set(rect.id, el);
                  } else {
                    panelRefs.current.delete(rect.id);
                  }
                }}
                style={{
                  ...style,
                  fontSize: 20,
                  display: "grid",
                  placeItems: "center",
                  opacity: isDragging || isMoving ? 0.5 : 1,
                  border: isMoving ? "2px dashed #3182f6" : "1px solid #333",
                  outline: "none",
                }}
                {...props}
                {...a11yProps}
              >
                {dropIndicatorProps !== null && (
                  <div
                    style={{
                      ...dropIndicatorProps.style,
                      backgroundColor: "#3182f6",
                      opacity: 0.5,
                    }}
                    aria-hidden="true"
                  />
                )}

                <div style={{ display: "flex", gap: "8px", flexDirection: "column", alignItems: "center" }}>
                  <button
                    type="button"
                    {...dragHandleProps}
                    aria-label={`Move panel ${rect.id}`}
                    style={{
                      ...dragHandleProps.style,
                      padding: "8px 16px",
                      cursor: "grab",
                      backgroundColor: isMoving ? "#3182f6" : undefined,
                      color: isMoving ? "white" : undefined,
                    }}
                  >
                    {isMoving ? "Moving... (Arrow keys, Enter, Esc)" : "Drag Handle"}
                  </button>

                  {/* Hidden instructions for screen readers */}
                  <span
                    id={`drag-instructions-${rect.id}`}
                    style={{
                      position: "absolute",
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: "hidden",
                      clip: "rect(0, 0, 0, 0)",
                      whiteSpace: "nowrap",
                      border: 0,
                    }}
                  >
                    Press Enter or Space to start moving this panel. Use arrow
                    keys to select drop position, Enter to confirm, Escape to
                    cancel.
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      removePanel(rect.id);
                    }}
                    aria-label={`Close panel ${rect.id}`}
                    style={{ padding: "8px 16px" }}
                  >
                    Close Panel
                  </button>

                  <span style={{ fontSize: "14px", color: "#666" }}>
                    Panel: {rect.id}
                  </span>
                </div>
              </div>
            );
          } else {
            assertNever(rect);
          }
        })}
      </div>
    </div>
  );
}
