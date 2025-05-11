// Filename: createModelSimpleBoxTest.js
const puppeteer = require('puppeteer');

// --- Data to fill the form ---
const basicInfo = {
  modelName: 'Simple Box',
  description: 'A basic rectangular box with five planks: back, left, right, top, and bottom. Suitable for simple storage units, cabinets, and shelving.',
  catalogueImage: '/img/models/simple-box.png' // File upload needs careful handling
};

const inputParameters = [
  { id: 'boxHeight', displayLabel: 'Box Height', inputType: 'Number', defaultValue: '700', unit: 'mm', description: 'The overall height of the box.' },
  { id: 'boxWidth', displayLabel: 'Box Width', inputType: 'Number', defaultValue: '600', unit: 'mm', description: 'The overall width of the box.' },
  { id: 'boxDepth', displayLabel: 'Box Depth', inputType: 'Number', defaultValue: '550', unit: 'mm', description: 'The overall depth of the box.' },
  { id: 'leftAdjacency', displayLabel: 'Left Side Adjacency', inputType: 'Select', defaultValue: 'Expose', description: 'Defines how the left side is finished.' },
  { id: 'rightAdjacency', displayLabel: 'Right Side Adjacency', inputType: 'Select', defaultValue: 'Wall', description: 'Defines how the right side is finished.' },
  { id: 'outerMaterialCode', displayLabel: 'Outer Material', inputType: 'Text', defaultValue: 'OUTER_MAT_01', description: 'Material for external surfaces.' }, // Assuming text input for material codes for simplicity
  { id: 'innerMaterialCode', displayLabel: 'Inner Material', inputType: 'Text', defaultValue: 'INNER_MAT_01', description: 'Material for internal surfaces.' },
  { id: 'backMaterialCode', displayLabel: 'Back Panel Material', inputType: 'Text', defaultValue: 'BACK_MAT_01', description: 'Material for the back panel.' },
  { id: 'hasDoor', displayLabel: 'Has Door?', inputType: 'Checkbox', defaultValue: true, description: 'Indicates if the box includes a door.' },
  { id: 'doorExposedSide', displayLabel: 'Door Exposed Side', inputType: 'Select', defaultValue: 'Front', description: 'Specifies which side the door is on.' },
  { id: 'numberOfShelves', displayLabel: 'Number of Shelves', inputType: 'Number', defaultValue: '2', description: 'Number of internal shelves.' },
  { id: 'skirting', displayLabel: 'Skirting', inputType: 'Select', defaultValue: 'None', description: 'Type of skirting.' } // Assuming 0 for skirting means "None" or empty string for select
];

const billOfMaterials = [
  {
    itemName: 'Left Side Panel', itemType: 'Plank', itemDescription: 'The main left vertical panel of the box.', plankIdFormat: 'B1P1_L',
    itemLogicScript: `function calculateProperties(runtimeInputs, globalConstants) {
      const { boxHeight, boxDepth, leftAdjacency, skirting, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
      const { edgeBandingExposedThickness, edgeBandingInternalThickness, backPanelGrooveDepth } = globalConstants;
      const BH = boxHeight; const BD = boxDepth; const LE = leftAdjacency; const SKT = skirting || 0;
      const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ELC = outerMaterialDefinition.code; const ILC = innerMaterialDefinition.code;
      const CEB = edgeBandingExposedThickness; const IEB = edgeBandingInternalThickness;
      let plankWidth, plankHeight, materialCode, plankThickness, grainDirection;
      const screwHoles = []; const vbScrewHoles = []; let backPanelGroove = null;
      const name = 'Left Plank'; const plankId = 'B1P1_L';
      if (LE === 'Expose') {
        plankWidth = BD - ET - (2 * CEB); plankHeight = BH - (2 * CEB); materialCode = ELC; plankThickness = ET; grainDirection = outerMaterialDefinition.grainDirection;
      } else {
        plankWidth = BD - IT - BT - (2 * IEB); plankHeight = BH - SKT - (2 * IEB); materialCode = ILC; plankThickness = IT; grainDirection = innerMaterialDefinition.grainDirection;
      }
      if (LE !== 'Expose') {
        screwHoles.push({ x: plankWidth / 4, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 2, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: (3 * plankWidth) / 4, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 4, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 2, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: (3 * plankWidth) / 4, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
      }
      if (LE === 'Expose') {
        vbScrewHoles.push({ x: 50 - CEB, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        vbScrewHoles.push({ x: plankWidth - 50 + CEB, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        if (plankWidth > 450) vbScrewHoles.push({ x: plankWidth / 2, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        vbScrewHoles.push({ x: 50 - CEB, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        vbScrewHoles.push({ x: plankWidth - 50 + CEB, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        if (plankWidth > 450) vbScrewHoles.push({ x: plankWidth / 2, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
      }
      let grooveTypeL = ''; if (BT === 8) grooveTypeL = 'T7'; else if (BT === 10) grooveTypeL = 'T8'; else if (BT === 12) grooveTypeL = 'T9'; else if (BT === 14) grooveTypeL = 'T10';
      if (grooveTypeL) {
        const grooveOffsetFromBackEdge = globalConstants.backPanelGrooveDepth || 10;
        backPanelGroove = { x1: plankWidth - grooveOffsetFromBackEdge - (BT / 2), y1: SKT > 0 ? SKT : (LE === 'Expose' ? CEB : IEB), x2: plankWidth - grooveOffsetFromBackEdge - (BT / 2), y2: plankHeight - (LE === 'Expose' ? CEB : IEB), depth: BT / 2, type: grooveTypeL };
      }
      return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles, vbScrewHoles, backPanelGroove };
    }`
  },
  {
    itemName: "Right Side Panel", itemType: "Plank", itemDescription: "The main right vertical panel of the box.", plankIdFormat: "B1P1_R",
    itemLogicScript: `function calculateProperties(runtimeInputs, globalConstants) {
      const { boxHeight, boxDepth, rightAdjacency, skirting, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
      const { edgeBandingExposedThickness, edgeBandingInternalThickness, backPanelGrooveDepth } = globalConstants;
      const BH = boxHeight; const BD = boxDepth; const RE = rightAdjacency; const SKT = skirting || 0;
      const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ELC = outerMaterialDefinition.code; const ILC = innerMaterialDefinition.code;
      const CEB = edgeBandingExposedThickness; const IEB = edgeBandingInternalThickness;
      let plankWidth, plankHeight, materialCode, plankThickness, grainDirection;
      const screwHoles = []; const vbScrewHoles = []; let backPanelGroove = null;
      const name = 'Right Plank'; const plankId = 'B1P1_R';
      if (RE === 'Expose') {
        plankWidth = BD - ET - (2 * CEB); plankHeight = BH - (2 * CEB); materialCode = ELC; plankThickness = ET; grainDirection = outerMaterialDefinition.grainDirection;
      } else {
        plankWidth = BD - IT - BT - (2 * IEB); plankHeight = BH - SKT - (2 * IEB); materialCode = ILC; plankThickness = IT; grainDirection = innerMaterialDefinition.grainDirection;
      }
      if (RE !== 'Expose') {
        screwHoles.push({ x: plankWidth / 4, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 2, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: (3 * plankWidth) / 4, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 4, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 2, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: (3 * plankWidth) / 4, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
      }
      if (RE === 'Expose') {
        vbScrewHoles.push({ x: 50 - CEB, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        vbScrewHoles.push({ x: plankWidth - 50 + CEB, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        if (plankWidth > 450) vbScrewHoles.push({ x: plankWidth / 2, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        vbScrewHoles.push({ x: 50 - CEB, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        vbScrewHoles.push({ x: plankWidth - 50 + CEB, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        if (plankWidth > 450) vbScrewHoles.push({ x: plankWidth / 2, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
      }
      let grooveTypeR = ''; if (BT === 8) grooveTypeR = 'T7'; else if (BT === 10) grooveTypeR = 'T8'; else if (BT === 12) grooveTypeR = 'T9'; else if (BT === 14) grooveTypeR = 'T10';
      if (grooveTypeR) {
        const grooveOffsetFromBackEdge = globalConstants.backPanelGrooveDepth || 10;
        backPanelGroove = { x1: plankWidth - grooveOffsetFromBackEdge - (BT / 2), y1: SKT > 0 ? SKT : (RE === 'Expose' ? CEB : IEB), x2: plankWidth - grooveOffsetFromBackEdge - (BT / 2), y2: plankHeight - (RE === 'Expose' ? CEB : IEB), depth: BT / 2, type: grooveTypeR };
      }
      return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles, vbScrewHoles, backPanelGroove };
    }`
  },
  {
    itemName: "Top Panel", itemType: "Plank", itemDescription: "The main top horizontal panel of the box.", plankIdFormat: "B1P1_T",
    itemLogicScript: `function calculateProperties(runtimeInputs, globalConstants) {
      const { boxWidth, boxDepth, leftAdjacency, rightAdjacency, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
      const { edgeBandingInternalThickness } = globalConstants;
      const BW = boxWidth; const BD = boxDepth; const LE = leftAdjacency; const RE = rightAdjacency;
      const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ILC = innerMaterialDefinition.code;
      const IEB = edgeBandingInternalThickness;
      let plankWidth, plankHeight; const screwHoles = []; const vbScrewHoles = []; const backPanelGroove = null;
      const name = 'Top Plank'; const plankId = 'B1P1_T'; const materialCode = ILC; const plankThickness = IT; const grainDirection = innerMaterialDefinition.grainDirection;
      if (LE === 'Expose' && RE === 'Expose') {
        plankWidth = BW - (2 * ET) - (2 * IEB);
      } else if (LE === 'Expose' || RE === 'Expose') {
        plankWidth = BW - ET - IT - (2 * IEB);
      } else {
        plankWidth = BW - (2 * IT) - (2 * IEB);
      }
      plankHeight = BD - BT - (2 * IEB);
      if (LE === 'Expose') {
        vbScrewHoles.push({ x: IT / 2, y: 50, z: plankThickness - 14, type: 'T_VB_LE' });
        vbScrewHoles.push({ x: IT / 2, y: plankHeight - 50, z: plankThickness - 14, type: 'T_VB_LE' });
        if (plankHeight > 450) vbScrewHoles.push({ x: IT / 2, y: plankHeight / 2, z: plankThickness - 14, type: 'T_VB_LE' });
      }
      if (RE === 'Expose') {
        vbScrewHoles.push({ x: plankWidth - (IT / 2), y: 50, z: plankThickness - 14, type: 'T_VB_RE' });
        vbScrewHoles.push({ x: plankWidth - (IT / 2), y: plankHeight - 50, z: plankThickness - 14, type: 'T_VB_RE' });
        if (plankHeight > 450) vbScrewHoles.push({ x: plankWidth - (IT / 2), y: plankHeight / 2, z: plankThickness - 14, type: 'T_VB_RE' });
      }
      return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles, vbScrewHoles, backPanelGroove };
    }`
  },
  {
    itemName: "Bottom Panel", itemType: "Plank", itemDescription: "The main bottom horizontal panel of the box.", plankIdFormat: "B1P1_B",
    itemLogicScript: `function calculateProperties(runtimeInputs, globalConstants) {
      const { boxWidth, boxDepth, leftAdjacency, rightAdjacency, skirting, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
      const { edgeBandingInternalThickness } = globalConstants;
      const BW = boxWidth; const BD = boxDepth; const LE = leftAdjacency; const RE = rightAdjacency; const SKT = skirting || 0;
      const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ILC = innerMaterialDefinition.code;
      const IEB = edgeBandingInternalThickness;
      let plankWidth, plankHeight; const screwHoles = []; const vbScrewHoles = []; const backPanelGroove = null;
      const name = 'Bottom Plank'; const plankId = 'B1P1_B'; const materialCode = ILC; const plankThickness = IT; const grainDirection = innerMaterialDefinition.grainDirection;
      if (LE === 'Expose' && RE === 'Expose') {
        plankWidth = BW - (2 * ET) - (2 * IEB);
      } else if (LE === 'Expose' || RE === 'Expose') {
        plankWidth = BW - ET - IT - (2 * IEB);
      } else {
        plankWidth = BW - (2 * IT) - (2 * IEB);
      }
      plankHeight = BD - BT - (2 * IEB);
      if (LE === 'Expose') {
        vbScrewHoles.push({ x: IT / 2, y: 50, z: plankThickness - 14, type: 'B_VB_LE' });
        vbScrewHoles.push({ x: IT / 2, y: plankHeight - 50, z: plankThickness - 14, type: 'B_VB_LE' });
        if (plankHeight > 450) vbScrewHoles.push({ x: IT / 2, y: plankHeight / 2, z: plankThickness - 14, type: 'B_VB_LE' });
      }
      if (RE === 'Expose') {
        vbScrewHoles.push({ x: plankWidth - (IT / 2), y: 50, z: plankThickness - 14, type: 'B_VB_RE' });
        vbScrewHoles.push({ x: plankWidth - (IT / 2), y: plankHeight - 50, z: plankThickness - 14, type: 'B_VB_RE' });
        if (plankHeight > 450) vbScrewHoles.push({ x: plankWidth - (IT / 2), y: plankHeight / 2, z: plankThickness - 14, type: 'B_VB_RE' });
      }
      return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles, vbScrewHoles, backPanelGroove };
    }`
  },
  {
    itemName: "Back Panel", itemType: "Plank", itemDescription: "The rear closing panel of the box.", plankIdFormat: "B1P1_BP",
    itemLogicScript: `function calculateProperties(runtimeInputs, globalConstants) {
      const { boxWidth, boxHeight, leftAdjacency, rightAdjacency, skirting, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
      const BW = boxWidth; const BH = boxHeight; const LE = leftAdjacency; const RE = rightAdjacency; const SKT = skirting || 0;
      const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const BLC = backMaterialDefinition.code;
      let plankWidth, plankHeight; const screwHoles = []; const vbScrewHoles = []; const backPanelGroove = null;
      const name = 'Back Plank'; const plankId = 'B1P1_BP'; const materialCode = BLC; const plankThickness = BT; const grainDirection = backMaterialDefinition.grainDirection;
      const grooveDepthInSidePanel = globalConstants.backPanelGrooveDepth || 10; // Assumed depth of groove in side panels
      if (LE === 'Expose' && RE === 'Expose') {
        plankWidth = BW - 2 * ET + 2 * grooveDepthInSidePanel;
      } else if (LE === 'Expose' || RE === 'Expose') {
        plankWidth = BW - ET - IT + 2 * grooveDepthInSidePanel;
      } else {
        plankWidth = BW - 2 * IT + 2 * grooveDepthInSidePanel;
      }
      plankHeight = BH - SKT - (2 * IT) + (2 * grooveDepthInSidePanel); // Assumes back panel fits within top/bottom panels
      return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles, vbScrewHoles, backPanelGroove };
    }`
  },
  {
    itemName: "Door Panel", itemType: "Plank", itemDescription: "The front door panel.", plankIdFormat: "B1P1_D",
    itemLogicScript: `function calculateProperties(runtimeInputs, globalConstants) {
      const { door, boxWidth, boxHeight, skirting, doorMaterialDefinition } = runtimeInputs;
      const { edgeBandingExposedThickness, doorClearance } = globalConstants;
      if (!door || !door.hasDoor || !doorMaterialDefinition) return null;
      const BW = boxWidth; const BH = boxHeight; const SKT = skirting || 0;
      const DMT = doorMaterialDefinition.overallMaterialThickness_mm; const DMC = doorMaterialDefinition.code; const DMGrain = doorMaterialDefinition.grainDirection;
      const CEB = edgeBandingExposedThickness; const CLR = doorClearance;
      let plankWidth, plankHeight; const screwHoles = []; const vbScrewHoles = []; const backPanelGroove = null;
      const name = 'Door Plank'; const plankId = 'B1P1_D'; const materialCode = DMC; const plankThickness = DMT; const grainDirection = DMGrain;
      plankWidth = BW - (2 * CLR) - (2 * CEB);
      plankHeight = BH - SKT - (2 * CLR) - (2 * CEB);
      // TODO: Add hinge hole calculations
      return { plankId, name, width: parseFloat(plankWidth.toFixed(2)), height: parseFloat(plankHeight.toFixed(2)), thickness: plankThickness, materialCode, grainDirection, screwHoles, vbScrewHoles, backPanelGroove };
    }`
  },
  {
    itemName: "Internal Shelf", itemType: "Plank", itemDescription: "An internal shelf.", plankIdFormat: "B1P1_S[n]",
    itemLogicScript: `function calculateProperties(runtimeInputs, globalConstants) {
      const { numberOfShelves, boxWidth, boxDepth, leftAdjacency, rightAdjacency, outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition } = runtimeInputs;
      const { edgeBandingInternalThickness } = globalConstants;
      if (!numberOfShelves || numberOfShelves <= 0) return null;
      const S = numberOfShelves; const BW = boxWidth; const BD = boxDepth; const LE = leftAdjacency; const RE = rightAdjacency;
      const ET = outerMaterialDefinition.overallMaterialThickness_mm; const IT = innerMaterialDefinition.overallMaterialThickness_mm; const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ILC = innerMaterialDefinition.code; const IEB = edgeBandingInternalThickness;
      const shelfPlanks = []; const materialCode = ILC; const plankThickness = IT; const grainDirection = innerMaterialDefinition.grainDirection;
      let shelfWidthCalculated;
      if (LE === 'Expose' && RE === 'Expose') {
        shelfWidthCalculated = BW - (2 * ET) - (2 * IEB);
      } else if (LE === 'Expose' || RE === 'Expose') {
        shelfWidthCalculated = BW - ET - IT - (2 * IEB);
      } else {
        shelfWidthCalculated = BW - (2 * IT) - (2 * IEB);
      }
      const shelfDepthCalculated = BD - BT - (2 * IEB);
      for (let i = 0; i < S; i++) {
        shelfPlanks.push({
          plankId: \`B1P1_S\${i + 1}\`, name: \`Shelf \${i + 1}\`,
          width: parseFloat(shelfWidthCalculated.toFixed(2)), height: parseFloat(shelfDepthCalculated.toFixed(2)),
          thickness: plankThickness, materialCode, grainDirection,
          screwHoles: [], vbScrewHoles: [], backPanelGroove: null
        });
      }
      return shelfPlanks.length > 0 ? shelfPlanks : null;
    }`
  }
];

// --- Sample Global Constants (used by itemLogicScripts) ---
const sampleGlobalConstants = {
  edgeBandingExposedThickness: 1.0,
  edgeBandingInternalThickness: 0.5,
  backPanelGrooveDepth: 10,
  defaultSkirtingHeight: 70,
  doorClearance: 2
};


async function fillForm() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1300, height: 950 } });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard/catalogue/new', { waitUntil: 'networkidle2' });

  console.log('Page loaded. Starting to fill Basic Information...');
  // IMPORTANT: Update these selectors to match your actual UI (e.g., using data-testid attributes)
  await page.type('input#modelName', basicInfo.modelName); // Example: input[data-testid="modelName"]
  await page.type('textarea#modelDescription', basicInfo.description); // Example: textarea[data-testid="modelDescription"]
  // For Catalogue Image (input type="file"):
  // const imagePath = require('path').resolve(__dirname, basicInfo.catalogueImage); // Ensure image exists at this path
  // const inputUploadHandle = await page.$('input#catalogueImageUpload'); // Example: input[data-testid="catalogueImageUpload"]
  // await inputUploadHandle.uploadFile(imagePath);
  // console.log('Catalogue image potentially uploaded.');


  console.log('Basic Information filled. Starting Input Parameters...');
  const addParamButtonSelector = 'button#addParameterButton'; // Example: button[data-testid="addInputParameter"]
  for (let i = 0; i < inputParameters.length; i++) {
    const param = inputParameters[i];
    if (i > 0 || !(await page.$(`div.parameter-group[data-index="${0}"] input.paramId`))) { // Click 'Add Parameter' if not the first or if first isn't pre-rendered
        await page.click(addParamButtonSelector);
        await page.waitForTimeout(500); // Wait for new fields to appear
    }
    // Selectors for the i-th parameter group. These need to be specific.
    // Example: div.parameter-group[data-index="${i}"] or similar unique identifier for each group
    const paramGroupSelector = `div.parameter-group[data-index="${i}"]`; // Highly dependent on your UI structure

    await page.type(`${paramGroupSelector} input.paramId`, param.id); // e.g., input[data-testid="paramName"]
    await page.type(`${paramGroupSelector} input.paramDisplayLabel`, param.displayLabel); // e.g., input[data-testid="paramDisplayLabel"]
    
    // Handle inputType (select or text)
    const inputTypeSelector = `${paramGroupSelector} select.paramInputType`; // e.g., select[data-testid="paramInputType"]
    try {
        await page.select(inputTypeSelector, param.inputType); // For <select>
    } catch (e) {
        await page.type(inputTypeSelector.replace('select','input'), param.inputType); // Fallback for <input type="text">
    }

    if (param.inputType.toLowerCase() === 'boolean' || param.inputType.toLowerCase() === 'checkbox') {
        if (param.defaultValue === true || String(param.defaultValue).toLowerCase() === 'true') {
            await page.click(`${paramGroupSelector} input.paramDefaultValueCheckbox[type="checkbox"]`); // e.g., input[data-testid="paramDefaultValueCheckbox"]
        }
    } else {
        await page.type(`${paramGroupSelector} input.paramDefaultValue`, String(param.defaultValue)); // e.g., input[data-testid="paramDefaultValue"]
    }
    if (param.unit) {
      await page.type(`${paramGroupSelector} input.paramUnit`, param.unit); // e.g., input[data-testid="paramUnit"]
    }
    await page.type(`${paramGroupSelector} textarea.paramDescription`, param.description); // e.g., textarea[data-testid="paramDescription"]
    console.log(`Filled parameter: ${param.displayLabel}`);
  }

  console.log('Input Parameters filled. Starting Bill of Materials...');
  const addBoMItemButtonSelector = 'button#addBoMItemButton'; // Example: button[data-testid="addBoMItem"]
  for (let i = 0; i < billOfMaterials.length; i++) {
    const item = billOfMaterials[i];
     if (i > 0 || !(await page.$(`div.bom-item-group[data-index="${0}"] input.bomItemName`))) { // Click 'Add BoM Item' if not the first or if first isn't pre-rendered
        await page.click(addBoMItemButtonSelector);
        await page.waitForTimeout(500); 
    }
    const bomItemGroupSelector = `div.bom-item-group[data-index="${i}"]`; // Highly dependent on your UI

    await page.type(`${bomItemGroupSelector} input.bomItemName`, item.itemName); // e.g., input[data-testid="bomItemName"]
    await page.select(`${bomItemGroupSelector} select.bomItemType`, item.itemType); // e.g., select[data-testid="bomItemType"]
    await page.type(`${bomItemGroupSelector} textarea.bomItemDescription`, item.itemDescription); // e.g., textarea[data-testid="bomItemDescription"]
    
    if (item.itemType === 'Plank') {
      await page.type(`${bomItemGroupSelector} input.bomPlankIdFormat`, item.plankIdFormat); // e.g., input[data-testid="bomPlankIdFormat"]
      const scriptEditorSelector = `${bomItemGroupSelector} textarea.bomItemLogicScript`; // e.g., textarea[data-testid="bomItemLogicScript"]
      
      // Using evaluate to set textarea value as page.type can be slow or problematic for large scripts
      await page.evaluate((selector, text) => {
        const textarea = document.querySelector(selector);
        if (textarea) textarea.value = text;
        else console.error("Textarea not found for script: " + selector);
      }, scriptEditorSelector, item.itemLogicScript);
      console.log(`Filled BoM item: ${item.itemName} (Plank script set)`);
    } else {
      console.log(`Filled BoM item: ${item.itemName}`);
    }
  }

  console.log('Bill of Materials filled.');
  const submitButtonSelector = 'button#saveModelButton'; // Example: button[data-testid="saveModelButton"]
  // await page.click(submitButtonSelector); // Uncomment to attempt submission
  console.log('Form filled. Review the form in the browser. Submit manually or uncomment page.click in the script.');
  
  // To keep browser open for inspection:
  // await new Promise(resolve => setTimeout(resolve, 60000)); // Keeps browser open for 60 seconds
  // await browser.close();
}

fillForm().catch(error => console.error('Error during form fill:', error));
