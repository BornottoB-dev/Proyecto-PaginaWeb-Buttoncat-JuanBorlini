import type { Transform2D } from './custom-product.types.js';

export interface SvgLayerConfig {
  ordenCapa: number;
  nombreCapa: string;
  keyVariacion?: string;
  targetGroupKey?: string;
  imagenUrl?: string;
  colorHex?: string;
  transform?: Transform2D;
}

export interface ComposeSvgParams {
  ancho?: number;
  alto?: number;
  imagenBaseUrl?: string;
  transformGlobal?: Transform2D;
  capas: SvgLayerConfig[];
  imagenSubidaUrl?: string;
  transformImagenSubida?: Transform2D;
}

export class SvgGeneratorService {
  private static hexToRgbNormalized(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '').trim();
    const full =
      clean.length === 3
        ? clean
            .split('')
            .map((c) => c + c)
            .join('')
        : clean;
    const num = parseInt(full, 16);
    if (isNaN(num)) return { r: 1, g: 1, b: 1 };
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255,
    };
  }

  private static slugify(str: string): string {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  /**
   * Genera el atributo transform para un elemento SVG segun Transform2D
   */
  static buildSvgTransform(transform?: Transform2D): string {
    if (!transform) return '';
    const raw = transform as any;
    const posicionX = raw.posicionX ?? raw.posX ?? 0;
    const posicionY = raw.posicionY ?? raw.posY ?? 0;
    const escalaZoom = raw.escalaZoom ?? (raw.zoom !== undefined ? raw.zoom / 100 : 1);
    const rotacionGrados = raw.rotacionGrados ?? raw.rotate ?? 0;
    const parts: string[] = [];

    if (posicionX !== 0 || posicionY !== 0) {
      parts.push(`translate(${posicionX}, ${posicionY})`);
    }
    if (rotacionGrados !== 0) {
      parts.push(`rotate(${rotacionGrados})`);
    }
    if (escalaZoom !== 1 && escalaZoom > 0) {
      parts.push(`scale(${escalaZoom})`);
    }

    return parts.length > 0 ? `transform="${parts.join(' ')}"` : '';
  }

  /**
   * Compone un SVG completo multicapa ordenado por ordenCapaSvg con soporte de filtros de color por capa
   */
  static composeSvg(params: ComposeSvgParams): string {
    const ancho = params.ancho || 600;
    const alto = params.alto || 600;

    const capasOrdenadas = [...params.capas].sort((a, b) => a.ordenCapa - b.ordenCapa);

    // Resolver mapa de tintes (targetGroupKey -> colorHex)
    const layerTintMap: Record<string, string> = {};
    const imageLayers = capasOrdenadas.filter((c) => Boolean(c.imagenUrl && c.imagenUrl.trim().length > 0));

    for (const capa of capasOrdenadas) {
      const hasImage = Boolean(capa.imagenUrl && capa.imagenUrl.trim().length > 0);
      if (hasImage || !capa.colorHex) continue;

      const rawTarget = capa.targetGroupKey || (capa.transform as any)?.targetGroupKey;
      if (rawTarget) {
        if (rawTarget === '__BASE_MOCKUP__') {
          layerTintMap['__BASE_MOCKUP__'] = capa.colorHex;
          continue;
        }
        const matchedImgLayer = imageLayers.find(
          (il) =>
            this.slugify(il.keyVariacion || '') === this.slugify(rawTarget) ||
            (il.keyVariacion || '').toLowerCase() === rawTarget.toLowerCase()
        );
        if (matchedImgLayer && matchedImgLayer.keyVariacion) {
          layerTintMap[this.slugify(matchedImgLayer.keyVariacion)] = capa.colorHex;
          continue;
        }
      }

      if (imageLayers.length > 0 && imageLayers[0].keyVariacion) {
        layerTintMap[this.slugify(imageLayers[0].keyVariacion)] = capa.colorHex;
      } else {
        layerTintMap['__BASE_MOCKUP__'] = capa.colorHex;
      }
    }

    const transformGlobalStr = this.buildSvgTransform(params.transformGlobal);
    const filterDefs: string[] = [];
    const layerElements: string[] = [];

    const buildFilterDef = (filterId: string, hexColor: string) => {
      const rgb = this.hexToRgbNormalized(hexColor);
      return `<filter id="${filterId}" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="1 1 1 0 0  1 1 1 0 0  1 1 1 0 0  0 0 0 1 0" result="mask" />
          <feComponentTransfer in="mask" result="tinted">
            <feFuncR type="table" tableValues="0 ${rgb.r.toFixed(4)}" />
            <feFuncG type="table" tableValues="0 ${rgb.g.toFixed(4)}" />
            <feFuncB type="table" tableValues="0 ${rgb.b.toFixed(4)}" />
          </feComponentTransfer>
        </filter>`;
    };

    // 1. Imagen base si existe
    if (params.imagenBaseUrl) {
      const baseTint = layerTintMap['__BASE_MOCKUP__'];
      let filterAttr = '';
      if (baseTint) {
        filterDefs.push(buildFilterDef('tint-base-mockup', baseTint));
        filterAttr = ' filter="url(#tint-base-mockup)"';
      }
      layerElements.push(
        `<image href="${params.imagenBaseUrl}" x="0" y="0" width="${ancho}" height="${alto}" preserveAspectRatio="xMidYMid meet" id="base-layer"${filterAttr} />`
      );
    }

    // 2. Imagen subida por el cliente si existe
    if (params.imagenSubidaUrl) {
      const transformUserImg = this.buildSvgTransform(params.transformImagenSubida);
      layerElements.push(
        `<g id="user-upload-layer" ${transformUserImg}>
          <image href="${params.imagenSubidaUrl}" x="0" y="0" width="${ancho}" height="${alto}" preserveAspectRatio="xMidYMid meet" />
        </g>`
      );
    }

    // 3. Capas dinamicas de opciones seleccionadas
    for (const capa of capasOrdenadas) {
      if (!capa.imagenUrl || !capa.imagenUrl.trim()) continue;
      const transformCapa = this.buildSvgTransform(capa.transform);
      const capaId = `layer-${capa.ordenCapa}-${capa.nombreCapa.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const varSlug = this.slugify(capa.keyVariacion || '');
      const ownColorFallback =
        capa.colorHex && capa.colorHex.toUpperCase() !== '#18181B' ? capa.colorHex : undefined;
      const effectiveTint = (varSlug ? layerTintMap[varSlug] : undefined) || ownColorFallback;

      let filterAttr = '';
      if (effectiveTint) {
        const filterId = `tint-${capaId}`;
        filterDefs.push(buildFilterDef(filterId, effectiveTint));
        filterAttr = ` filter="url(#${filterId})"`;
      }

      layerElements.push(
        `<g id="${capaId}" ${transformCapa}>
          <image href="${capa.imagenUrl}" x="0" y="0" width="${ancho}" height="${alto}" preserveAspectRatio="xMidYMid meet"${filterAttr} />
        </g>`
      );
    }

    const defsBlock =
      filterDefs.length > 0
        ? `<defs>\n        ${filterDefs.join('\n        ')}\n      </defs>\n      `
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}">
      ${defsBlock}<g id="custom-canvas" ${transformGlobalStr}>
        ${layerElements.join('\n        ')}
      </g>
    </svg>`;
  }
}

