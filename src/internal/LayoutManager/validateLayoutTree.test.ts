import { describe, expect, it } from "vitest";
import type { LayoutNode, PanelNode, SplitNode } from "../../types";
import {
  assertValidLayoutTree,
  validateLayoutTree,
} from "./validateLayoutTree";

describe("validateLayoutTree", () => {
  it("should return valid for null root", () => {
    const result = validateLayoutTree(null);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return valid for a single panel node", () => {
    const root: PanelNode = {
      type: "panel",
      id: "panel-1",
    };
    const result = validateLayoutTree(root);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return valid for a valid split tree", () => {
    const root: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      ratio: 0.5,
      left: { type: "panel", id: "panel-1" },
      right: { type: "panel", id: "panel-2" },
    };
    const result = validateLayoutTree(root);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return valid for a deeply nested tree", () => {
    const root: SplitNode = {
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
    const result = validateLayoutTree(root);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  describe("duplicate ID detection", () => {
    it("should detect duplicate IDs in sibling panels", () => {
      const root: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "duplicate" },
        right: { type: "panel", id: "duplicate" },
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]!.code).toBe("DUPLICATE_ID");
      expect(result.errors[0]!.nodeId).toBe("duplicate");
    });

    it("should detect duplicate IDs across different branches", () => {
      const root: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: {
          type: "split",
          id: "split-2",
          orientation: "vertical",
          ratio: 0.5,
          left: { type: "panel", id: "panel-1" },
          right: { type: "panel", id: "shared-id" },
        },
        right: {
          type: "split",
          id: "split-3",
          orientation: "vertical",
          ratio: 0.5,
          left: { type: "panel", id: "shared-id" },
          right: { type: "panel", id: "panel-2" },
        },
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "DUPLICATE_ID")).toBe(true);
    });

    it("should detect duplicate ID between split and panel", () => {
      const root: SplitNode = {
        type: "split",
        id: "same-id",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "same-id" },
        right: { type: "panel", id: "panel-2" },
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe("DUPLICATE_ID");
    });
  });

  describe("ratio validation", () => {
    it("should detect ratio less than 0", () => {
      const root: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: -0.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe("INVALID_RATIO");
    });

    it("should detect ratio greater than 1", () => {
      const root: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 1.5,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe("INVALID_RATIO");
    });

    it("should accept ratio of 0", () => {
      const root: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(true);
    });

    it("should accept ratio of 1", () => {
      const root: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 1,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(true);
    });

    it("should detect NaN ratio", () => {
      const root: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: Number.NaN,
        left: { type: "panel", id: "panel-1" },
        right: { type: "panel", id: "panel-2" },
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe("INVALID_RATIO");
    });
  });

  describe("empty ID detection", () => {
    it("should detect empty string ID", () => {
      const root: PanelNode = {
        type: "panel",
        id: "",
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe("EMPTY_ID");
    });

    it("should detect whitespace-only ID", () => {
      const root: PanelNode = {
        type: "panel",
        id: "   ",
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors[0]!.code).toBe("EMPTY_ID");
    });
  });

  describe("missing children detection", () => {
    it("should detect missing left child", () => {
      const root = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: undefined,
        right: { type: "panel", id: "panel-1" },
      } as unknown as LayoutNode;
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_CHILDREN")).toBe(
        true,
      );
    });

    it("should detect missing right child", () => {
      const root = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 0.5,
        left: { type: "panel", id: "panel-1" },
        right: undefined,
      } as unknown as LayoutNode;
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "MISSING_CHILDREN")).toBe(
        true,
      );
    });
  });

  describe("multiple errors", () => {
    it("should report multiple errors in the same tree", () => {
      const root: SplitNode = {
        type: "split",
        id: "split-1",
        orientation: "horizontal",
        ratio: 1.5, // Invalid ratio
        left: { type: "panel", id: "duplicate" },
        right: { type: "panel", id: "duplicate" }, // Duplicate ID
      };
      const result = validateLayoutTree(root);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
      expect(result.errors.some((e) => e.code === "INVALID_RATIO")).toBe(true);
      expect(result.errors.some((e) => e.code === "DUPLICATE_ID")).toBe(true);
    });
  });
});

describe("assertValidLayoutTree", () => {
  it("should not throw for valid tree", () => {
    const root: PanelNode = {
      type: "panel",
      id: "panel-1",
    };
    expect(() => assertValidLayoutTree(root)).not.toThrow();
  });

  it("should throw for invalid tree with descriptive message", () => {
    const root: SplitNode = {
      type: "split",
      id: "split-1",
      orientation: "horizontal",
      ratio: 1.5,
      left: { type: "panel", id: "panel-1" },
      right: { type: "panel", id: "panel-1" },
    };
    expect(() => assertValidLayoutTree(root)).toThrow(/Invalid layout tree/);
    expect(() => assertValidLayoutTree(root)).toThrow(/DUPLICATE_ID|ratio/i);
  });
});
