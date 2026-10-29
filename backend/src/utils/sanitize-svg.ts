import { DOMParser, XMLSerializer, type Element } from "@xmldom/xmldom";
import { AppError } from "./AppError";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const allowedElements = new Set([
  "svg", "g", "defs", "symbol", "use", "image", "title", "desc", "rect", "circle", "ellipse", "line",
  "polyline", "polygon", "path", "text", "tspan", "textPath", "marker", "pattern", "linearGradient",
  "radialGradient", "stop", "clipPath", "mask", "filter", "feGaussianBlur", "feOffset", "feBlend",
  "feColorMatrix", "feComponentTransfer", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feMerge",
  "feMergeNode", "style",
]);
const allowedAttributes = new Set([
  "id", "class", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "width", "height",
  "viewBox", "preserveAspectRatio", "d", "points", "transform", "version", "xmlns", "xmlns:xlink",
  "xml:space", "image-rendering",
  "fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
  "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset", "stroke-opacity", "opacity", "display",
  "visibility", "vector-effect", "clip-path", "clip-rule", "mask", "filter", "marker-start", "marker-mid",
  "marker-end", "font-family", "font-size", "font-style", "font-weight", "text-anchor", "dominant-baseline",
  "alignment-baseline", "letter-spacing", "word-spacing", "text-decoration", "direction", "writing-mode",
  "style", "href", "xlink:href", "gradientUnits", "gradientTransform", "spreadMethod", "offset",
  "stop-color", "stop-opacity", "clipPathUnits", "maskUnits", "maskContentUnits", "patternUnits",
  "patternContentUnits", "patternTransform", "markerWidth", "markerHeight", "markerUnits", "refX", "refY",
  "orient", "filterUnits", "primitiveUnits", "in", "in2", "result", "type", "values", "stdDeviation",
  "dx", "dy", "mode", "operator", "k1", "k2", "k3", "k4", "flood-color", "flood-opacity", "surfaceScale",
  "scale", "numOctaves", "seed", "baseFrequency", "aria-label", "role",
]);
const safeStyleProperties = new Set([
  "alignment-baseline", "baseline-shift", "clip-path", "clip-rule", "color", "direction", "display",
  "dominant-baseline", "fill", "fill-opacity", "fill-rule", "filter", "font-family", "font-size",
  "font-style", "font-weight", "letter-spacing", "marker-end", "marker-mid", "marker-start", "mask",
  "opacity", "overflow", "paint-order", "shape-rendering", "stop-color", "stop-opacity", "stroke",
  "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit",
  "stroke-opacity", "stroke-width", "text-anchor", "text-decoration", "vector-effect", "visibility",
  "word-spacing", "writing-mode",
]);

function isSafeValue(value: string): boolean {
  const normalized = value.trim();
  if (!normalized || /[\\<>\u0000-\u001f]|javascript:|data:|https?:|@import|expression\s*\(/i.test(normalized)) return false;
  const urlMatches = normalized.match(/url\([^)]*\)/gi) ?? [];
  return urlMatches.every((url) => /^url\(#[-\w:.]+\)$/i.test(url)) &&
    normalized.replace(/url\(#[-\w:.]+\)/gi, "").toLowerCase().indexOf("url(") === -1;
}

function sanitizeDeclarations(source: string): string {
  return source.split(";").flatMap((declaration) => {
    const separator = declaration.indexOf(":");
    if (separator < 1) return [];
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    return safeStyleProperties.has(property) && isSafeValue(value) ? [`${property}:${value}`] : [];
  }).join(";");
}

function sanitizeStylesheet(source: string): string {
  if (/[\\\u0000-\u0008\u000b\u000c\u000e-\u001f]|@import/i.test(source)) return "";
  const rules: string[] = [];
  const normalized = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
  for (const match of normalized.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].trim();
    if (!/^[\w#.*:, >+~()[\]="'-]+$/.test(selector)) continue;
    const declarations = sanitizeDeclarations(match[2]);
    if (declarations) rules.push(`${selector}{${declarations}}`);
  }
  return rules.join("");
}

function sanitizeEmbeddedRaster(value: string, maxBytes: number): string | null {
  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const encoded = /\s/.test(match[2]) ? match[2].replace(/\s/g, "") : match[2];
  if (!encoded || encoded.length % 4 !== 0 || !/^[a-z0-9+/]*={0,2}$/i.test(encoded)) return null;
  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const dataLength = encoded.length - padding;
  if ((padding === 2 && dataLength % 4 !== 2) || (padding === 1 && dataLength % 4 !== 3) || (!padding && dataLength % 4 !== 0)) return null;
  const decodedSize = encoded.length / 4 * 3 - padding;
  if (decodedSize > maxBytes) return null;
  const signature = Buffer.from(encoded.slice(0, 32), "base64");

  const matchesSignature = mime === "image/png"
    ? signature.length >= 8 && signature.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    : mime === "image/jpeg"
      ? signature.length >= 3 && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
      : signature.length >= 12 && signature.toString("ascii", 0, 4) === "RIFF" && signature.toString("ascii", 8, 12) === "WEBP";
  return matchesSignature ? `data:${mime};base64,${encoded}` : null;
}

function sanitizeElement(element: Element, budget: { nodes: number; depth: number; maxEmbeddedImageBytes: number }): void {
  const elementName = element.localName ?? element.nodeName;
  if (element.namespaceURI !== SVG_NAMESPACE || !allowedElements.has(elementName)) {
    element.parentNode?.removeChild(element);
    return;
  }

  for (let index = element.attributes.length - 1; index >= 0; index -= 1) {
    const attribute = element.attributes.item(index);
    if (!attribute) continue;
    const name = attribute.name;
    const localName = attribute.localName ?? name;
    if (name === "xmlns" && element === element.ownerDocument?.documentElement && attribute.value === SVG_NAMESPACE) continue;
    if (name === "xmlns:xlink" && attribute.value === XLINK_NAMESPACE) continue;
    if (name === "xlink:href" && attribute.namespaceURI === XLINK_NAMESPACE) {
      if (elementName === "use" && /^#[-\w:.]+$/.test(attribute.value)) continue;
      if (elementName === "image") {
        const embeddedRaster = sanitizeEmbeddedRaster(attribute.value, budget.maxEmbeddedImageBytes);
        if (embeddedRaster) {
          attribute.value = embeddedRaster;
          continue;
        }
      }
      element.removeAttributeNode(attribute);
      continue;
    }
    if (name === "xml:space" && attribute.namespaceURI === XML_NAMESPACE) {
      if (attribute.value === "preserve" || attribute.value === "default") continue;
      element.removeAttributeNode(attribute);
      continue;
    }
    if (attribute.namespaceURI || !allowedAttributes.has(name)) {
      element.removeAttributeNode(attribute);
      continue;
    }
    if (name === "href") {
      if (elementName === "use" && /^#[-\w:.]+$/.test(attribute.value)) continue;
      if (elementName === "image") {
        const embeddedRaster = sanitizeEmbeddedRaster(attribute.value, budget.maxEmbeddedImageBytes);
        if (embeddedRaster) {
          attribute.value = embeddedRaster;
          continue;
        }
      }
      element.removeAttributeNode(attribute);
      continue;
    }
    if (name === "style") {
      const style = sanitizeDeclarations(attribute.value);
      if (style) element.setAttribute(name, style);
      else element.removeAttribute(name);
      continue;
    }
    if (name === "id" || name === "class") {
      if (!/^[\w .-]+$/.test(attribute.value)) element.removeAttribute(name);
      continue;
    }
    if (name !== "xmlns:xlink" && !isSafeValue(attribute.value)) element.removeAttributeNode(attribute);
    if (localName.toLowerCase().startsWith("on")) element.removeAttributeNode(attribute);
  }

  for (let index = element.childNodes.length - 1; index >= 0; index -= 1) {
    const child = element.childNodes.item(index);
    if (!child) continue;
    budget.nodes += 1;
    if (budget.nodes > 50000 || budget.depth >= 64) {
      throw new AppError(400, "The SVG chart is too complex to process safely.", "INVALID_SVG");
    }
    if (child.nodeType === 1) {
      budget.depth += 1;
      sanitizeElement(child as Element, budget);
      budget.depth -= 1;
    } else if (child.nodeType !== 3 && child.nodeType !== 4) {
      element.removeChild(child);
    } else if ((child.nodeType === 3 || child.nodeType === 4) && elementName === "style") {
      const styles = sanitizeStylesheet(child.textContent ?? "");
      if (styles) child.textContent = styles;
      else element.removeChild(child);
    }
  }
}

function removeExternalDoctype(source: string): string {
  const start = source.search(/<!DOCTYPE\b/i);
  if (start === -1) return source;
  const declaration = source.slice(start);
  let quote: "'" | '"' | null = null;
  for (let index = 0; index < declaration.length; index += 1) {
    const character = declaration[index];
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }
    if (character === "[") {
      throw new AppError(400, "SVG files with internal declarations are not allowed.", "INVALID_SVG");
    }
    if (character === ">") {
      return source.slice(0, start) + source.slice(start + index + 1);
    }
  }
  throw new AppError(400, "The SVG chart has an incomplete document declaration.", "INVALID_SVG");
}

export function sanitizeSvgUpload(
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  maxBytes: number,
  label = "SVG chart",
): { buffer: Buffer; extension: "svg"; mime: "image/svg+xml" } {
  if (!file.originalname.toLowerCase().endsWith(".svg") || file.mimetype.toLowerCase() !== "image/svg+xml") {
    throw new AppError(400, `Upload a valid ${label} SVG file.`, "INVALID_SVG");
  }
  if (file.size > maxBytes) {
    throw new AppError(400, `The ${label} exceeds the ${maxBytes / (1024 * 1024)}MB size limit.`, "FILE_TOO_LARGE");
  }

  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(file.buffer);
  } catch {
    throw new AppError(400, `The ${label} is not valid UTF-8 SVG XML.`, "INVALID_SVG");
  }
  if (/<!ENTITY/i.test(source)) {
    throw new AppError(400, `The ${label} is not safe or valid SVG XML.`, "INVALID_SVG");
  }
  source = removeExternalDoctype(source);

  try {
    const document = new DOMParser({
      onError(level, message) {
        throw new Error(`${level}: ${message}`);
      },
    }).parseFromString(source, "image/svg+xml");
    const root = document.documentElement;
    if (!root || root.localName !== "svg" || root.namespaceURI !== SVG_NAMESPACE) {
      throw new Error("Missing SVG root element.");
    }
    sanitizeElement(root, { nodes: 1, depth: 0, maxEmbeddedImageBytes: maxBytes });
    const sanitized = new XMLSerializer().serializeToString(root, { requireWellFormed: true });
    return { buffer: Buffer.from(sanitized, "utf8"), extension: "svg", mime: "image/svg+xml" };
  } catch {
    throw new AppError(400, `The ${label} is not safe or valid SVG XML.`, "INVALID_SVG");
  }
}
