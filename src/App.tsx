import type { LayoutNode } from ".";
import { assertNever } from "./internal/assertNever";
import { useDockLayout } from "./useDockLayout";

const INITIAL_LAYOUT: LayoutNode | null = null;

function loadInitialLayout() {
  const savedLayout = localStorage.getItem("layout");
  if (savedLayout === null) {
    return INITIAL_LAYOUT;
  }
  try {
    const parsed = JSON.parse(savedLayout);
    return parsed.root;
  } catch (error) {
    console.error(error);
    return INITIAL_LAYOUT;
  }
}

export function App() {
  const {
    addPanel,
    removePanel,
    serialize,
    containerRef,
    layoutRects,
    draggingRect,
    getRectProps,
    getDropZoneProps,
    getDragHandleProps,
  } = useDockLayout<HTMLDivElement>(loadInitialLayout());

  return (
    <div>
      <div style={{ height: "10vh", border: "1px solid white" }}>
        <button
          type="button"
          onClick={() => {
            addPanel();
          }}
        >
          Add panel
        </button>

        <button
          type="button"
          onClick={() => {
            localStorage.setItem("layout", serialize());
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
            const dropZoneProps = getDropZoneProps(rect);

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
                {dropZoneProps !== null && (
                  <div
                    style={{
                      ...dropZoneProps.style,
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
