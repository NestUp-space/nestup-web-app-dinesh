export const leftPlankTemplate = `function calculateProperties(runtimeInputs, globalConstants) {
  const {
    boxDepth,
    boxHeight,
    leftAdjacency,
    skirting,
    outerMaterialCode,
    innerMaterialCode
  } = runtimeInputs;

  const {
    MATERIAL_THICKNESS,
    EDGE_BANDING
  } = globalConstants;

  return {
    width: leftAdjacency === 'Expose'
      ? boxDepth - MATERIAL_THICKNESS.expose - (2 * EDGE_BANDING.COLOR_EDGEBANDING)
      : boxDepth - MATERIAL_THICKNESS.inner - (2 * EDGE_BANDING.INNER_EDGEBANDING),
    
    height: leftAdjacency === 'Expose'
      ? boxHeight - (2 * EDGE_BANDING.COLOR_EDGEBANDING)
      : boxHeight - skirting - (2 * EDGE_BANDING.INNER_EDGEBANDING),
    
    materialCode: leftAdjacency === 'Expose' ? outerMaterialCode : innerMaterialCode
  };
}`;

export const rightPlankTemplate = `function calculateProperties(runtimeInputs, globalConstants) {
  const {
    boxDepth,
    boxHeight,
    rightAdjacency,
    skirting,
    outerMaterialCode,
    innerMaterialCode
  } = runtimeInputs;

  const {
    MATERIAL_THICKNESS,
    EDGE_BANDING
  } = globalConstants;

  return {
    width: rightAdjacency === 'Expose'
      ? boxDepth - MATERIAL_THICKNESS.expose - (2 * EDGE_BANDING.COLOR_EDGEBANDING)
      : boxDepth - MATERIAL_THICKNESS.inner - (2 * EDGE_BANDING.INNER_EDGEBANDING),
    
    height: rightAdjacency === 'Expose'
      ? boxHeight - (2 * EDGE_BANDING.COLOR_EDGEBANDING)
      : boxHeight - skirting - (2 * EDGE_BANDING.INNER_EDGEBANDING),
    
    materialCode: rightAdjacency === 'Expose' ? outerMaterialCode : innerMaterialCode
  };
}`;

export const topPlankTemplate = `function calculateProperties(runtimeInputs, globalConstants) {
  const {
    boxWidth,
    boxDepth,
    leftAdjacency,
    rightAdjacency,
    innerMaterialCode
  } = runtimeInputs;

  const {
    MATERIAL_THICKNESS,
    EDGE_BANDING
  } = globalConstants;

  const width = (leftAdjacency === 'Expose' && rightAdjacency === 'Expose')
    ? boxWidth - (2 * EDGE_BANDING.COLOR_EDGEBANDING) - MATERIAL_THICKNESS.expose
    : (leftAdjacency === 'Expose' || rightAdjacency === 'Expose')
      ? boxWidth - (2 * EDGE_BANDING.INNER_EDGEBANDING) - MATERIAL_THICKNESS.expose - MATERIAL_THICKNESS.inner
      : boxWidth - (2 * EDGE_BANDING.INNER_EDGEBANDING) - (2 * MATERIAL_THICKNESS.inner);

  return {
    width,
    height: boxDepth - (2 * MATERIAL_THICKNESS.inner) - MATERIAL_THICKNESS.back - MATERIAL_THICKNESS.expose,
    materialCode: innerMaterialCode
  };
}`;

export const bottomPlankTemplate = `function calculateProperties(runtimeInputs, globalConstants) {
  const {
    boxWidth,
    boxDepth,
    leftAdjacency,
    rightAdjacency,
    innerMaterialCode
  } = runtimeInputs;

  const {
    MATERIAL_THICKNESS,
    EDGE_BANDING
  } = globalConstants;

  const width = (leftAdjacency === 'Expose' && rightAdjacency === 'Expose')
    ? boxWidth - (2 * EDGE_BANDING.COLOR_EDGEBANDING) - MATERIAL_THICKNESS.expose
    : (leftAdjacency === 'Expose' || rightAdjacency === 'Expose')
      ? boxWidth - (2 * EDGE_BANDING.INNER_EDGEBANDING) - MATERIAL_THICKNESS.expose - MATERIAL_THICKNESS.inner
      : boxWidth - (2 * EDGE_BANDING.INNER_EDGEBANDING) - (2 * MATERIAL_THICKNESS.inner);

  return {
    width,
    height: boxDepth - (2 * MATERIAL_THICKNESS.inner) - MATERIAL_THICKNESS.back - MATERIAL_THICKNESS.expose,
    materialCode: innerMaterialCode
  };
}`;

export const backPanelTemplate = `function calculateProperties(runtimeInputs, globalConstants) {
  const {
    boxWidth,
    boxHeight,
    leftAdjacency,
    rightAdjacency,
    skirting,
    innerMaterialCode
  } = runtimeInputs;

  const {
    MATERIAL_THICKNESS
  } = globalConstants;

  const width = (leftAdjacency === 'Expose' && rightAdjacency === 'Expose')
    ? boxWidth - (2 * (MATERIAL_THICKNESS.expose - 10))
    : (leftAdjacency === 'Expose' || rightAdjacency === 'Expose')
      ? boxWidth - (MATERIAL_THICKNESS.expose - 10)
      : boxWidth;

  return {
    width,
    height: boxHeight - skirting,
    materialCode: innerMaterialCode
  };
}`;

export const doorTemplate = `function calculateProperties(runtimeInputs, globalConstants) {
  const {
    boxWidth,
    boxHeight,
    hasDoor,
    skirting,
    outerMaterialCode
  } = runtimeInputs;

  if (!hasDoor) return null;
  
  return {
    width: boxWidth <= 600 ? boxWidth - 4 : boxWidth / 2 - 4,
    height: boxHeight - (4 + skirting),
    materialCode: outerMaterialCode
  };
}`;

export const getDefaultTemplate = (plankPosition: 'left' | 'right' | 'top' | 'bottom' | 'back' | 'door') => {
  const templates = {
    left: leftPlankTemplate,
    right: rightPlankTemplate,
    top: topPlankTemplate,
    bottom: bottomPlankTemplate,
    back: backPanelTemplate,
    door: doorTemplate
  };
  return templates[plankPosition] || leftPlankTemplate;
};
