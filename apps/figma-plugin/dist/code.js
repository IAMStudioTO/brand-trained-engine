"use strict";
(() => {
  // src/code.ts
  figma.showUI(__html__, { width: 360, height: 310 });
  async function getFileNameSafe() {
    return "Figma File";
  }
  function colorToHex(c) {
    const r = Math.round(c.r * 255).toString(16).padStart(2, "0");
    const g = Math.round(c.g * 255).toString(16).padStart(2, "0");
    const b = Math.round(c.b * 255).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  function serializePaint(p) {
    if (p.type === "SOLID") {
      return {
        type: "SOLID",
        color: colorToHex(p.color),
        opacity: p.opacity || 1,
        visible: p.visible !== false,
        blendMode: p.blendMode || "NORMAL"
      };
    }
    if (p.type === "GRADIENT_LINEAR" || p.type === "GRADIENT_RADIAL" || p.type === "GRADIENT_ANGULAR" || p.type === "GRADIENT_DIAMOND") {
      return {
        type: p.type,
        visible: p.visible !== false,
        opacity: p.opacity || 1,
        blendMode: p.blendMode || "NORMAL",
        gradientStops: p.gradientStops?.map((s) => ({
          position: s.position,
          color: colorToHex(s.color),
          opacity: s.color.a || 1
        })) || [],
        gradientTransform: p.gradientTransform || null
      };
    }
    if (p.type === "IMAGE") {
      return {
        type: "IMAGE",
        visible: p.visible !== false,
        opacity: p.opacity || 1,
        blendMode: p.blendMode || "NORMAL",
        scaleMode: p.scaleMode,
        imageHash: p.imageHash || null,
        rotation: p.rotation || 0,
        filters: p.filters || null
      };
    }
    return { type: p.type };
  }
  function serializeEffect(e) {
    return {
      type: e.type,
      visible: e.visible !== false,
      radius: "radius" in e ? e.radius : void 0,
      color: "color" in e ? colorToHex(e.color) : void 0,
      opacity: "color" in e ? e.color?.a || 1 : void 0,
      offset: "offset" in e ? e.offset : void 0,
      spread: "spread" in e ? e.spread : void 0,
      blendMode: "blendMode" in e ? e.blendMode : void 0
    };
  }
  function commonNodeProps(node) {
    const base = {
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible,
      locked: node.locked,
      opacity: "opacity" in node ? node.opacity : 1,
      blendMode: "blendMode" in node ? node.blendMode : "NORMAL"
    };
    if ("x" in node) base.x = node.x;
    if ("y" in node) base.y = node.y;
    if ("width" in node) base.width = node.width;
    if ("height" in node) base.height = node.height;
    if ("rotation" in node) base.rotation = node.rotation;
    if ("constraints" in node) base.constraints = node.constraints;
    if ("cornerRadius" in node) base.cornerRadius = node.cornerRadius;
    if ("topLeftRadius" in node) {
      base.cornerRadii = {
        topLeft: node.topLeftRadius,
        topRight: node.topRightRadius,
        bottomLeft: node.bottomLeftRadius,
        bottomRight: node.bottomRightRadius
      };
    }
    if ("fills" in node) {
      const fills = node.fills;
      if (fills !== figma.mixed && Array.isArray(fills)) base.fills = fills.map(serializePaint);
    }
    if ("strokes" in node) {
      const strokes = node.strokes;
      if (strokes !== figma.mixed && Array.isArray(strokes)) base.strokes = strokes.map(serializePaint);
    }
    if ("strokeWeight" in node) base.strokeWeight = node.strokeWeight;
    if ("strokeAlign" in node) base.strokeAlign = node.strokeAlign;
    if ("dashPattern" in node) base.dashPattern = node.dashPattern;
    if ("effects" in node) {
      const effects = node.effects;
      if (effects !== figma.mixed && Array.isArray(effects)) base.effects = effects.map(serializeEffect);
    }
    if ("layoutMode" in node) {
      base.autoLayout = {
        layoutMode: node.layoutMode,
        primaryAxisSizingMode: node.primaryAxisSizingMode,
        counterAxisSizingMode: node.counterAxisSizingMode,
        primaryAxisAlignItems: node.primaryAxisAlignItems,
        counterAxisAlignItems: node.counterAxisAlignItems,
        paddingLeft: node.paddingLeft,
        paddingRight: node.paddingRight,
        paddingTop: node.paddingTop,
        paddingBottom: node.paddingBottom,
        itemSpacing: node.itemSpacing
      };
    }
    if ("clipsContent" in node) base.clipsContent = node.clipsContent;
    return base;
  }
  async function exportSvgIfVectorLike(node) {
    const vectorTypes = /* @__PURE__ */ new Set([
      "VECTOR",
      "BOOLEAN_OPERATION",
      "STAR",
      "LINE",
      "ELLIPSE",
      "POLYGON",
      "RECTANGLE"
    ]);
    if (!vectorTypes.has(node.type)) return null;
    const bytes = await node.exportAsync({ format: "SVG" });
    const svg = new TextDecoder("utf-8").decode(bytes);
    return svg;
  }
  function textProps(node) {
    const props = {
      characters: node.characters,
      textAlignHorizontal: node.textAlignHorizontal,
      textAlignVertical: node.textAlignVertical,
      textAutoResize: node.textAutoResize
    };
    props.fontName = node.fontName === figma.mixed ? null : node.fontName;
    props.fontSize = node.fontSize === figma.mixed ? null : node.fontSize;
    props.lineHeight = node.lineHeight === figma.mixed ? null : node.lineHeight;
    props.letterSpacing = node.letterSpacing === figma.mixed ? null : node.letterSpacing;
    props.paragraphIndent = node.paragraphIndent === figma.mixed ? null : node.paragraphIndent;
    props.paragraphSpacing = node.paragraphSpacing === figma.mixed ? null : node.paragraphSpacing;
    return props;
  }
  async function collectImageAssetsFromPaints(node, assets) {
    if (!("fills" in node)) return;
    const fills = node.fills;
    if (fills === figma.mixed || !Array.isArray(fills)) return;
    for (const p of fills) {
      if (p.type === "IMAGE" && p.imageHash) {
        const id = `img_${p.imageHash}`;
        if (assets.has(id)) continue;
        const img = figma.getImageByHash(p.imageHash);
        if (!img) continue;
        const bytes = await img.getBytesAsync();
        const b64 = figma.base64Encode(bytes);
        assets.set(id, { id, type: "image/png", base64: b64 });
      }
    }
  }
  async function serializeNode(node, assets) {
    const base = commonNodeProps(node);
    await collectImageAssetsFromPaints(node, assets);
    if (node.type === "TEXT") {
      return { ...base, ...textProps(node) };
    }
    const svg = await exportSvgIfVectorLike(node);
    if (svg) {
      return { ...base, svg };
    }
    if ("children" in node) {
      const kids = [];
      for (const child of node.children) {
        kids.push(await serializeNode(child, assets));
      }
      return { ...base, children: kids };
    }
    return base;
  }
  async function exportPreviewPng(node) {
    const bytes = await node.exportAsync({
      format: "PNG",
      constraint: { type: "SCALE", value: 2 }
    });
    return { type: "image/png", base64: figma.base64Encode(bytes) };
  }
  async function postJson(url, apiKey, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`API ${res.status}: ${text}`);
    return text;
  }
  (async () => {
    const apiBase = await figma.clientStorage.getAsync("bte_apiBase");
    const apiKey = await figma.clientStorage.getAsync("bte_apiKey");
    figma.ui.postMessage({ type: "INIT", apiBase: apiBase || "", apiKey: apiKey || "" });
  })();
  figma.ui.onmessage = async (msg) => {
    if (msg.type !== "EXPORT") return;
    const apiBase = String(msg.apiBase || "").trim();
    const apiKey = String(msg.apiKey || "").trim();
    if (!apiBase) return figma.notify("Inserisci API Base URL");
    if (!apiKey) return figma.notify("Inserisci API Key");
    await figma.clientStorage.setAsync("bte_apiBase", apiBase);
    await figma.clientStorage.setAsync("bte_apiKey", apiKey);
    const node = figma.currentPage.selection[0];
    if (!node) return figma.notify("Seleziona un frame o un nodo prima di esportare");
    figma.notify("Export in corso\u2026");
    const assets = /* @__PURE__ */ new Map();
    const tree = await serializeNode(node, assets);
    const preview = await exportPreviewPng(node);
    const pkg = {
      meta: {
        fileKey: figma.fileKey,
        fileName: await getFileNameSafe(),
        pageName: figma.currentPage.name,
        nodeId: node.id,
        nodeName: node.name,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      tree,
      assets: Array.from(assets.values()),
      preview
    };
    try {
      await postJson(`${apiBase}/figma/import`, apiKey, pkg);
      figma.notify("\u2705 Inviato a /figma/import");
    } catch (e) {
      figma.notify(`\u274C ${String(e)}`);
    }
  };
})();
