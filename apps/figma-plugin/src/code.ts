// Brand-Trained Engine — Export (Serio)
// Source file: apps/figma-plugin/src/code.ts
// Build generates dist/code.js (JS-only)

figma.showUI(__html__, { width: 360, height: 310 });

async function getFileNameSafe(): Promise<string> {
  // Figma plugin API non espone sempre il nome file in modo affidabile
  return "Figma File";
}

function colorToHex(c: RGB): string {
  const r = Math.round(c.r * 255).toString(16).padStart(2, "0");
  const g = Math.round(c.g * 255).toString(16).padStart(2, "0");
  const b = Math.round(c.b * 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function serializePaint(p: Paint): any {
  if (p.type === "SOLID") {
    const solid = p as SolidPaint;
    return {
      type: "SOLID",
      color: colorToHex(solid.color),
      opacity: typeof solid.opacity === "number" ? solid.opacity : 1,
      visible: solid.visible !== false,
      blendMode: (solid.blendMode as any) || "NORMAL",
    };
  }

  if (
    p.type === "GRADIENT_LINEAR" ||
    p.type === "GRADIENT_RADIAL" ||
    p.type === "GRADIENT_ANGULAR" ||
    p.type === "GRADIENT_DIAMOND"
  ) {
    const g = p as GradientPaint;
    return {
      type: g.type,
      visible: g.visible !== false,
      opacity: typeof g.opacity === "number" ? g.opacity : 1,
      blendMode: (g.blendMode as any) || "NORMAL",
      gradientStops: (g.gradientStops || []).map((s) => ({
        position: s.position,
        color: colorToHex(s.color),
        opacity: typeof s.color.a === "number" ? s.color.a : 1,
      })),
      gradientTransform: g.gradientTransform || null,
    };
  }

  if (p.type === "IMAGE") {
    const img = p as ImagePaint;
    return {
      type: "IMAGE",
      visible: img.visible !== false,
      opacity: typeof img.opacity === "number" ? img.opacity : 1,
      blendMode: (img.blendMode as any) || "NORMAL",
      scaleMode: img.scaleMode,
      imageHash: img.imageHash || null,
      rotation: typeof img.rotation === "number" ? img.rotation : 0,
      filters: img.filters || null,
    };
  }

  return { type: (p as any).type };
}

function serializeEffect(e: Effect): any {
  const anyE = e as any;
  return {
    type: e.type,
    visible: (e as any).visible !== false,
    radius: typeof anyE.radius === "number" ? anyE.radius : undefined,
    color: anyE.color ? colorToHex(anyE.color) : undefined,
    opacity: anyE.color && typeof anyE.color.a === "number" ? anyE.color.a : undefined,
    offset: anyE.offset,
    spread: typeof anyE.spread === "number" ? anyE.spread : undefined,
    blendMode: anyE.blendMode,
  };
}

function commonNodeProps(node: SceneNode): any {
  const anyNode = node as any;

  const base: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
    opacity: typeof anyNode.opacity === "number" ? anyNode.opacity : 1,
    blendMode: anyNode.blendMode || "NORMAL",
  };

  if (typeof anyNode.x === "number") base.x = anyNode.x;
  if (typeof anyNode.y === "number") base.y = anyNode.y;
  if (typeof anyNode.width === "number") base.width = anyNode.width;
  if (typeof anyNode.height === "number") base.height = anyNode.height;
  if (typeof anyNode.rotation === "number") base.rotation = anyNode.rotation;

  if (anyNode.constraints) base.constraints = anyNode.constraints;

  if (typeof anyNode.cornerRadius === "number") base.cornerRadius = anyNode.cornerRadius;
  if (typeof anyNode.topLeftRadius === "number") {
    base.cornerRadii = {
      topLeft: anyNode.topLeftRadius,
      topRight: anyNode.topRightRadius,
      bottomLeft: anyNode.bottomLeftRadius,
      bottomRight: anyNode.bottomRightRadius,
    };
  }

  // fills / strokes possono essere figma.mixed
  if ("fills" in anyNode) {
    const fills = anyNode.fills;
    if (fills !== figma.mixed && Array.isArray(fills)) base.fills = fills.map(serializePaint);
  }

  if ("strokes" in anyNode) {
    const strokes = anyNode.strokes;
    if (strokes !== figma.mixed && Array.isArray(strokes)) base.strokes = strokes.map(serializePaint);
  }

  if (typeof anyNode.strokeWeight === "number") base.strokeWeight = anyNode.strokeWeight;
  if (anyNode.strokeAlign) base.strokeAlign = anyNode.strokeAlign;
  if (Array.isArray(anyNode.dashPattern)) base.dashPattern = anyNode.dashPattern;

  if ("effects" in anyNode) {
    const effects = anyNode.effects;
    if (effects !== figma.mixed && Array.isArray(effects)) base.effects = effects.map(serializeEffect);
  }

  if ("layoutMode" in anyNode) {
    base.autoLayout = {
      layoutMode: anyNode.layoutMode,
      primaryAxisSizingMode: anyNode.primaryAxisSizingMode,
      counterAxisSizingMode: anyNode.counterAxisSizingMode,
      primaryAxisAlignItems: anyNode.primaryAxisAlignItems,
      counterAxisAlignItems: anyNode.counterAxisAlignItems,
      paddingLeft: anyNode.paddingLeft,
      paddingRight: anyNode.paddingRight,
      paddingTop: anyNode.paddingTop,
      paddingBottom: anyNode.paddingBottom,
      itemSpacing: anyNode.itemSpacing,
    };
  }

  if (typeof anyNode.clipsContent === "boolean") base.clipsContent = anyNode.clipsContent;

  return base;
}

function textProps(node: TextNode): any {
  const props: any = {
    characters: node.characters,
    textAlignHorizontal: node.textAlignHorizontal,
    textAlignVertical: node.textAlignVertical,
    textAutoResize: node.textAutoResize,
  };

  // possono essere figma.mixed
  props.fontName = node.fontName === figma.mixed ? null : node.fontName;
  props.fontSize = node.fontSize === figma.mixed ? null : node.fontSize;
  props.lineHeight = node.lineHeight === figma.mixed ? null : node.lineHeight;
  props.letterSpacing = node.letterSpacing === figma.mixed ? null : node.letterSpacing;
  props.paragraphIndent = node.paragraphIndent === figma.mixed ? null : node.paragraphIndent;
  props.paragraphSpacing = node.paragraphSpacing === figma.mixed ? null : node.paragraphSpacing;

  return props;
}

async function collectImageAssetsFromPaints(node: SceneNode, assets: Map<string, any>) {
  const anyNode = node as any;
  if (!("fills" in anyNode)) return;

  const fills = anyNode.fills;
  if (fills === figma.mixed || !Array.isArray(fills)) return;

  for (const p of fills) {
    if (p.type === "IMAGE" && p.imageHash) {
      const id = `img_${p.imageHash}`;
      if (assets.has(id)) continue;

      const img = figma.getImageByHash(p.imageHash);
      if (!img) continue;

      const bytes = await img.getBytesAsync();
      const b64 = figma.base64Encode(bytes);

      // Non sempre è PNG, ma per MVP basta (rendering lo gestiremo dopo)
      assets.set(id, { id, type: "image/png", base64: b64 });
    }
  }
}

async function exportSvgIfVectorLike(node: SceneNode): Promise<string | null> {
  const vectorTypes = new Set([
    "VECTOR",
    "BOOLEAN_OPERATION",
    "STAR",
    "LINE",
    "ELLIPSE",
    "POLYGON",
    "RECTANGLE",
  ]);

  if (!vectorTypes.has(node.type as any)) return null;

  const bytes = await (node as any).exportAsync({ format: "SVG" });
  const svg = new TextDecoder("utf-8").decode(bytes);
  return svg;
}

async function serializeNode(node: SceneNode, assets: Map<string, any>): Promise<any> {
  const base = commonNodeProps(node);

  await collectImageAssetsFromPaints(node, assets);

  if (node.type === "TEXT") {
    return { ...base, ...textProps(node as TextNode) };
  }

  const svg = await exportSvgIfVectorLike(node);
  if (svg) {
    return { ...base, svg };
  }

  const anyNode = node as any;
  if ("children" in anyNode && Array.isArray(anyNode.children)) {
    const children = [];
    for (const child of anyNode.children) {
      children.push(await serializeNode(child, assets));
    }
    return { ...base, children };
  }

  return base;
}

async function exportPreviewPng(node: SceneNode) {
  const bytes = await (node as any).exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: 2 },
  });

  return {
    type: "image/png",
    base64: figma.base64Encode(bytes),
  };
}

async function postJson(url: string, apiKey: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`API ${res.status}: ${text}`);
  return text;
}

// Init UI values
(async () => {
  const apiBase = await figma.clientStorage.getAsync("bte_apiBase");
  const apiKey = await figma.clientStorage.getAsync("bte_apiKey");

  figma.ui.postMessage({
    type: "INIT",
    apiBase: apiBase || "",
    apiKey: apiKey || "",
  });
})();

figma.ui.onmessage = async (msg) => {
  if (!msg || msg.type !== "EXPORT") return;

  const apiBase = String(msg.apiBase || "").trim();
  const apiKey = String(msg.apiKey || "").trim();

  if (!apiBase) return figma.notify("Inserisci API Base URL");
  if (!apiKey) return figma.notify("Inserisci API Key");

  await figma.clientStorage.setAsync("bte_apiBase", apiBase);
  await figma.clientStorage.setAsync("bte_apiKey", apiKey);

  const node = figma.currentPage.selection[0] as SceneNode | undefined;
  if (!node) return figma.notify("Seleziona un FRAME (consigliato) o un nodo prima di esportare");

  figma.notify("Export in corso…");

  const assets = new Map<string, any>();
  const tree = await serializeNode(node, assets);
  const preview = await exportPreviewPng(node);

  // ⚠️ QUI rispettiamo ESATTAMENTE i campi richiesti dal backend:
  // Required: meta.fileKey, meta.nodeId, tree
  const payload = {
    meta: {
      fileKey: figma.fileKey || "local-file",
      fileName: await getFileNameSafe(),
      pageName: figma.currentPage.name,
      nodeId: node.id,
      nodeName: node.name,
      exportedAt: new Date().toISOString(),
    },
    tree,
    assets: Array.from(assets.values()),
    preview,
  };

  try {
    await postJson(`${apiBase}/figma/import`, apiKey, payload);
    figma.notify("✅ Inviato a /figma/import");
  } catch (e) {
    figma.notify(`❌ ${String(e)}`);
  }
};
