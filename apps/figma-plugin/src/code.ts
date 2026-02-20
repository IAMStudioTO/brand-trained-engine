// apps/figma-plugin/src/code.ts
figma.showUI(__html__, { width: 360, height: 310 });

function colorToHex(c: RGB): string {
  const r = Math.round(c.r * 255).toString(16).padStart(2, "0");
  const g = Math.round(c.g * 255).toString(16).padStart(2, "0");
  const b = Math.round(c.b * 255).toString(16).padStart(2, "0");
  return "#" + r + g + b;
}

function safeFileKey(): string {
  // figma.fileKey può essere null/undefined in certi contesti
  const fk = (figma as any).fileKey as string | undefined;
  if (typeof fk === "string" && fk.length > 0) return fk;
  return "local-file";
}

function safeFileName(): string {
  // figma.root.name è il nome del documento (quando disponibile)
  try {
    const n = figma.root && (figma.root as any).name;
    if (typeof n === "string" && n.length > 0) return n;
  } catch (e) {}
  return "Figma File";
}

function serializePaint(p: Paint): any {
  if (p.type === "SOLID") {
    return {
      type: "SOLID",
      color: colorToHex(p.color),
      opacity: (p as any).opacity || 1,
      visible: (p as any).visible !== false,
      blendMode: (p as any).blendMode || "NORMAL"
    };
  }

  if (
    p.type === "GRADIENT_LINEAR" ||
    p.type === "GRADIENT_RADIAL" ||
    p.type === "GRADIENT_ANGULAR" ||
    p.type === "GRADIENT_DIAMOND"
  ) {
    const stops = (p as any).gradientStops || [];
    return {
      type: p.type,
      visible: (p as any).visible !== false,
      opacity: (p as any).opacity || 1,
      blendMode: (p as any).blendMode || "NORMAL",
      gradientStops: Array.isArray(stops)
        ? stops.map((s: any) => ({
            position: s.position,
            color: colorToHex(s.color),
            opacity: (s.color && s.color.a) ? s.color.a : 1
          }))
        : [],
      gradientTransform: (p as any).gradientTransform || null
    };
  }

  if (p.type === "IMAGE") {
    return {
      type: "IMAGE",
      visible: (p as any).visible !== false,
      opacity: (p as any).opacity || 1,
      blendMode: (p as any).blendMode || "NORMAL",
      scaleMode: (p as any).scaleMode,
      imageHash: (p as any).imageHash || null,
      rotation: (p as any).rotation || 0,
      filters: (p as any).filters || null
    };
  }

  return { type: (p as any).type };
}

function serializeEffect(e: any): any {
  // senza optional chaining (compat Figma)
  const hasColor = e && typeof e === "object" && "color" in e && e.color;
  return {
    type: e.type,
    visible: e.visible !== false,
    radius: "radius" in e ? e.radius : undefined,
    color: hasColor ? colorToHex(e.color) : undefined,
    opacity: hasColor && e.color && typeof e.color.a === "number" ? e.color.a : 1,
    offset: "offset" in e ? e.offset : undefined,
    spread: "spread" in e ? e.spread : undefined,
    blendMode: "blendMode" in e ? e.blendMode : undefined
  };
}

function commonNodeProps(node: SceneNode): any {
  const base: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
    opacity: ("opacity" in node ? (node as any).opacity : 1),
    blendMode: ("blendMode" in node ? (node as any).blendMode : "NORMAL")
  };

  if ("x" in node) base.x = (node as any).x;
  if ("y" in node) base.y = (node as any).y;
  if ("width" in node) base.width = (node as any).width;
  if ("height" in node) base.height = (node as any).height;
  if ("rotation" in node) base.rotation = (node as any).rotation;
  if ("constraints" in node) base.constraints = (node as any).constraints;

  if ("cornerRadius" in node) base.cornerRadius = (node as any).cornerRadius;

  if ("topLeftRadius" in node) {
    base.cornerRadii = {
      topLeft: (node as any).topLeftRadius,
      topRight: (node as any).topRightRadius,
      bottomLeft: (node as any).bottomLeftRadius,
      bottomRight: (node as any).bottomRightRadius
    };
  }

  if ("fills" in node) {
    const fills = (node as any).fills;
    if (fills !== figma.mixed && Array.isArray(fills)) {
      base.fills = fills.map(serializePaint);
    }
  }

  if ("strokes" in node) {
    const strokes = (node as any).strokes;
    if (strokes !== figma.mixed && Array.isArray(strokes)) {
      base.strokes = strokes.map(serializePaint);
    }
  }

  if ("strokeWeight" in node) base.strokeWeight = (node as any).strokeWeight;
  if ("strokeAlign" in node) base.strokeAlign = (node as any).strokeAlign;
  if ("dashPattern" in node) base.dashPattern = (node as any).dashPattern;

  if ("effects" in node) {
    const effects = (node as any).effects;
    if (effects !== figma.mixed && Array.isArray(effects)) {
      base.effects = effects.map(serializeEffect);
    }
  }

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

  if ("clipsContent" in node) base.clipsContent = (node as any).clipsContent;

  return base;
}

function textProps(node: TextNode): any {
  const props: any = {
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

async function collectImageAssetsFromPaints(node: SceneNode, assets: Map<string, any>) {
  if (!("fills" in node)) return;
  const fills = (node as any).fills;
  if (fills === figma.mixed || !Array.isArray(fills)) return;

  for (const p of fills) {
    if (p && p.type === "IMAGE" && p.imageHash) {
      const id = "img_" + p.imageHash;
      if (assets.has(id)) continue;

      const img = figma.getImageByHash(p.imageHash);
      if (!img) continue;

      const bytes = await img.getBytesAsync();
      const b64 = figma.base64Encode(bytes);

      // NB: il tipo reale può non essere sempre png, ma per MVP va bene
      assets.set(id, { id, type: "image/png", base64: b64 });
    }
  }
}

async function exportSvgIfVectorLike(node: SceneNode): Promise<string | null> {
  const vectorTypes: { [k: string]: boolean } = {
    VECTOR: true,
    BOOLEAN_OPERATION: true,
    STAR: true,
    LINE: true,
    ELLIPSE: true,
    POLYGON: true,
    RECTANGLE: true
  };

  if (!vectorTypes[node.type]) return null;

  const bytes = await (node as any).exportAsync({ format: "SVG" });
  const svg = new TextDecoder("utf-8").decode(bytes);
  return svg;
}

async function serializeNode(node: SceneNode, assets: Map<string, any>): Promise<any> {
  const base = commonNodeProps(node);

  await collectImageAssetsFromPaints(node, assets);

  if (node.type === "TEXT") {
    return Object.assign({}, base, textProps(node as TextNode));
  }

  const svg = await exportSvgIfVectorLike(node);
  if (svg) {
    return Object.assign({}, base, { svg: svg });
  }

  if ("children" in (node as any)) {
    const kids: any[] = [];
    const children = (node as any).children as SceneNode[];
    for (const child of children) {
      kids.push(await serializeNode(child, assets));
    }
    return Object.assign({}, base, { children: kids });
  }

  return base;
}

async function exportPreviewPng(node: SceneNode) {
  const bytes = await (node as any).exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: 2 }
  });

  return {
    type: "image/png",
    base64: figma.base64Encode(bytes)
  };
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
  if (!res.ok) throw new Error("API " + res.status + ": " + text);
  return text;
}

// init UI
(async () => {
  const apiBase = await figma.clientStorage.getAsync("bte_apiBase");
  const apiKey = await figma.clientStorage.getAsync("bte_apiKey");
  figma.ui.postMessage({ type: "INIT", apiBase: apiBase || "", apiKey: apiKey || "" });
})();

figma.ui.onmessage = async (msg: any) => {
  if (!msg || msg.type !== "EXPORT") return;

  const apiBase = String(msg.apiBase || "").trim();
  const apiKey = String(msg.apiKey || "").trim();

  if (!apiBase) return figma.notify("Inserisci API Base URL");
  if (!apiKey) return figma.notify("Inserisci API Key");

  await figma.clientStorage.setAsync("bte_apiBase", apiBase);
  await figma.clientStorage.setAsync("bte_apiKey", apiKey);

  const node = figma.currentPage.selection[0];
  if (!node) return figma.notify("Seleziona un FRAME o un nodo prima di esportare");

  figma.notify("Export in corso…");

  const assets = new Map<string, any>();
  const tree = await serializeNode(node, assets);
  const preview = await exportPreviewPng(node);

  // ✅ QUI: meta.fileKey sempre valorizzato
  // ✅ QUI: meta.nodeId corretto
  // ✅ QUI: tree sempre presente
  const pkg = {
    meta: {
      fileKey: safeFileKey(),
      fileName: safeFileName(),
      pageName: figma.currentPage.name,
      nodeId: node.id,
      nodeName: node.name,
      exportedAt: new Date().toISOString()
    },
    tree: tree,
    assets: Array.from(assets.values()),
    preview: preview
  };

  // Debug utile se serve:
  // console.log("BTE payload", pkg);

  try {
    await postJson(apiBase + "/figma/import", apiKey, pkg);
    figma.notify("✅ Inviato a /figma/import");
  } catch (e) {
    figma.notify("❌ " + String(e));
  }
};
