/**
 * BTE Export (Serio) — Design Package v1
 * - Tree completo + props importanti
 * - TEXT editabile
 * - VECTOR come SVG
 * - IMAGE assets estratti da imageHash
 * - Preview PNG del root
 */

type Asset = { id: string; type: string; base64: string };
type DesignPackage = {
  meta: {
    fileKey: string | undefined;
    fileName: string;
    pageName: string;
    nodeId: string;
    nodeName: string;
    exportedAt: string;
  };
  tree: any;
  assets: Asset[];
  preview?: { type: string; base64: string };
};

figma.showUI(__html__, { width: 360, height: 310 });

async function getFileNameSafe(): Promise<string> {
  // Non esiste API ufficiale per nome file in plugin; usiamo fallback.
  // (Se vuoi, possiamo riceverlo dall'utente in UI in uno step successivo)
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
      gradientStops: p.gradientStops?.map(s => ({
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
      rotation: (p as ImagePaint).rotation || 0,
      filters: (p as ImagePaint).filters || null
    };
  }

  return { type: p.type };
}

function serializeEffect(e: Effect): any {
  return {
    type: e.type,
    visible: e.visible !== false,
    radius: "radius" in e ? (e as any).radius : undefined,
    color: "color" in e ? colorToHex((e as any).color) : undefined,
    opacity: "color" in e ? ((e as any).color?.a || 1) : undefined,
    offset: "offset" in e ? (e as any).offset : undefined,
    spread: "spread" in e ? (e as any).spread : undefined,
    blendMode: "blendMode" in e ? (e as any).blendMode : undefined
  };
}

function commonNodeProps(node: SceneNode): any {
  const base: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
    opacity: "opacity" in node ? (node as any).opacity : 1,
    blendMode: "blendMode" in node ? (node as any).blendMode : "NORMAL"
  };

  // Geometry (quando esiste)
  if ("x" in node) base.x = node.x;
  if ("y" in node) base.y = node.y;
  if ("width" in node) base.width = (node as any).width;
  if ("height" in node) base.height = (node as any).height;
  if ("rotation" in node) base.rotation = (node as any).rotation;

  // Constraints
  if ("constraints" in node) base.constraints = (node as any).constraints;

  // Corner radius
  if ("cornerRadius" in node) base.cornerRadius = (node as any).cornerRadius;
  if ("topLeftRadius" in node) {
    base.cornerRadii = {
      topLeft: (node as any).topLeftRadius,
      topRight: (node as any).topRightRadius,
      bottomLeft: (node as any).bottomLeftRadius,
      bottomRight: (node as any).bottomRightRadius
    };
  }

  // Fills / strokes
  if ("fills" in node) {
    const fills = (node as any).fills as ReadonlyArray<Paint> | PluginAPI["mixed"];
    if (fills !== figma.mixed && Array.isArray(fills)) base.fills = fills.map(serializePaint);
  }
  if ("strokes" in node) {
    const strokes = (node as any).strokes as ReadonlyArray<Paint> | PluginAPI["mixed"];
    if (strokes !== figma.mixed && Array.isArray(strokes)) base.strokes = strokes.map(serializePaint);
  }
  if ("strokeWeight" in node) base.strokeWeight = (node as any).strokeWeight;
  if ("strokeAlign" in node) base.strokeAlign = (node as any).strokeAlign;
  if ("dashPattern" in node) base.dashPattern = (node as any).dashPattern;

  // Effects
  if ("effects" in node) {
    const effects = (node as any).effects as ReadonlyArray<Effect> | PluginAPI["mixed"];
    if (effects !== figma.mixed && Array.isArray(effects)) base.effects = effects.map(serializeEffect);
  }

  // Layout (Auto Layout) quando esiste
  if ("layoutMode" in node) {
    base.autoLayout = {
      layoutMode: (node as any).layoutMode,
      primaryAxisSizingMode: (node as any).primaryAxisSizingMode,
      counterAxisSizingMode: (node as any).counterAxisSizingMode,
      primaryAxisAlignItems: (node as any).primaryAxisAlignItems,
      counterAxisAlignItems: (node as any).counterAxisAlignItems,
      paddingLeft: (node as any).paddingLeft,
      paddingRight: (node as any).paddingRight,
      paddingTop: (node as any).paddingTop,
      paddingBottom: (node as any).paddingBottom,
      itemSpacing: (node as any).itemSpacing
    };
  }

  // Clips content
  if ("clipsContent" in node) base.clipsContent = (node as any).clipsContent;

  return base;
}

async function exportSvgIfVectorLike(node: SceneNode): Promise<string | null> {
  const vectorTypes = new Set([
    "VECTOR",
    "BOOLEAN_OPERATION",
    "STAR",
    "LINE",
    "ELLIPSE",
    "POLYGON",
    "RECTANGLE"
  ]);
  if (!vectorTypes.has(node.type)) return null;

  const bytes = await (node as any).exportAsync({ format: "SVG" });
  const svg = new TextDecoder("utf-8").decode(bytes);
  return svg;
}

function textProps(node: TextNode): any {
  const props: any = {
    characters: node.characters,
    textAlignHorizontal: node.textAlignHorizontal,
    textAlignVertical: node.textAlignVertical,
    textAutoResize: node.textAutoResize
  };

  // Tipografia — se mixed, mettiamo null (gestiremo dopo)
  props.fontName = node.fontName === figma.mixed ? null : node.fontName;
  props.fontSize = node.fontSize === figma.mixed ? null : node.fontSize;
  props.lineHeight = node.lineHeight === figma.mixed ? null : node.lineHeight;
  props.letterSpacing = node.letterSpacing === figma.mixed ? null : node.letterSpacing;
  props.paragraphIndent = node.paragraphIndent === figma.mixed ? null : node.paragraphIndent;
  props.paragraphSpacing = node.paragraphSpacing === figma.mixed ? null : node.paragraphSpacing;

  return props;
}

async function collectImageAssetsFromPaints(node: SceneNode, assets: Map<string, Asset>) {
  if (!("fills" in node)) return;

  const fills = (node as any).fills as ReadonlyArray<Paint> | PluginAPI["mixed"];
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

async function serializeNode(node: SceneNode, assets: Map<string, Asset>): Promise<any> {
  const base = commonNodeProps(node);

  // Assets da image fills
  await collectImageAssetsFromPaints(node, assets);

  // TEXT
  if (node.type === "TEXT") {
    return { ...base, ...textProps(node) };
  }

  // VECTOR-like → SVG
  const svg = await exportSvgIfVectorLike(node);
  if (svg) {
    return { ...base, svg };
  }

  // Children
  if ("children" in node) {
    const kids = [];
    for (const child of node.children) {
      // Skip non-Scene nodes (non dovrebbero esserci qui)
      kids.push(await serializeNode(child as SceneNode, assets));
    }
    return { ...base, children: kids };
  }

  return base;
}

async function exportPreviewPng(node: SceneNode): Promise<{ type: string; base64: string }> {
  const bytes = await (node as any).exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: 2 }
  });
  return { type: "image/png", base64: figma.base64Encode(bytes) };
}

async function postJson(url: string, apiKey: string, body: any) {
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

// UI init (load saved settings)
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

  const node = figma.currentPage.selection[0] as SceneNode | undefined;
  if (!node) return figma.notify("Seleziona un frame o un nodo prima di esportare");

  figma.notify("Export in corso…");

  const assets = new Map<string, Asset>();
  const tree = await serializeNode(node, assets);
  const preview = await exportPreviewPng(node);

  const pkg: DesignPackage = {
    meta: {
      fileKey: figma.fileKey,
      fileName: await getFileNameSafe(),
      pageName: figma.currentPage.name,
      nodeId: node.id,
      nodeName: node.name,
      exportedAt: new Date().toISOString()
    },
    tree,
    assets: Array.from(assets.values()),
    preview
  };

  try {
    await postJson(`${apiBase}/figma/import`, apiKey, pkg);
    figma.notify("✅ Inviato a /figma/import");
  } catch (e) {
    figma.notify(`❌ ${String(e)}`);
  }
};
