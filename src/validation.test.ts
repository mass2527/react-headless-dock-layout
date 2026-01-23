import { describe, expect, it } from "vitest";
import type { LayoutNode, PanelNode, SplitNode } from "./types";
import {
  isValidLayoutNode,
  isValidPanelNode,
  isValidSplitNode,
  validateLayout,
} from "./validation";

describe("validateLayout", () => {
  describe("null layouts", () => {
    it("should accept null as a valid empty layout", () => {
      const result = validateLayout(null);
      expect(result).toEqual({ valid: true });
    });
  });

  describe("panel nodes", () => {
    it("should accept a valid panel node", () => {
      const panel: PanelNode = { type: "panel", id: "panel-1" };
      const result = validateLayout(panel);
      expect(result).toEqual({ valid: true });
    });

    it("should accept a panel with minSize", () => {
      const panel: PanelNode = {
        type: "panel",
        id: "panel-1",
        minSize: { width: 100, height: 50 },
      };
      const result = validateLayout(panel);
      expect(result).toEqual({ valid: true });
    });

    it("should accept a panel with partial minSize", () => {
      const panel: PanelNode = {
        type: "panel",
        id: "panel-1",
        minSize: { width: 100 },
      };
      const result = validateLayout(panel);
      expect(result).toEqual({ valid: true });
    });

    it("should reject panel with missing id", () => {
      const result = validateLayout({ type: "panel" });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Missing required property "id"',
          path: "root",
        });
      }
    });

    it("should reject panel with non-string id", () => {
      const result = validateLayout({ type: "panel", id: 123 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Invalid id type "number", expected string',
          path: "root",
        });
      }
    });

    it("should reject panel with empty id", () => {
      const result = validateLayout({ type: "panel", id: "  " });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: "ID cannot be empty",
          path: "root",
        });
      }
    });

    it("should reject panel with invalid minSize type", () => {
      const result = validateLayout({
        type: "panel",
        id: "panel-1",
        minSize: "invalid",
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Invalid minSize type "string", expected object',
          path: "root.minSize",
        });
      }
    });

    it("should reject panel with negative minSize.width", () => {
      const result = validateLayout({
        type: "panel",
        id: "panel-1",
        minSize: { width: -10 },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Invalid minSize.width "-10", expected non-negative number',
          path: "root.minSize.width",
        });
      }
    });

    it("should reject panel with non-numeric minSize.height", () => {
      const result = validateLayout({
        type: "panel",
        id: "panel-1",
        minSize: { height: "50" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Invalid minSize.height "50", expected non-negative number',
          path: "root.minSize.height",
        });
      }
    });
  });

  describe("split nodes", () => {
    it("should accept a valid split node", () => {
      const split: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      };
      const result = validateLayout(split);
      expect(result).toEqual({ valid: true });
    });

    it("should accept a split with vertical orientation", () => {
      const split: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "vertical",
        ratio: 0.3,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      };
      const result = validateLayout(split);
      expect(result).toEqual({ valid: true });
    });

    it("should reject split with missing orientation", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Missing required property "orientation"',
          path: "root",
        });
      }
    });

    it("should reject split with invalid orientation", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        orientation: "diagonal",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message:
            'Invalid orientation "diagonal", expected "horizontal" or "vertical"',
          path: "root.orientation",
        });
      }
    });

    it("should reject split with missing ratio", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Missing required property "ratio"',
          path: "root",
        });
      }
    });

    it("should reject split with non-numeric ratio", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: "0.5",
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Invalid ratio type "string", expected number',
          path: "root.ratio",
        });
      }
    });

    it("should reject split with ratio < 0", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: -0.1,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Invalid ratio "-0.1", expected value between 0 and 1',
          path: "root.ratio",
        });
      }
    });

    it("should reject split with ratio > 1", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 1.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Invalid ratio "1.5", expected value between 0 and 1',
          path: "root.ratio",
        });
      }
    });

    it("should reject split with missing left child", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        right: { type: "panel", id: "panel-2" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Missing required property "left"',
          path: "root",
        });
      }
    });

    it("should reject split with missing right child", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Missing required property "right"',
          path: "root",
        });
      }
    });

    it("should validate nested children", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel" }, // missing id
        right: { type: "panel", id: "panel-2" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Missing required property "id"',
          path: "root.left",
        });
      }
    });
  });

  describe("duplicate IDs", () => {
    it("should detect duplicate IDs by default", () => {
      const layout: LayoutNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-1" }, // duplicate
      };
      const result = validateLayout(layout);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Duplicate ID "panel-1" found in layout tree',
          path: "root.right",
        });
      }
    });

    it("should skip duplicate ID check when disabled", () => {
      const layout: LayoutNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-1" }, // duplicate
      };
      const result = validateLayout(layout, { checkDuplicateIds: false });
      expect(result).toEqual({ valid: true });
    });
  });

  describe("invalid types", () => {
    it("should reject non-object values", () => {
      expect(validateLayout("string").valid).toBe(false);
      expect(validateLayout(123).valid).toBe(false);
      expect(validateLayout(true).valid).toBe(false);
      expect(validateLayout(undefined).valid).toBe(false);
    });

    it("should reject arrays", () => {
      const result = validateLayout([]);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors[0]?.message).toContain("array");
      }
    });

    it("should reject missing type property", () => {
      const result = validateLayout({ id: "foo" });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Missing required property "type"',
          path: "root",
        });
      }
    });

    it("should reject invalid type value", () => {
      const result = validateLayout({ type: "invalid", id: "foo" });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: 'Invalid type "invalid", expected "panel" or "split"',
          path: "root",
        });
      }
    });
  });

  describe("deeply nested layouts", () => {
    it("should validate deeply nested layouts", () => {
      const layout: LayoutNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          type: "split",
          id: "split-2",
          orientation: "vertical",
          ratio: 0.3,
          left: { type: "panel", id: "panel-1" },
          right: {
            type: "split",
            id: "split-3",
            orientation: "horizontal",
            ratio: 0.7,
            left: { type: "panel", id: "panel-2" },
            right: { type: "panel", id: "panel-3" },
          },
        },
        right: { type: "panel", id: "panel-4" },
      };
      const result = validateLayout(layout);
      expect(result).toEqual({ valid: true });
    });

    it("should report errors with correct paths in deeply nested layouts", () => {
      const result = validateLayout({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          type: "split",
          id: "split-2",
          orientation: "vertical",
          ratio: 0.3,
          left: { type: "panel", id: "panel-1" },
          right: { type: "panel", id: "" }, // invalid
        },
        right: { type: "panel", id: "panel-2" },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toContainEqual({
          message: "ID cannot be empty",
          path: "root.left.right",
        });
      }
    });
  });
});

describe("isValidLayoutNode", () => {
  it("should return true for valid layouts", () => {
    expect(isValidLayoutNode(null)).toBe(true);
    expect(isValidLayoutNode({ type: "panel", id: "panel-1" })).toBe(true);
    expect(
      isValidLayoutNode({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      }),
    ).toBe(true);
  });

  it("should return false for invalid layouts", () => {
    expect(isValidLayoutNode("string")).toBe(false);
    expect(isValidLayoutNode({ type: "panel" })).toBe(false);
    expect(isValidLayoutNode({ type: "invalid" })).toBe(false);
  });
});

describe("isValidPanelNode", () => {
  it("should return true for valid panel nodes", () => {
    expect(isValidPanelNode({ type: "panel", id: "panel-1" })).toBe(true);
    expect(
      isValidPanelNode({
        type: "panel",
        id: "panel-1",
        minSize: { width: 100 },
      }),
    ).toBe(true);
  });

  it("should return false for invalid panel nodes", () => {
    expect(isValidPanelNode(null)).toBe(false);
    expect(isValidPanelNode("string")).toBe(false);
    expect(isValidPanelNode({ type: "panel" })).toBe(false);
    expect(isValidPanelNode({ type: "panel", id: "" })).toBe(false);
    expect(isValidPanelNode({ type: "split", id: "split-1" })).toBe(false);
  });

  it("should return false for panels with invalid minSize", () => {
    expect(
      isValidPanelNode({
        type: "panel",
        id: "panel-1",
        minSize: "invalid",
      }),
    ).toBe(false);
    expect(
      isValidPanelNode({
        type: "panel",
        id: "panel-1",
        minSize: { width: -10 },
      }),
    ).toBe(false);
  });
});

describe("isValidSplitNode", () => {
  it("should return true for valid split nodes", () => {
    expect(
      isValidSplitNode({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      }),
    ).toBe(true);
  });

  it("should return false for invalid split nodes", () => {
    expect(isValidSplitNode(null)).toBe(false);
    expect(isValidSplitNode({ type: "panel", id: "panel-1" })).toBe(false);
    expect(
      isValidSplitNode({
        type: "split",
        id: "split-1",
        orientation: "invalid",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      }),
    ).toBe(false);
    expect(
      isValidSplitNode({
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 1.5, // invalid
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      }),
    ).toBe(false);
  });
});
