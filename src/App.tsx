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
    getRectProps,
    getDropIndicatorProps,
    getDragHandleProps,
  } = useDockLayout<HTMLDivElement>(() => {
    console.info("working");
    const root = localStorage.getItem("layout");
    if (root === null) {
      return null;
    }
    return JSON.parse(root);
  });

  return (
    <div>
      <div style={{ height: "10vh", border: "1px solid white" }}>
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
        >
          Save to Local Storage
        </button>
      </div>
      <div
        ref={containerRef}
        style={{
          height: "90vh",
          position: "relative",
        }}
      >
        {layoutRects.map((rect) => {
          if (rect.type === "split") {
            const { style, ...props } = getRectProps(rect);
            return (
              <div
                key={rect.id}
                style={{ ...style, backgroundColor: "white", fontSize: 20 }}
                {...props}
              ></div>
            );
          } else if (rect.type === "panel") {
            const { style, ...props } = getRectProps(rect);
            const dropIndicatorProps = getDropIndicatorProps(rect);

            return (
              <div
                key={rect.id}
                style={{
                  ...style,
                  fontSize: 20,
                  display: "grid",
                  placeItems: "center",
                  opacity: draggingRect?.id === rect.id ? 0.5 : 1,
                }}
                {...props}
              >
                {dropIndicatorProps !== null && (
                  <div
                    style={{
                      ...dropIndicatorProps.style,
                      backgroundColor: "#3182f6",
                      opacity: 0.5,
                    }}
                  />
                )}

                <button type="button" {...getDragHandleProps(rect)}>
                  Drag Handle
                </button>

                <button
                  type="button"
                  onClick={() => {
                    removePanel(rect.id);
                  }}
                >
                  Close Panel
                </button>

                {rect.id}
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
