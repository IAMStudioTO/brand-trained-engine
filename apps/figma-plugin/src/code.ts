figma.showUI(__html__, { width: 360, height: 310 });

function safeString(v: any, fallback: string): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v);
  return s ? s : fallback;
}

async function getFileNameSafe(): Promise<string> {
  // In molti casi figma.root.name è il nome del file
  try {
    return safeString((figma as any).root && (figma as any).root.name, "Figma File");
  } catch (e) {
    return "Figma File";
  }
}

function colorToHex(c: RGB): string {
  const r = Math.round(c.r * 255).toString(16).padStart(2, "0");
  const g = Math.round(c.g * 255).toString(16).padStart(2, "0");
  const b = Math.round(c.b * 255).toString(16).padStart(2, "0");
  return "#" + r + g + b;
}

function serializePaint(p: Paint): any {
  if (p.type === "SOLID") {
    return {
      type: "SOLID",
      color: colorToHex(p.color),
      opacity: p.opacity || 1,
      visible: p.visible !== false,
      blendMode: (p as any).blendMode || "NORMAL",
    };
  }

  if (
    p.type === "GRADIENT_LINEAR" ||
    p.type === "GRADIENT_RADIAL" ||
    p.type === "GRADIENT_ANGULAR" ||
    p.type === "GRADIENT_DIAMOND"
  ) {
    const stops = (p as any).gradientStops && Array.isArray((p as any).gradientStops) ? (p as any).gradientStops : [];
    return {
      type: p.type,
      visible: p.visible !== false,
      opacity: (p as any).opacity || 1,
      blendMode: (p as any).blendMode || "NORMAL",
      gradientStops: stops.map((s: any) => ({
        position: s.position,
        color: colorToHex(s.color),
        opacity: (s.color && s.color.a) ? s.color.a : 1,
      })),
      gradientTransform: (p as any).gradientTransform || null,
    };
  }

  if (p.type === "IMAGE") {
    return {
      type: "IMAGE",
      visible: p.visible !== false,
      opacity: (p as any).opacity || 1,
      blendMode: (p as any).blendMode || "NORMAL",
      scaleMode: (p as any).scaleMode,
      imageHash: (p as any).imageHash || null,
      rotation: (p as any).rotation || 0,
      filters: (p as any).filters || null,
    };
  }

  return { type: (p as any).type };
}

function serializeEffect(e: any): any {
  let colorHex: string | undefined = undefined;
  let colorOpacity: number | undefined = undefined;

  if (e && e.color) {
    try {
      colorHex = colorToHex(e.color);
      colorOpacity = typeof e.color.a === "number" ? e.color.a : 1;
    } catch (err) {}
  }

  return {
    type: e.type,
    visible: e.visible !== false,
    radius: typeof e.radius === "number" ? e.radius : undefined,
    color: colorHex,
    opacity: colorOpacity,
    offset: e.offset || undefined,
    spread: typeof e.spread === "number" ? e.spread : undefined,
    blendMode: e.blendMode || undefined,
  };
}

function commonNodeProps(node: SceneNode): any {
  const base: any = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    locked: node.locked,
    opacity: ("opacity" in node) ? (node as any).opacity : 1,
    blendMode: ("blendMode" in node) ? (node as any).blendMode : "NORMAL",
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
      bottomRight: (node as any).bottomRightRadius,
    };
  }

  if ("fills" in node) {
    const fills = (node as any).fills;
    if (fills !== figma.mixed && Array.isArray(fills)) base.fills = fills.map(serializePaint);
  }

  if ("strokes" in node) {
    const strokes = (node as any).strokes;
    if (strokes !== figma.mixed && Array.isArray(strokes)) base.strokes = strokes.map(serializePaint);
  }

  if ("strokeWeight" in node) base.strokeWeight = (node as any).strokeWeight;
  if ("strokeAlign" in node) base.strokeAlign = (node as any).strokeAlign;
  if ("dashPattern" in node) base.dashPattern = (node as any).dashPattern;

  if ("effects" in node) {
    const effects = (node as any).effects;
    if (effects !== figma.mixed && Array.isArray(effects)) base.effects = effects.map(serializeEffect);
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
      itemSpacing: (node as any).itemSpacing,
    };
  }

  if ("clipsContent" in node) base.clipsContent = (node as any).clipsContent;

  return base;
}

async function serializeNode(node: SceneNode): Promise<any> {
  const base = commonNodeProps(node);

  if (node.type === "TEXT") {
    const t = node as TextNode;

    const fontName = (t.fontName === figma.mixed) ? null : t.fontName;
    const fontSize = (t.fontSize === figma.mixed) ? null : t.fontSize;
    const lineHeight = (t.lineHeight === figma.mixed) ? null : t.lineHeight;
    const letterSpacing = (t.letterSpacing === figma.mixed) ? null : t.letterSpacing;

    return {
      ...base,
      characters: t.characters,
      textAlignHorizontal: t.textAlignHorizontal,
      textAlignVertical: t.textAlignVertical,
      textAutoResize: t.textAutoResize,
      fontName,
      fontSize,
      lineHeight,
      letterSpacing,
    };
  }

  if ("children" in node) {
    const children: any[] = [];
    const kids = (node as any).children as SceneNode[];
    for (let i = 0; i < kids.length; i++) {
      children.push(await serializeNode(kids[i]));
    }
    return { ...base, children };
  }

  return base;
}

async function exportPreviewPng(node: SceneNode) {
  const bytes = await node.exportAsync({
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
  if (!res.ok) throw new Error("API " + res.status + ": " + text);
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

figma.ui.onmessage = async (msg: any) => {
  if (!msg || msg.type !== "EXPORT") return;

  const apiBase = safeString(msg.apiBase, "").trim();
  const apiKey = safeString(msg.apiKey, "").trim();

  if (!apiBase) return figma.notify("Inserisci API Base URL");
  if (!apiKey) return figma.notify("Inserisci API Key");

  await figma.clientStorage.setAsync("bte_apiBase", apiBase);
  await figma.clientStorage.setAsync("bte_apiKey", apiKey);

  const node = figma.currentPage.selection && figma.currentPage.selection.length ? figma.currentPage.selection[0] : null;
  if (!node) return figma.notify("Seleziona un frame o un nodo prima di esportare");

  figma.notify("Export in corso…");

  // ✅ Garantiamo sempre i campi richiesti dall’API
  const fileKey = safeString((figma as any).fileKey, "local");
  const nodeId = safeString(node.id, "unknown-node");
  const tree = await serializeNode(node);
  const preview = await exportPreviewPng(node);

  const payload = {
    meta: {
      fileKey: fileKey,
      nodeId: nodeId,
      fileName: await getFileNameSafe(),
      pageName: safeString(figma.currentPage && figma.currentPage.name, "Page"),
      nodeName: safeString((node as any).name, "Node"),
      exportedAt: new Date().toISOString(),
    },
    tree: tree,
    preview: preview,
  };

  try {
    await postJson(apiBase + "/figma/import", apiKey, payload);
    figma.notify("✅ Inviato a /figma/import");
  } catch (e) {
    figma.notify("❌ " + String(e));
  }
};
