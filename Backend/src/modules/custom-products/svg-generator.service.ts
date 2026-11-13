import type { Transform2D } from './custom-product.types.js';

export interface SvgLayerConfig {
  ordenCapa: number;
  nombreCapa: string;
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
  /**
   * Genera el atributo transform para un elemento SVG segun Transform2D
   */
  static buildSvgTransform(transform?: Transform2D): string {
    if (!transform) return '';
    const { posicionX = 0, posicionY = 0, escalaZoom = 1, rotacionGrados = 0 } = transform;
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
   * Compone un SVG completo multicapa ordenado por ordenCapaSvg
   */
  static composeSvg(params: ComposeSvgParams): string {
    const ancho = params.ancho || 600;
    const alto = params.alto || 600;

    const capasOrdenadas = [...params.capas].sort((a, b) => a.ordenCapa - b.ordenCapa);

    const transformGlobalStr = this.buildSvgTransform(params.transformGlobal);

    const layerElements: string[] = [];

    // 1. Imagen base si existe
    if (params.imagenBaseUrl) {
      layerElements.push(
        `<image href="${params.imagenBaseUrl}" x="0" y="0" width="${ancho}" height="${alto}" preserveAspectRatio="xMidYMid meet" id="base-layer" />`
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
      const transformCapa = this.buildSvgTransform(capa.transform);
      const capaId = `layer-${capa.ordenCapa}-${capa.nombreCapa.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      if (capa.imagenUrl) {
        layerElements.push(
          `<g id="${capaId}" ${transformCapa}>
            <image href="${capa.imagenUrl}" x="0" y="0" width="${ancho}" height="${alto}" preserveAspectRatio="xMidYMid meet" />
          </g>`
        );
      } else if (capa.colorHex) {
        layerElements.push(
          `<g id="${capaId}" ${transformCapa}>
            <rect x="0" y="0" width="${ancho}" height="${alto}" fill="${capa.colorHex}" opacity="0.35" />
          </g>`
        );
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}">
      <g id="custom-canvas" ${transformGlobalStr}>
        ${layerElements.join('\n        ')}
      </g>
    </svg>`;
  }
}

