/**
 * @OnlyCurrentDoc
 *
 * Cutlist Generator and Nesting Optimization Tool for Google Sheets
 * V5.3.4 - ADDED EB VALUE & ORIGINAL SIZE PASS-THROUGH
 *
 * UPDATES:
 * - Reads 'EB_Value' from Formatted_Plank_Data.
 * - Calculates Original Width/Height (Cut Size + 2*EB).
 * - Exports 'Original Width', 'Original Height', 'EB Value' to Nest Result.
 * - Passes these values to the Visualizer for Labels.
 */

// =================================================================
// ===================     MAIN UI FUNCTIONS     ===================
// =================================================================

function createCutlist() {
  const ui = SpreadsheetApp.getUi();
  try {
    const { planksByGroup, dynamicOpHeader } = _getPlanksFromSheet();
    if (!planksByGroup) return;

    // --- MODIFIED HEADER: Added Original Sizes & EB Value ---
    const baseHeaders = [
      "Plank ID", "Plank Name", "Material", "Thickness", "Sheet", 
      "X", "Y", "Placed Width", "Placed Height", "Rotated", 
      "Original Width", "Original Height", "EB Value" 
    ];
    
    const finalResults = [baseHeaders.concat(dynamicOpHeader)];
    let sheetCounter = 1;

    for (const materialThicknessKey in planksByGroup) {
      const planks = planksByGroup[materialThicknessKey];
      // Best Fit Decreasing heuristic
      planks.sort((a, b) => (b.width * b.height) - (a.width * a.height));

      const result = evaluateLayout(planks, materialThicknessKey, dynamicOpHeader);

      result.layout.forEach(row => {
        row[4] = row[4] + sheetCounter - 1;
        finalResults.push(row);
      });

      sheetCounter += result.sheetsUsed;
    }

    _writeResultsToSheet(finalResults);
    ui.alert('✅ Optimized Cutlist created successfully!');
  } catch (error) {
    ui.alert(`❌ Error: ${error.message}`);
  }
}

/**
 * ---------------------------------------------------------------------------------
 * PUBLIC MENU FUNCTIONS (Entry Points)
 * ---------------------------------------------------------------------------------
 */

function runGeneticAlgorithm() {
  const params = _getAlgorithmParameters('Genetic Algorithm Settings', 'Population Size,Generations,Mutation Rate (%)\n(e.g., 20,50,2)', 3);
  if (!params) return;
  const [popSize, generations, mutationRate] = params;
  const gaSolver = (planks, key, headers) => _runGeneticAlgorithmForGroup(planks, popSize, generations, mutationRate, key, headers);
  _runNestingProcess(gaSolver, '🧬 Running GA', 'GA Complete');
}

function runSimulatedAnnealing() {
  const params = _getAlgorithmParameters('Simulated Annealing Settings', 'Iterations,Initial Temperature,Cooling Rate\n(e.g., 1000,100,0.995)', 3);
  if (!params) return;
  const [iterations, temp, coolingRate] = params;
  const saSolver = (planks, key, headers) => _runSimulatedAnnealingForGroup(planks, iterations, temp, coolingRate, key, headers);
  _runNestingProcess(saSolver, '🔥 Running SA', 'SA Complete');
}

function runParticleSwarmOptimization() {
  const params = _getAlgorithmParameters('Particle Swarm Optimization Settings', 'Particles,Iterations,Inertia,Cognitive,Social\n(e.g., 20,50,0.7,1.5,1.5)', 5);
  if (!params) return;
  const [particles, iterations, inertia, cognitive, social] = params;
  const psoParams = { particles, iterations, inertia, cognitive, social };
  const psoSolver = (planks, key, headers) => _runPsoForGroup(planks, psoParams, key, headers);
  _runNestingProcess(psoSolver, '⚡ Running PSO', 'PSO Complete');
}

/**
 * ---------------------------------------------------------------------------------
 * INTERNAL HELPER FUNCTIONS
 * ---------------------------------------------------------------------------------
 */

function _getAlgorithmParameters(title, message, expectedParamCount) {
  const ui = SpreadsheetApp.getUi();
  const params = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
  if (params.getSelectedButton() !== ui.Button.OK) return null;
  const parsedParams = params.getResponseText().split(',').map(Number);
  if (parsedParams.length !== expectedParamCount || parsedParams.some(isNaN)) {
    ui.alert('Invalid parameters.');
    return null;
  }
  return parsedParams;
}

function _runNestingProcess(solverFunction, toastMessage, successMessage) {
  const ui = SpreadsheetApp.getUi();
  try {
    const { planksByGroup, dynamicOpHeader } = _getPlanksFromSheet();
    if (!planksByGroup) return; 

    // --- MODIFIED HEADER ---
    const baseHeaders = [
      "Plank ID", "Plank Name", "Material", "Thickness", "Sheet", 
      "X", "Y", "Placed Width", "Placed Height", "Rotated", 
      "Original Width", "Original Height", "EB Value"
    ];
    
    const finalResults = [baseHeaders.concat(dynamicOpHeader)];
    let sheetCounter = 1;

    for (const materialThicknessKey in planksByGroup) {
      const planks = planksByGroup[materialThicknessKey];
      SpreadsheetApp.getActiveSpreadsheet().toast(`${toastMessage} for ${materialThicknessKey}...`, 'Nesting in Progress', -1);
      const bestSolution = solverFunction(planks, materialThicknessKey, dynamicOpHeader);
      bestSolution.details.layout.forEach(row => {
        row[4] = row[4] + sheetCounter - 1;
        finalResults.push(row);
      });
      sheetCounter += bestSolution.details.sheetsUsed;
    }
    _writeResultsToSheet(finalResults);
    ui.alert(`✅ ${successMessage}!\nFound optimal order using ${sheetCounter - 1} sheets.`);
  } catch (error) {
    ui.alert(`❌ Error: ${error.message}\nStack: ${error.stack}`);
  }
}

// =================================================================
// ===================     CORE NESTING ENGINE     ===================
// =================================================================

function evaluateLayout(planksOrder, materialThicknessGroupKey, dynamicOpHeader) {
  const SHEET_WIDTH = 1220;
  const SHEET_HEIGHT = 2440;
  const STANDARD_SPACING = 10;
  const SMALL_PLANK_SPACING = 20;
  const SMALL_PLANK_THRESHOLD = 150;
  const MARGIN = 10;
  
  // Scoring weights for Bottom-Left optimization
  const POSITION_WEIGHT = 2.0;    // How much to favor bottom-left positions
  const FIT_WEIGHT = 1.0;         // How much to favor tight fits
  const BOTTOM_LEFT_BIAS = 0.5;   // Extra bias towards origin

  const resultsLayout = [];
  const sheets = [];
  let totalUsedArea = 0;
  const unplacedPlanks = [];
  const opHeaderIndexMap = new Map(dynamicOpHeader.map((h, i) => [h, i]));

  for (const plank of planksOrder) {
    let globalBestFit = { score: Infinity, sheetIndex: -1, rectIndex: -1, orientation: null };
    
    // 1️⃣ ROTATION ALLOWANCE LOGIC
    const options = [{ w: plank.width, h: plank.height, rotated: false }];
    if (plank.grain !== 'Y' && plank.grain !== 'YES') {
      options.push({ w: plank.height, h: plank.width, rotated: true });
    }

    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i];
      for (let j = 0; j < sheet.freeRects.length; j++) {
        const rect = sheet.freeRects[j];
        for (const opt of options) {
          if (opt.w <= rect.width + 0.01 && opt.h <= rect.height + 0.01) {
            // ========== BOTTOM-LEFT SCORING ==========
            // Lower score = better placement
            
            // Position score: favor bottom-left (lower X and Y values)
            // Normalize by sheet dimensions so both axes are weighted equally
            const normalizedX = rect.x / SHEET_WIDTH;
            const normalizedY = rect.y / SHEET_HEIGHT;
            const positionScore = (normalizedX + normalizedY) * POSITION_WEIGHT;
            
            // Fit score: how well the plank fits the free rectangle
            const wastedW = rect.width - opt.w;
            const wastedH = rect.height - opt.h;
            const fitScore = (Math.min(wastedW, wastedH) / 100) * FIT_WEIGHT;
            
            // Bottom-left corner bonus: extra preference for positions near origin
            const distanceFromOrigin = Math.sqrt(rect.x * rect.x + rect.y * rect.y);
            const cornerBonus = (distanceFromOrigin / Math.sqrt(SHEET_WIDTH * SHEET_WIDTH + SHEET_HEIGHT * SHEET_HEIGHT)) * BOTTOM_LEFT_BIAS;
            
            const score = positionScore + fitScore + cornerBonus;
            
            if (score < globalBestFit.score) {
              globalBestFit = { score, sheetIndex: i, rectIndex: j, orientation: opt };
            }
          }
        }
      }
    }

    let targetSheetIndex = globalBestFit.sheetIndex;
    if (targetSheetIndex === -1) {
      const newSheetNum = sheets.length + 1;
      const newSheet = { 
        sheetNum: newSheetNum, 
        freeRects: [{ 
          x: MARGIN, 
          y: MARGIN, 
          width: SHEET_WIDTH - 2 * MARGIN, 
          height: SHEET_HEIGHT - 2 * MARGIN 
        }] 
      };
      sheets.push(newSheet);
      targetSheetIndex = sheets.length - 1;
      const newSheetRect = newSheet.freeRects[0];
      let bestNewSheetScore = Infinity;
      for (const opt of options) {
        if (opt.w <= newSheetRect.width && opt.h <= newSheetRect.height) {
          const score = 0; // Origin position is always best on new sheet
          if (score < bestNewSheetScore) {
            globalBestFit = { score, sheetIndex: targetSheetIndex, rectIndex: 0, orientation: opt };
            bestNewSheetScore = score;
          }
        }
      }
      if (globalBestFit.sheetIndex === -1) {
        unplacedPlanks.push(plank);
        continue;
      }
    }

    const { rectIndex, orientation } = globalBestFit;
    const targetSheet = sheets[targetSheetIndex];
    const targetRect = targetSheet.freeRects[rectIndex];
    
    const placedRect = { 
      x: _cleanNum(targetRect.x), 
      y: _cleanNum(targetRect.y), 
      width: _cleanNum(orientation.w), 
      height: _cleanNum(orientation.h) 
    };

    // Process operations (unchanged)
    const operationValues = Array(dynamicOpHeader.length).fill('');
    if (plank.operations) {
      for (const opType in plank.operations) {
        const isGrooveOp = (opType.includes('slot') || opType.includes('groove') || opType.includes('profile'));
        plank.operations[opType].forEach((operation, index) => {
          const opNum = index + 1;
          const localX = operation.x;
          const localY = operation.y;
          
          let absoluteX, absoluteY;

          if (!orientation.rotated) {
            absoluteX = placedRect.x + localX;
            absoluteY = placedRect.y + localY;
          } else {
            absoluteX = placedRect.x + localY;
            absoluteY = placedRect.y + (placedRect.height - localX);
          }

          const xHeader = `${opType}_${opNum}_X`;
          const yHeader = `${opType}_${opNum}_Y`;
          const zHeader = `${opType}_${opNum}_Z`; 

          if (opHeaderIndexMap.has(xHeader)) {
            operationValues[opHeaderIndexMap.get(xHeader)] = absoluteX.toFixed(1);
            operationValues[opHeaderIndexMap.get(yHeader)] = absoluteY.toFixed(1);
            operationValues[opHeaderIndexMap.get(zHeader)] = operation.z.toFixed(1);
          }

          if (isGrooveOp) {
            const lenHeader = `${opType}_${opNum}_length`;
            const widthHeader = `${opType}_${opNum}_width`;
            if (opHeaderIndexMap.has(lenHeader)) {
              operationValues[opHeaderIndexMap.get(lenHeader)] = operation.length.toFixed(1);
              operationValues[opHeaderIndexMap.get(widthHeader)] = operation.width.toFixed(1);
            }
          }
        });
      }
    }

    // Process L-cut triplets
    const lCutValues = [];
    if (plank.l_cuts && plank.l_cuts.length > 0) {
      plank.l_cuts.forEach((lcut, index) => {
        const lCutNum = index + 1;
        
        let absStartX, absStartY, absCenterX, absCenterY, absEndX, absEndY;
        
        if (!orientation.rotated) {
          absStartX = placedRect.x + lcut.start.x;
          absStartY = placedRect.y + lcut.start.y;
          absCenterX = placedRect.x + lcut.center.x;
          absCenterY = placedRect.y + lcut.center.y;
          absEndX = placedRect.x + lcut.end.x;
          absEndY = placedRect.y + lcut.end.y;
        } else {
          // When rotated, swap X/Y and adjust
          absStartX = placedRect.x + lcut.start.y;
          absStartY = placedRect.y + (placedRect.height - lcut.start.x);
          absCenterX = placedRect.x + lcut.center.y;
          absCenterY = placedRect.y + (placedRect.height - lcut.center.x);
          absEndX = placedRect.x + lcut.end.y;
          absEndY = placedRect.y + (placedRect.height - lcut.end.x);
        }
        
        const startXHeader = `L_cut_${lCutNum}_start_X`;
        const startYHeader = `L_cut_${lCutNum}_start_Y`;
        const centerXHeader = `L_cut_${lCutNum}_center_X`;
        const centerYHeader = `L_cut_${lCutNum}_center_Y`;
        const endXHeader = `L_cut_${lCutNum}_end_X`;
        const endYHeader = `L_cut_${lCutNum}_end_Y`;
        
        if (opHeaderIndexMap.has(startXHeader)) {
          operationValues[opHeaderIndexMap.get(startXHeader)] = absStartX.toFixed(1);
          operationValues[opHeaderIndexMap.get(startYHeader)] = absStartY.toFixed(1);
          operationValues[opHeaderIndexMap.get(centerXHeader)] = absCenterX.toFixed(1);
          operationValues[opHeaderIndexMap.get(centerYHeader)] = absCenterY.toFixed(1);
          operationValues[opHeaderIndexMap.get(endXHeader)] = absEndX.toFixed(1);
          operationValues[opHeaderIndexMap.get(endYHeader)] = absEndY.toFixed(1);
        }
      });
    }
    
    // Process Gola profile triplets (same logic as L-cuts)
    if (plank.gola_profiles && plank.gola_profiles.length > 0) {
      plank.gola_profiles.forEach((gola, index) => {
        const golaNum = index + 1;
        
        let absStartX, absStartY, absCenterX, absCenterY, absEndX, absEndY;
        
        if (!orientation.rotated) {
          absStartX = placedRect.x + gola.start.x;
          absStartY = placedRect.y + gola.start.y;
          absCenterX = placedRect.x + gola.center.x;
          absCenterY = placedRect.y + gola.center.y;
          absEndX = placedRect.x + gola.end.x;
          absEndY = placedRect.y + gola.end.y;
        } else {
          // When rotated, swap X/Y and adjust
          absStartX = placedRect.x + gola.start.y;
          absStartY = placedRect.y + (placedRect.height - gola.start.x);
          absCenterX = placedRect.x + gola.center.y;
          absCenterY = placedRect.y + (placedRect.height - gola.center.x);
          absEndX = placedRect.x + gola.end.y;
          absEndY = placedRect.y + (placedRect.height - gola.end.x);
        }
        
        const startXHeader = `Gola_profile_${golaNum}_start_X`;
        const startYHeader = `Gola_profile_${golaNum}_start_Y`;
        const centerXHeader = `Gola_profile_${golaNum}_center_X`;
        const centerYHeader = `Gola_profile_${golaNum}_center_Y`;
        const endXHeader = `Gola_profile_${golaNum}_end_X`;
        const endYHeader = `Gola_profile_${golaNum}_end_Y`;
        
        if (opHeaderIndexMap.has(startXHeader)) {
          operationValues[opHeaderIndexMap.get(startXHeader)] = absStartX.toFixed(1);
          operationValues[opHeaderIndexMap.get(startYHeader)] = absStartY.toFixed(1);
          operationValues[opHeaderIndexMap.get(centerXHeader)] = absCenterX.toFixed(1);
          operationValues[opHeaderIndexMap.get(centerYHeader)] = absCenterY.toFixed(1);
          operationValues[opHeaderIndexMap.get(endXHeader)] = absEndX.toFixed(1);
          operationValues[opHeaderIndexMap.get(endYHeader)] = absEndY.toFixed(1);
        }
      });
    }

    const eb = plank.ebValue || 0;
    const origW = orientation.w + (2 * eb);
    const origH = orientation.h + (2 * eb);

    const baseInfo = [
      plank.id, plank.name, plank.material, plank.thickness,
      targetSheet.sheetNum, placedRect.x.toFixed(1), placedRect.y.toFixed(1),
      orientation.w.toFixed(1), orientation.h.toFixed(1), orientation.rotated ? "Yes" : "No",
      origW.toFixed(1), origH.toFixed(1), eb 
    ];

    resultsLayout.push(baseInfo.concat(operationValues));
    totalUsedArea += orientation.w * orientation.h;

    const currentSpacing = (orientation.w < SMALL_PLANK_THRESHOLD || orientation.h < SMALL_PLANK_THRESHOLD) 
      ? SMALL_PLANK_SPACING 
      : STANDARD_SPACING;
    
    // ========== BOTTOM-LEFT OPTIMIZED SPLITTING ==========
    const newFreeRects = [];
    for (const free of targetSheet.freeRects) {
      if (_rectsOverlap(free, placedRect)) {
        newFreeRects.push(..._splitFreeRect(free, placedRect, currentSpacing));
      } else {
        newFreeRects.push(free);
      }
    }
    targetSheet.freeRects = _pruneRects(newFreeRects);
    
    // Sort free rects by bottom-left priority for next iteration
    targetSheet.freeRects.sort((a, b) => {
      const scoreA = a.x + a.y;
      const scoreB = b.x + b.y;
      return scoreA - scoreB;
    });
  }

  const sheetsUsed = sheets.length;
  const sheetArea = (SHEET_WIDTH - 2 * MARGIN) * (SHEET_HEIGHT - 2 * MARGIN);
  const totalSheetArea = sheetsUsed * sheetArea;
  const utilization = totalSheetArea > 0 ? (totalUsedArea / totalSheetArea) * 100 : 0;
  
  // Calculate largest contiguous waste area per sheet (for recovery potential)
  let maxWasteArea = 0;
  sheets.forEach(sheet => {
    sheet.freeRects.forEach(rect => {
      const area = rect.width * rect.height;
      if (area > maxWasteArea) maxWasteArea = area;
    });
  });
  
  // Fitness: Lower is better
  // Reward for larger contiguous waste (for recovery)
  const wasteBonus = maxWasteArea / sheetArea * 10; // Bonus for keeping large offcuts
  const fitness = (sheetsUsed * 1000) + (100 - utilization) + (unplacedPlanks.length * 10000) - wasteBonus;

  return { 
    fitness, 
    layout: resultsLayout, 
    sheetsUsed, 
    unplacedCount: unplacedPlanks.length, 
    utilization: utilization.toFixed(2),
    maxWasteArea: maxWasteArea.toFixed(0)
  };
}
// =================================================================
// ================     DATA & RESULTS HANDLING     ===================
// =================================================================

function _getPlanksFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const formattedDataSheet = ss.getSheetByName("Formatted_Plank_Data");
  if (!formattedDataSheet) { ui.alert("❌ Error: Sheet 'Formatted_Plank_Data' not found."); return { planksByGroup: null }; }

  const formattedData = formattedDataSheet.getDataRange().getValues();
  const formattedHeaders = formattedData[0].map(h => String(h).trim());
  const plankIdColF = formattedHeaders.indexOf('plank_id');
  
  // --- MODIFIED: Read EB_Value Column ---
  const ebIndex = formattedHeaders.indexOf('EB_Value');

  if (plankIdColF === -1) { ui.alert("❌ Error: 'Formatted_Plank_Data' missing 'plank_id'."); return { planksByGroup: null }; }

  const plankDetailsMap = new Map();
  const maxOpCounts = {};
  const opTypes = new Set();

  // Track L-cut triplet headers separately
  const lCutMaxIndex = { count: 0 };
  // Track Gola profile triplet headers separately
  const golaProfileMaxIndex = { count: 0 };
  
  formattedHeaders.forEach(h => {
    // Check for L-cut triplet headers: L_cut_N_start_X, L_cut_N_center_Y, etc.
    const lCutMatch = h.match(/^L_cut_(\d+)_(start|center|end)_(X|Y)$/);
    if (lCutMatch) {
      const idx = parseInt(lCutMatch[1]);
      if (idx > lCutMaxIndex.count) lCutMaxIndex.count = idx;
      return; // Don't process as regular operation
    }
    
    // Check for Gola profile triplet headers: Gola_profile_N_start_X, Gola_profile_N_center_Y, etc.
    const golaMatch = h.match(/^Gola_profile_(\d+)_(start|center|end)_(X|Y)$/);
    if (golaMatch) {
      const idx = parseInt(golaMatch[1]);
      if (idx > golaProfileMaxIndex.count) golaProfileMaxIndex.count = idx;
      return; // Don't process as regular operation
    }
    
    const match = h.match(/^([a-zA-Z]+(?:_[a-zA-Z]+)*?)_(\d+?)_(X|Y|Z|length|width|type|notes)$/);
    if (match) {
      opTypes.add(match[1]); 
      const opType = match[1];
      const opNum = parseInt(match[2]);
      if (opNum > (maxOpCounts[opType] || 0)) maxOpCounts[opType] = opNum;
    }
  });

  for (let i = 1; i < formattedData.length; i++) {
    const row = formattedData[i];
    const plankId = String(row[plankIdColF]).trim();
    if (plankId) {
      const operations = {};
      const existingDetails = plankDetailsMap.get(plankId) || { operations: {}, l_cuts: [] };
      opTypes.forEach(opType => {
        operations[opType] = existingDetails.operations[opType] || []; 
        const maxCount = maxOpCounts[opType] || 0;
        const isGrooveOp = (opType.includes('slot') || opType.includes('groove') || opType.includes('profile'));
        for (let opNum = 1; opNum <= maxCount; opNum++) {
          const xIndex = formattedHeaders.indexOf(`${opType}_${opNum}_X`);
          const yIndex = formattedHeaders.indexOf(`${opType}_${opNum}_Y`);
          const zIndex = formattedHeaders.indexOf(`${opType}_${opNum}_Z`);
          if (xIndex === -1 || yIndex === -1 || zIndex === -1) continue;
          if (!row[xIndex] && !row[yIndex] && !row[zIndex]) continue;

          const localX = parseFloat(String(row[xIndex] || 0).replace(/mm/g, '').trim()) || 0;
          const localY = parseFloat(String(row[yIndex] || 0).replace(/mm/g, '').trim()) || 0;
          const localZ = parseFloat(String(row[zIndex] || 0).replace(/mm/g, '').trim()) || 0;
          const operationData = { x: localX, y: localY, z: localZ };

          if (isGrooveOp) {
            const lenIndex = formattedHeaders.indexOf(`${opType}_${opNum}_length`);
            const widthIndex = formattedHeaders.indexOf(`${opType}_${opNum}_width`);
            if (lenIndex === -1 || widthIndex === -1) continue;
            operationData.length = parseFloat(String(row[lenIndex] || 0).trim()) || 0;
            operationData.width = parseFloat(String(row[widthIndex] || 0).trim()) || 0;
            operationData.depth = localZ; 
            if (localX === 0 && localY === 0 && localZ === 0 && operationData.length === 0 && operationData.width === 0) continue;
          }
          const opExists = operations[opType].some(op => op.x === localX && op.y === localY && op.z === localZ);
          if (!opExists) operations[opType].push(operationData);
        }
        if (operations[opType].length === 0) delete operations[opType];
      });

      // Extract L-cut triplets - preserve existing L-cuts from previous rows with same plankId
      const l_cuts = existingDetails.l_cuts || [];
      for (let lIdx = 1; lIdx <= lCutMaxIndex.count; lIdx++) {
        const startXIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_start_X`);
        const startYIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_start_Y`);
        const centerXIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_center_X`);
        const centerYIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_center_Y`);
        const endXIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_end_X`);
        const endYIdx = formattedHeaders.indexOf(`L_cut_${lIdx}_end_Y`);
        
        if (startXIdx === -1 || startYIdx === -1 || centerXIdx === -1 || 
            centerYIdx === -1 || endXIdx === -1 || endYIdx === -1) continue;
        
        const startX = parseFloat(String(row[startXIdx] ?? '').replace(/mm/g, '').trim());
        const startY = parseFloat(String(row[startYIdx] ?? '').replace(/mm/g, '').trim());
        const centerX = parseFloat(String(row[centerXIdx] ?? '').replace(/mm/g, '').trim());
        const centerY = parseFloat(String(row[centerYIdx] ?? '').replace(/mm/g, '').trim());
        const endX = parseFloat(String(row[endXIdx] ?? '').replace(/mm/g, '').trim());
        const endY = parseFloat(String(row[endYIdx] ?? '').replace(/mm/g, '').trim());
        
        // Only add if all 6 values are valid numbers and at least one is non-zero
        if (!isNaN(startX) && !isNaN(startY) && !isNaN(centerX) && 
            !isNaN(centerY) && !isNaN(endX) && !isNaN(endY) &&
            (startX !== 0 || startY !== 0 || centerX !== 0 || centerY !== 0 || endX !== 0 || endY !== 0)) {
          // Check if this L-cut already exists (avoid duplicates)
          const lcutExists = l_cuts.some(lc => 
            lc.start.x === startX && lc.start.y === startY &&
            lc.center.x === centerX && lc.center.y === centerY &&
            lc.end.x === endX && lc.end.y === endY
          );
          if (!lcutExists) {
            l_cuts.push({
              start: { x: startX, y: startY },
              center: { x: centerX, y: centerY },
              end: { x: endX, y: endY }
            });
          }
        }
      }
      
      // Extract Gola profile triplets - preserve existing from previous rows with same plankId
      const gola_profiles = existingDetails.gola_profiles || [];
      for (let gIdx = 1; gIdx <= golaProfileMaxIndex.count; gIdx++) {
        const startXIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_start_X`);
        const startYIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_start_Y`);
        const centerXIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_center_X`);
        const centerYIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_center_Y`);
        const endXIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_end_X`);
        const endYIdx = formattedHeaders.indexOf(`Gola_profile_${gIdx}_end_Y`);
        
        if (startXIdx === -1 || startYIdx === -1 || centerXIdx === -1 || 
            centerYIdx === -1 || endXIdx === -1 || endYIdx === -1) continue;
        
        const startX = parseFloat(String(row[startXIdx] ?? '').replace(/mm/g, '').trim());
        const startY = parseFloat(String(row[startYIdx] ?? '').replace(/mm/g, '').trim());
        const centerX = parseFloat(String(row[centerXIdx] ?? '').replace(/mm/g, '').trim());
        const centerY = parseFloat(String(row[centerYIdx] ?? '').replace(/mm/g, '').trim());
        const endX = parseFloat(String(row[endXIdx] ?? '').replace(/mm/g, '').trim());
        const endY = parseFloat(String(row[endYIdx] ?? '').replace(/mm/g, '').trim());
        
        // Only add if all 6 values are valid numbers and at least one is non-zero
        if (!isNaN(startX) && !isNaN(startY) && !isNaN(centerX) && 
            !isNaN(centerY) && !isNaN(endX) && !isNaN(endY) &&
            (startX !== 0 || startY !== 0 || centerX !== 0 || centerY !== 0 || endX !== 0 || endY !== 0)) {
          // Check if this Gola profile already exists (avoid duplicates)
          const golaExists = gola_profiles.some(gp => 
            gp.start.x === startX && gp.start.y === startY &&
            gp.center.x === centerX && gp.center.y === centerY &&
            gp.end.x === endX && gp.end.y === endY
          );
          if (!golaExists) {
            gola_profiles.push({
              start: { x: startX, y: startY },
              center: { x: centerX, y: centerY },
              end: { x: endX, y: endY }
            });
          }
        }
      }
      
      // --- MODIFIED: Store EB Value, L-cuts, and Gola profiles in Map ---
      const ebVal = ebIndex > -1 ? (parseFloat(row[ebIndex]) || 0) : 0;
      plankDetailsMap.set(plankId, { operations, ebValue: ebVal, l_cuts, gola_profiles });
    }
  }

  let dynamicOpHeader = [];
  const sortedOpTypes = Object.keys(maxOpCounts).sort();
  sortedOpTypes.forEach(opType => {
    const maxCount = maxOpCounts[opType] || 0;
    const isGrooveOp = (opType.includes('slot') || opType.includes('groove') || opType.includes('profile'));
    for (let i = 1; i <= maxCount; i++) {
      dynamicOpHeader.push(`${opType}_${i}_X`, `${opType}_${i}_Y`, `${opType}_${i}_Z`);
      if (isGrooveOp) dynamicOpHeader.push(`${opType}_${i}_length`, `${opType}_${i}_width`);
    }
  });
  
  // Add L-cut triplet headers
  for (let i = 1; i <= lCutMaxIndex.count; i++) {
    dynamicOpHeader.push(
      `L_cut_${i}_start_X`, `L_cut_${i}_start_Y`,
      `L_cut_${i}_center_X`, `L_cut_${i}_center_Y`,
      `L_cut_${i}_end_X`, `L_cut_${i}_end_Y`
    );
  }
  
  // Add Gola profile triplet headers
  for (let i = 1; i <= golaProfileMaxIndex.count; i++) {
    dynamicOpHeader.push(
      `Gola_profile_${i}_start_X`, `Gola_profile_${i}_start_Y`,
      `Gola_profile_${i}_center_X`, `Gola_profile_${i}_center_Y`,
      `Gola_profile_${i}_end_X`, `Gola_profile_${i}_end_Y`
    );
  }

  const plankListSheet = ss.getSheetByName("Plank List");
  if (!plankListSheet) { ui.alert("❌ Error: Sheet 'Plank List' not found."); return { planksByGroup: null }; }
  const plankListData = plankListSheet.getDataRange().getValues();
  const plankListHeaders = plankListData[0].map(h => String(h).trim());
  const idCol = plankListHeaders.indexOf('Plank id');
  const nameCol = plankListHeaders.indexOf('Plank Name');
  const materialCol = plankListHeaders.indexOf('Material');
  const widthCol = plankListHeaders.indexOf('Width (mm)');
  const heightCol = plankListHeaders.indexOf('Height (mm)');
  const thicknessCol = plankListHeaders.indexOf('Thickness (mm)');
  const grainCol = plankListHeaders.indexOf('Grain?');

  if ([idCol, nameCol, materialCol, widthCol, heightCol, thicknessCol].includes(-1)) {
    ui.alert("❌ Error: Missing columns in 'Plank List'.");
    return { planksByGroup: null };
  }

  const grouped = {};
  for (let i = 1; i < plankListData.length; i++) {
    const row = plankListData[i];
    const id = row[idCol];
    const name = row[nameCol];
    if (!id || !name || !row[widthCol] || !row[heightCol] || !row[thicknessCol] || !row[materialCol]) continue;

    let width = Number(row[widthCol]);
    let height = Number(row[heightCol]);
    const thickness = parseFloat(row[thicknessCol]);
    const originalMaterial = String(row[materialCol]).trim(); 
    let baseMaterial = originalMaterial.replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '').replace(/\s*\([^)]+\)/g, '').trim();
    const groupKey = `${baseMaterial}_${thickness}mm`; 

    if (isNaN(width) || isNaN(height) || isNaN(thickness) || width <= 0 || height <= 0 || thickness <= 0) continue;
    if (!grouped[groupKey]) grouped[groupKey] = [];

    const grain = String(row[grainCol] || "").trim().toUpperCase();
    
    // RESTORED: Fetch details so operations can be attached
    const uniqueIdForLookup = String(id).trim();
    const details = plankDetailsMap.get(uniqueIdForLookup) || { operations: {}, ebValue: 0, l_cuts: [], gola_profiles: [] }; 

    grouped[groupKey].push({
      id: String(id), name: String(name), width, height, thickness,
      material: originalMaterial, grain, operations: details.operations,
      ebValue: details.ebValue, // Store EB value in object
      l_cuts: details.l_cuts || [], // Store L-cut triplets
      gola_profiles: details.gola_profiles || [] // Store Gola profile triplets
    });
  }

  if (Object.keys(grouped).length === 0) { ui.alert("⚠️ Warning: No valid plank data found."); return { planksByGroup: null }; }
  return { planksByGroup: grouped, dynamicOpHeader };
}

// =================================================================
// ================     ALGORITHM IMPLEMENTATIONS     ================
// =================================================================

function _runGeneticAlgorithmForGroup(planks, popSize, generations, mutationRate, materialThicknessKey, dynamicOpHeader) {
  let population = [];
  for (let i = 0; i < popSize; i++) { population.push({ chromosome: _shuffleArray([...planks]), fitness: Infinity }); }
  let bestSolution = null;
  for (let gen = 0; gen < generations; gen++) {
    for (const individual of population) {
      if (individual.fitness === Infinity) {
        const result = evaluateLayout(individual.chromosome, materialThicknessKey, dynamicOpHeader);
        individual.fitness = result.fitness;
        individual.details = result;
      }
    }
    population.sort((a, b) => a.fitness - b.fitness);
    if (!bestSolution || population[0].fitness < bestSolution.fitness) bestSolution = JSON.parse(JSON.stringify(population[0]));
    const eliteCount = Math.max(2, Math.floor(popSize * 0.1));
    const newPopulation = population.slice(0, eliteCount);
    while (newPopulation.length < popSize) {
      const parent1 = population[Math.floor(Math.random() * (popSize / 2))];
      const parent2 = population[Math.floor(Math.random() * (popSize / 2))];
      let childChromosome = _orderedCrossover(parent1.chromosome, parent2.chromosome);
      if (Math.random() < (mutationRate / 100)) childChromosome = _mutate(childChromosome);
      newPopulation.push({ chromosome: childChromosome, fitness: Infinity });
    }
    population = newPopulation;
  }
  return bestSolution;
}

function _runSimulatedAnnealingForGroup(planks, iterations, temp, coolingRate, materialThicknessKey, dynamicOpHeader) {
  let currentSolution = { chromosome: _shuffleArray([...planks]) };
  currentSolution.details = evaluateLayout(currentSolution.chromosome, materialThicknessKey, dynamicOpHeader);
  currentSolution.fitness = currentSolution.details.fitness;
  let bestSolution = JSON.parse(JSON.stringify(currentSolution));
  let temperature = temp;
  for (let i = 0; i < iterations; i++) {
    const neighborSolution = { chromosome: _mutate(currentSolution.chromosome) };
    neighborSolution.details = evaluateLayout(neighborSolution.chromosome, materialThicknessKey, dynamicOpHeader);
    neighborSolution.fitness = neighborSolution.details.fitness;
    const delta = neighborSolution.fitness - currentSolution.fitness;
    if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) currentSolution = neighborSolution;
    if (currentSolution.fitness < bestSolution.fitness) bestSolution = JSON.parse(JSON.stringify(currentSolution));
    temperature *= coolingRate;
  }
  return bestSolution;
}

function _runPsoForGroup(planks, params, materialThicknessKey, dynamicOpHeader) {
  let particles = [];
  let globalBest = { fitness: Infinity, chromosome: [], details: null };
  for (let i = 0; i < params.particles; i++) {
    const chromosome = _shuffleArray([...planks]);
    const details = evaluateLayout(chromosome, materialThicknessKey, dynamicOpHeader);
    const particle = {
      chromosome: chromosome, velocity: Array(planks.length).fill(0).map(() => Math.random()),
      personalBest: { chromosome: chromosome, fitness: details.fitness, details: details }
    };
    particles.push(particle);
    if (particle.personalBest.fitness < globalBest.fitness) globalBest = JSON.parse(JSON.stringify(particle.personalBest));
  }
  for (let iter = 0; iter < params.iterations; iter++) {
    for (const particle of particles) {
      for (let i = 0; i < particle.chromosome.length; i++) {
        particle.velocity[i] = params.inertia * particle.velocity[i];
        if (Math.random() < params.cognitive) {
          const pBestItem = particle.personalBest.chromosome[i];
          const currentIndex = particle.chromosome.findIndex(p => p.id === pBestItem.id);
          if (currentIndex !== -1 && currentIndex !== i) [particle.chromosome[i], particle.chromosome[currentIndex]] = [particle.chromosome[currentIndex], particle.chromosome[i]];
        }
        if (Math.random() < params.social) {
          const gBestItem = globalBest.chromosome[i];
          const currentIndex = particle.chromosome.findIndex(p => p.id === gBestItem.id);
          if (currentIndex !== -1 && currentIndex !== i) [particle.chromosome[i], particle.chromosome[currentIndex]] = [particle.chromosome[currentIndex], particle.chromosome[i]];
        }
      }
      const details = evaluateLayout(particle.chromosome, materialThicknessKey, dynamicOpHeader);
      const fitness = details.fitness;
      if (fitness < particle.personalBest.fitness) particle.personalBest = { chromosome: [...particle.chromosome], fitness: fitness, details: details };
      if (fitness < globalBest.fitness) globalBest = { chromosome: [...particle.chromosome], fitness: fitness, details: details };
    }
  }
  return globalBest;
}

// =================================================================
// =================     HELPER & UTILITY FUNCTIONS     ================
// =================================================================

function _writeResultsToSheet(results) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const out = ss.getSheetByName("Nest Result") || ss.insertSheet("Nest Result");
  out.clear();
  if (results.length > 0) {
    out.getRange(1, 1, results.length, results[0].length).setValues(results);
    out.autoResizeColumns(1, Math.min(results[0].length, 20));
    out.setFrozenRows(1);
    out.getDataRange().setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP).setVerticalAlignment('top');
  }
}

function _shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function _cleanNum(num) {
  return Math.round(num * 100) / 100;
}

function _orderedCrossover(parent1, parent2) {
  const size = parent1.length;
  const start = Math.floor(Math.random() * size);
  const end = Math.floor(Math.random() * (size - start)) + start;
  const segment = parent1.slice(start, end + 1);
  const segmentIds = new Set(segment.map(p => p.id));
  const filler = parent2.filter(p => !segmentIds.has(p.id));
  const child = [];
  let fillerIndex = 0;
  for (let i = 0; i < size; i++) {
    if (i >= start && i <= end) child.push(segment[i - start]);
    else child.push(filler[fillerIndex++]);
  }
  return child;
}

function _mutate(chromosome) {
  const newChromosome = [...chromosome];
  const i = Math.floor(Math.random() * newChromosome.length);
  let j = Math.floor(Math.random() * newChromosome.length);
  if (i === j) j = (i + 1) % newChromosome.length;
  [newChromosome[i], newChromosome[j]] = [newChromosome[j], newChromosome[i]];
  return newChromosome;
}

function _rectsOverlap(r1, r2) {
  const epsilon = 0.01;
  return r1.x < r2.x + r2.width - epsilon && 
         r1.x + r1.width > r2.x + epsilon && 
         r1.y < r2.y + r2.height - epsilon && 
         r1.y + r1.height > r2.y + epsilon;
}

function _splitFreeRect(freeRect, placedRect, spacing) {
  const newRects = [];
  
  // Define the EXCLUSION ZONE - the area where nothing can be placed
  // This includes the plank PLUS spacing on ALL sides
  const exclusionLeft   = _cleanNum(placedRect.x - spacing);
  const exclusionTop    = _cleanNum(placedRect.y - spacing);
  const exclusionRight  = _cleanNum(placedRect.x + placedRect.width + spacing);
  const exclusionBottom = _cleanNum(placedRect.y + placedRect.height + spacing);
  
  const freeRight  = _cleanNum(freeRect.x + freeRect.width);
  const freeBottom = _cleanNum(freeRect.y + freeRect.height);

  // 1. Top piece (Above the exclusion zone)
  if (exclusionTop > freeRect.y) {
    newRects.push({ 
      x: freeRect.x, 
      y: freeRect.y, 
      width: freeRect.width, 
      height: _cleanNum(exclusionTop - freeRect.y)  // ✅ Now has spacing gap
    });
  }

  // 2. Bottom piece (Below the exclusion zone)
  if (exclusionBottom < freeBottom) {
    newRects.push({ 
      x: freeRect.x, 
      y: exclusionBottom, 
      width: freeRect.width, 
      height: _cleanNum(freeBottom - exclusionBottom) 
    });
  }

  // 3. Left piece (Left of the exclusion zone)
  if (exclusionLeft > freeRect.x) {
    newRects.push({ 
      x: freeRect.x, 
      y: freeRect.y, 
      width: _cleanNum(exclusionLeft - freeRect.x),  // ✅ Now has spacing gap
      height: freeRect.height 
    });
  }

  // 4. Right piece (Right of the exclusion zone)
  if (exclusionRight < freeRight) {
    newRects.push({ 
      x: exclusionRight, 
      y: freeRect.y, 
      width: _cleanNum(freeRight - exclusionRight), 
      height: freeRect.height 
    });
  }

  return newRects.filter(r => r.width > 0.1 && r.height > 0.1);
}


function _pruneRects(rects) {
  const pruned = [];
  for (let i = 0; i < rects.length; i++) {
    let isContained = false;
    for (let j = 0; j < rects.length; j++) {
      if (i === j) continue;
      if (rects[j].x <= rects[i].x && rects[j].y <= rects[i].y && rects[j].x + rects[j].width >= rects[i].x + rects[i].width && rects[j].y + rects[j].height >= rects[i].y + rects[i].height) {
        isContained = true;
        break;
      }
    }
    if (!isContained) pruned.push(rects[i]);
  }
  return pruned;
}

// =================================================================
// ====================     REPORTING FUNCTIONS     ====================
// =================================================================

function createMaterialSummarySheet() {
  const ui = SpreadsheetApp.getUi();
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const nestResultSheet = ss.getSheetByName("Nest Result");
    if (!nestResultSheet) { ui.alert("❌ Sheet 'Nest Result' not found."); return; }
    const nestData = nestResultSheet.getDataRange().getValues();
    if (nestData.length < 2) { ui.alert("❌ Sheet 'Nest Result' is empty."); return; }

    const plankListSheet = ss.getSheetByName("Plank List");
    if (!plankListSheet) { ui.alert("❌ Sheet 'Plank List' not found."); return; }
    const ebTotalsMap = getEbTotalsFromPlankList(plankListSheet);

    const reportData = generateReportData(nestData);
    const groupStats = reportData.groupStats;
    if (!groupStats || Object.keys(groupStats).length === 0) { ui.alert("No material data found."); return; }

    const outputData = [["Material & Thickness", "Room Name(s)", "Plank Count", "Total Area (mm²)", "Sheets Used", "Avg. Area per Sheet (mm²)", "Utilization %", "Total Edge (m)"]];
    const SHEET_AREA = 1220 * 2440; 
    const sortedGroupKeys = Object.keys(groupStats).sort();

    for (const groupKey of sortedGroupKeys) {
      const group = groupStats[groupKey];
      const avgPerSheet = group.sheetCount > 0 ? (group.totalArea / group.sheetCount) : 0;
      const utilization = group.sheetCount > 0 ? (group.totalArea / (group.sheetCount * SHEET_AREA)) * 100 : 0;
      const totalEb = ebTotalsMap[groupKey] || 0;
      outputData.push([`${group.baseMaterial} (${group.thickness}mm)`, group.roomNames, group.plankCount, Math.round(group.totalArea), group.sheetCount, Math.round(avgPerSheet), utilization.toFixed(1), totalEb]);
    }

    const summarySheetName = "Material Summary";
    let summarySheet = ss.getSheetByName(summarySheetName);
    if (summarySheet) summarySheet.clear(); else summarySheet = ss.insertSheet(summarySheetName);
    summarySheet.getRange(1, 1, outputData.length, outputData[0].length).setValues(outputData);
    summarySheet.autoResizeColumns(1, outputData[0].length);
    summarySheet.getRange("A1:H1").setFontWeight("bold");
    summarySheet.getRange(2, 3, outputData.length - 1, 5).setNumberFormat("#,##0");
    summarySheet.getRange(2, 8, outputData.length - 1, 1).setNumberFormat("0.00");
    summarySheet.activate();
    ui.alert('✅ Summary Created!');
  } catch (error) {
    ui.alert(`❌ Error: ${error.message}`);
  }
}

function getEbTotalsFromPlankList(plankListSheet) {
  const ebTotalsMap = {};
  const data = plankListSheet.getDataRange().getValues();
  if (data.length < 2) return ebTotalsMap;
  const headers = data[0].map(h => String(h).trim());
  const matCol = headers.indexOf("Material");
  const thickCol = headers.indexOf("Thickness (mm)");
  const ebCol = headers.indexOf("Edge Binding (m)");
  if (matCol === -1 || thickCol === -1 || ebCol === -1) throw new Error("Missing columns in 'Plank List'.");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const originalMaterial = row[matCol];
    const thickness = row[thickCol];
    const ebValue = row[ebCol];
    if (!originalMaterial || thickness === "") continue; 
    let baseMaterial = String(originalMaterial).replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '').replace(/\s*\([^)]+\)/g, '').trim();
    const cleanKey = `${baseMaterial}_${thickness}mm`;
    const ebValueNum = parseFloat(ebValue);
    if (!isNaN(ebValueNum)) {
      if (!ebTotalsMap[cleanKey]) ebTotalsMap[cleanKey] = 0;
      ebTotalsMap[cleanKey] += ebValueNum;
    }
  }
  return ebTotalsMap;
}

function generateReportData(nestResultData) {
  const headers = nestResultData[0];
  const dataRows = nestResultData.slice(1);
  const report = { summary: { generatedDate: new Date().toLocaleString(), totalSheets: 0, totalPlanks: dataRows.length }, groupStats: {} };
  const groupStatMap = new Map();
  const globalSheetSet = new Set();
  const sheetCol = headers.indexOf('Sheet');
  const materialCol = headers.indexOf('Material');
  const thicknessCol = headers.indexOf('Thickness');
  const widthCol = headers.indexOf('Placed Width');
  const heightCol = headers.indexOf('Placed Height');
  if ([sheetCol, materialCol, thicknessCol, widthCol, heightCol].includes(-1)) throw new Error("Missing columns in 'Nest Result'.");
  const roomRegex = /\(([^)]+)\)/;

  dataRows.forEach(row => {
    const sheetNum = row[sheetCol];
    const originalMaterial = row[materialCol];
    const thickness = row[thicknessCol];
    const width = Number(row[widthCol]);
    const height = Number(row[heightCol]);
    const area = width * height;
    let baseMaterial = String(originalMaterial).replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '');
    let roomName = "N/A";
    const roomMatch = baseMaterial.match(roomRegex);
    if (roomMatch && roomMatch[1]) roomName = roomMatch[1].trim();
    baseMaterial = baseMaterial.replace(/\s*\([^)]+\)/g, '').trim();
    const cleanKey = `${baseMaterial}_${thickness}mm`;
    globalSheetSet.add(sheetNum);

    if (!groupStatMap.has(cleanKey)) groupStatMap.set(cleanKey, { baseMaterial: baseMaterial, thickness: thickness, plankCount: 0, totalArea: 0, sheetSet: new Set(), roomSet: new Set() });
    const groupStat = groupStatMap.get(cleanKey);
    groupStat.plankCount++;
    groupStat.totalArea += area;
    groupStat.sheetSet.add(sheetNum);
    groupStat.roomSet.add(roomName);
  });

  report.summary.totalSheets = globalSheetSet.size;
  const finalGroupStats = {};
  groupStatMap.forEach((value, key) => {
    finalGroupStats[key] = { baseMaterial: value.baseMaterial, thickness: value.thickness, plankCount: value.plankCount, totalArea: value.totalArea, sheetCount: value.sheetSet.size, roomNames: Array.from(value.roomSet).sort().join(', ') };
  });
  report.groupStats = finalGroupStats;
  return report;
}

// =================================================================
// ====================     VISUALIZATION PREP     =================
// =================================================================

function drawCutlist() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  try {
    const resultSheet = ss.getSheetByName("Nest Result");
    if (!resultSheet) { ui.alert("❌ Sheet 'Nest Result' not found."); return; }
    const resultData = resultSheet.getDataRange().getValues();
    if (resultData.length < 2) { ui.alert("❌ No data in 'Nest Result'."); return; }

    const clientName = _getClientName(ss);
    
    // 1. Get Column Indices from "Nest Result"
    const headers = resultData[0].map(h => String(h).trim());
    
    const hIdx = {
      id: headers.indexOf('Plank ID'),
      name: headers.indexOf('Plank Name'),
      mat: headers.indexOf('Material'),
      thk: headers.indexOf('Thickness'),
      sheet: headers.indexOf('Sheet'),
      x: headers.indexOf('X'),
      y: headers.indexOf('Y'),
      w: headers.indexOf('Placed Width'),
      h: headers.indexOf('Placed Height'),
      rot: headers.indexOf('Rotated'),
      // --- MODIFIED: Read Original Size & EB ---
      origW: headers.indexOf('Original Width'),
      origH: headers.indexOf('Original Height'),
      eb: headers.indexOf('EB Value')
    };

    if (Object.values(hIdx).some(i => i === -1)) throw new Error("Missing standard columns in 'Nest Result'.");

    // 2. Scan for Dynamic Operation Columns
    const opTypes = new Set();
    const maxOpCounts = {};
    headers.forEach(h => {
      const match = h.match(/^([a-zA-Z]+(?:_[a-zA-Z]+)*?)_(\d+?)_(X|Y|Z|length|width)$/);
      if (match) {
        opTypes.add(match[1]);
        const opNum = parseInt(match[2]);
        if (opNum > (maxOpCounts[match[1]] || 0)) maxOpCounts[match[1]] = opNum;
      }
    });

    // 3. Process Rows
    const placedPlanks = [];
    for (let i = 1; i < resultData.length; i++) {
      const row = resultData[i];
      
      const plankAbsX = Number(row[hIdx.x]);
      const plankAbsY = Number(row[hIdx.y]);
      const isRotated = String(row[hIdx.rot]).toLowerCase() === 'yes';

      const holes = [];
      opTypes.forEach(opType => {
        const count = maxOpCounts[opType] || 0;
        const isGroove = (opType.includes('slot') || opType.includes('groove') || opType.includes('profile'));
        const isRect = isGroove; 

        for (let n = 1; n <= count; n++) {
          const colX = headers.indexOf(`${opType}_${n}_X`);
          const colY = headers.indexOf(`${opType}_${n}_Y`);
          
          if (colX === -1 || colY === -1) continue;
          
          // Absolute values from sheet
          const absHoleX = row[colX];
          const absHoleY = row[colY];

          // Skip empty holes
          if (absHoleX === "" || absHoleY === "") continue;

          // CALCULATE RELATIVE COORDINATES FOR VISUALIZER
          // Visualizer likely adds PlankX + HoleX. So we must provide the offset.
          const relX = Number(absHoleX) - plankAbsX;
          const relY = Number(absHoleY) - plankAbsY;

          const holeObj = {
            x: relX,
            y: relY,
            type: opType,
            isRectangular: isRect,
            description: `${opType} ${n}`
          };

          if (isGroove) {
            const colL = headers.indexOf(`${opType}_${n}_length`);
            const colW = headers.indexOf(`${opType}_${n}_width`);
            
            // Raw Dimensions from Sheet (Length=LocalX, Width=LocalY)
            const rawLength = Number(row[colL] || 0);
            const rawWidth  = Number(row[colW] || 0);

            // SWAP DIMENSIONS FOR VISUALIZER IF ROTATED
            // Visualizer expects: Width (X-axis size), Length (Y-axis size)
            if (isRotated) {
                holeObj.width = rawWidth;   // Visual Width = Local Y
                holeObj.length = rawLength; // Visual Height = Local X
            } else {
                holeObj.width = rawLength;  // Visual Width = Local X
                holeObj.length = rawWidth;  // Visual Height = Local Y
            }
          } else {
             const diameter = (opType.includes('vb')) ? 20 : (opType.includes('dowel') ? 5 : 4);
             holeObj.diameter = diameter;
          }
          holes.push(holeObj);
        }
      });

      // Extract L-cut triplets for visualization
      const l_cuts = [];
      let lCutIdx = 1;
      while (true) {
        const startXCol = headers.indexOf(`L_cut_${lCutIdx}_start_X`);
        const startYCol = headers.indexOf(`L_cut_${lCutIdx}_start_Y`);
        const centerXCol = headers.indexOf(`L_cut_${lCutIdx}_center_X`);
        const centerYCol = headers.indexOf(`L_cut_${lCutIdx}_center_Y`);
        const endXCol = headers.indexOf(`L_cut_${lCutIdx}_end_X`);
        const endYCol = headers.indexOf(`L_cut_${lCutIdx}_end_Y`);
        
        if (startXCol === -1 || startYCol === -1 || centerXCol === -1 ||
            centerYCol === -1 || endXCol === -1 || endYCol === -1) break;
        
        const startX = row[startXCol];
        const startY = row[startYCol];
        const centerX = row[centerXCol];
        const centerY = row[centerYCol];
        const endX = row[endXCol];
        const endY = row[endYCol];
        
        // Skip if all empty
        if (startX === "" && startY === "" && centerX === "" && 
            centerY === "" && endX === "" && endY === "") {
          lCutIdx++;
          continue;
        }
        
        // Convert to relative coordinates for visualizer (absolute - plank position)
        // Clamp to plank boundaries to ensure L-cuts don't render outside
        const plankW = Number(row[hIdx.w]);
        const plankH = Number(row[hIdx.h]);
        const relStartX = Math.max(0, Math.min(Number(startX) - plankAbsX, plankW));
        const relStartY = Math.max(0, Math.min(Number(startY) - plankAbsY, plankH));
        const relCenterX = Math.max(0, Math.min(Number(centerX) - plankAbsX, plankW));
        const relCenterY = Math.max(0, Math.min(Number(centerY) - plankAbsY, plankH));
        const relEndX = Math.max(0, Math.min(Number(endX) - plankAbsX, plankW));
        const relEndY = Math.max(0, Math.min(Number(endY) - plankAbsY, plankH));
        
        l_cuts.push({
          start: { x: relStartX, y: relStartY },
          center: { x: relCenterX, y: relCenterY },
          end: { x: relEndX, y: relEndY }
        });
        
        lCutIdx++;
      }
      
      // Extract Gola profile triplets for visualization
      const gola_profiles = [];
      let golaIdx = 1;
      while (true) {
        const startXCol = headers.indexOf(`Gola_profile_${golaIdx}_start_X`);
        const startYCol = headers.indexOf(`Gola_profile_${golaIdx}_start_Y`);
        const centerXCol = headers.indexOf(`Gola_profile_${golaIdx}_center_X`);
        const centerYCol = headers.indexOf(`Gola_profile_${golaIdx}_center_Y`);
        const endXCol = headers.indexOf(`Gola_profile_${golaIdx}_end_X`);
        const endYCol = headers.indexOf(`Gola_profile_${golaIdx}_end_Y`);
        
        if (startXCol === -1 || startYCol === -1 || centerXCol === -1 ||
            centerYCol === -1 || endXCol === -1 || endYCol === -1) break;
        
        const startX = row[startXCol];
        const startY = row[startYCol];
        const centerX = row[centerXCol];
        const centerY = row[centerYCol];
        const endX = row[endXCol];
        const endY = row[endYCol];
        
        // Skip if all empty
        if (startX === "" && startY === "" && centerX === "" && 
            centerY === "" && endX === "" && endY === "") {
          golaIdx++;
          continue;
        }
        
        // Convert to relative coordinates for visualizer (absolute - plank position)
        // Clamp to plank boundaries to ensure Gola profiles don't render outside
        const plankW = Number(row[hIdx.w]);
        const plankH = Number(row[hIdx.h]);
        const relStartX = Math.max(0, Math.min(Number(startX) - plankAbsX, plankW));
        const relStartY = Math.max(0, Math.min(Number(startY) - plankAbsY, plankH));
        const relCenterX = Math.max(0, Math.min(Number(centerX) - plankAbsX, plankW));
        const relCenterY = Math.max(0, Math.min(Number(centerY) - plankAbsY, plankH));
        const relEndX = Math.max(0, Math.min(Number(endX) - plankAbsX, plankW));
        const relEndY = Math.max(0, Math.min(Number(endY) - plankAbsY, plankH));
        
        gola_profiles.push({
          start: { x: relStartX, y: relStartY },
          center: { x: relCenterX, y: relCenterY },
          end: { x: relEndX, y: relEndY }
        });
        
        golaIdx++;
      }

      placedPlanks.push({
        id: String(row[hIdx.id]),
        name: String(row[hIdx.name]),
        material: row[hIdx.mat],
        thickness: row[hIdx.thk],
        sheetNum: row[hIdx.sheet],
        x: plankAbsX,
        y: plankAbsY,
        width: Number(row[hIdx.w]),
        height: Number(row[hIdx.h]),
        rotated: isRotated,
        holes: holes,
        l_cuts: l_cuts, // L-cut triplets for visualization
        gola_profiles: gola_profiles, // Gola profile triplets for visualization
        // --- MODIFIED: Pass Original Sizes to UI ---
        originalWidth: Number(row[hIdx.origW]),
        originalHeight: Number(row[hIdx.origH]),
        ebValue: Number(row[hIdx.eb])
      });
    }

    // 4. Group by Sheet
    const sheetGroups = {};
    const materialThicknessColors = {};
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA', '#F08A5D', '#B22727', '#54A0FF', '#5F2CD', '#FF9F43'];
    let colorIndex = 0;

    placedPlanks.forEach(plank => {
      let baseMaterial = String(plank.material).replace(/\(\s*\d+(\.\d+)?\s*mm\s*\)/gi, '').replace(/\s*\([^)]+\)/g, '').trim();
      const key = `${baseMaterial}_${plank.thickness}mm`;
      if (!materialThicknessColors[key]) materialThicknessColors[key] = colors[colorIndex++ % colors.length];
      if (!sheetGroups[plank.sheetNum]) sheetGroups[plank.sheetNum] = [];
      sheetGroups[plank.sheetNum].push({ ...plank, color: materialThicknessColors[key] });
    });

    const SHEET_WIDTH = 1220;
    const SHEET_HEIGHT = 2440;
    const SPACING = 10;

    const template = HtmlService.createTemplateFromFile("cutlist_visual");
    template.data = JSON.stringify({
      clientDetails: clientName, 
      spreadsheetName: ss.getName(),
      planks: sheetGroups,
      stats: { totalPlanks: placedPlanks.length, totalSheets: Object.keys(sheetGroups).length, materialThicknessStats: materialThicknessColors },
      constants: { SHEET_WIDTH, SHEET_HEIGHT, SPACING }
    });

    const html = template.evaluate().setWidth(1400).setHeight(850);
    ui.showModalDialog(html, "📐 Cutlist Visualization Dashboard");

  } catch (error) {
    ui.alert(`❌ Visualization Error: ${error.message}`);
  }
}

// --- UPDATED CLIENT NAME FETCHING ---
function _getClientName(ss) {
  const sheet = ss.getSheetByName("Customer Details");
  const details = { customerName: "", firmName: "" };
  
  if (!sheet) return details;
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 1) return details;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.length < 2) continue;
    
    const key = String(row[0]).trim().toLowerCase();
    const val = String(row[1]).trim();

    if (!key || !val) continue;

    // Check keys
    if (key === "name" || key === "customer name" || key === "customer_name") {
      details.customerName = val;
    } 
    else if (key === "firm name" || key === "firm_name" || key.includes("firm")) {
      details.firmName = val;
    }
  }
  
  return details;
}