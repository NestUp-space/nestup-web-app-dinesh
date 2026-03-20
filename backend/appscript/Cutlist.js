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
    
    const finalResults = [baseHeaders.concat(dynamicOpHeader).concat("Cut Order")];
    let sheetCounter = 1;

    for (const materialThicknessKey in planksByGroup) {
      const planks = planksByGroup[materialThicknessKey];
      // Best Fit Decreasing heuristic
      planks.sort((a, b) => (b.width * b.height) - (a.width * a.height));

      const result = evaluateLayout(planks, materialThicknessKey, dynamicOpHeader);

      result.layout.forEach(row => {
        row[4] = row[4] + sheetCounter - 1;
        finalResults.push(row.concat(''));
      });

      sheetCounter += result.sheetsUsed;
    }

    _fillCutOrderColumn(finalResults);
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
    
    const finalResults = [baseHeaders.concat(dynamicOpHeader).concat("Cut Order")];
    let sheetCounter = 1;

    for (const materialThicknessKey in planksByGroup) {
      const planks = planksByGroup[materialThicknessKey];
      SpreadsheetApp.getActiveSpreadsheet().toast(`${toastMessage} for ${materialThicknessKey}...`, 'Nesting in Progress', -1);
      const bestSolution = solverFunction(planks, materialThicknessKey, dynamicOpHeader);
      bestSolution.details.layout.forEach(row => {
        row[4] = row[4] + sheetCounter - 1;
        finalResults.push(row.concat(''));
      });
      sheetCounter += bestSolution.details.sheetsUsed;
    }
    _fillCutOrderColumn(finalResults);
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
    
    // ════════════════════════════════════════════════════════════════════════════
    // 1️⃣ ROTATION ALLOWANCE LOGIC (GRAIN ENFORCEMENT)
    // ════════════════════════════════════════════════════════════════════════════
    // GRAIN RULES:
    // - grainLocked = true: Rotation NOT allowed
    // - grainLocked = false: Rotation allowed for nesting optimization
    // ════════════════════════════════════════════════════════════════════════════
    
    // Normalize grain value
    var grainValue = String(plank.grain || '').trim().toUpperCase();
    var grainLocked = false;
    
    if (grainValue === 'Y' || grainValue === 'YES' || grainValue === 'TRUE' || grainValue === '1') {
      grainLocked = true;
    } else if (grainValue === 'N' || grainValue === 'NO' || grainValue === 'FALSE' || grainValue === '0') {
      grainLocked = false;
    }
    // else: grainLocked remains false (rotation allowed)
    
    var options = [{ w: plank.width, h: plank.height, rotated: false }];
    if (!grainLocked) {
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

    // ════════════════════════════════════════════════════════════════════════════
    // PROCESS OPERATIONS USING SHARED TRANSFORM MODULE
    // ════════════════════════════════════════════════════════════════════════════
    // All coordinate transforms use CNCTransform.transformLocalToSheet()
    // Formula for 90° clockwise rotation:
    //   Xsheet = plankX + Ylocal
    //   Ysheet = plankY + (originalWidth - Xlocal)
    // ════════════════════════════════════════════════════════════════════════════
    
    const operationValues = Array(dynamicOpHeader.length).fill('');
    
    // Get original dimensions (pre-rotation) for transform calculations
    const originalDims = { width: plank.width, height: plank.height };
    
    if (plank.operations) {
      for (const opType in plank.operations) {
        const isGrooveOp = (opType.includes('slot') || opType.includes('groove') || opType.includes('profile'));
        plank.operations[opType].forEach((operation, index) => {
          const opNum = index + 1;
          const localX = operation.x;
          const localY = operation.y;
          
          let absoluteX, absoluteY;

          // Apply rotation transform
          if (!orientation.rotated) {
            // Not rotated: simple translation
            absoluteX = placedRect.x + localX;
            absoluteY = placedRect.y + localY;
          } else {
            // Rotated 90° clockwise: proper rotation formula
            absoluteX = placedRect.x + localY;
            if (isGrooveOp && operation.width) {
              // Features with dimensions: subtract width to maintain reference corner
              // The original bottom-left corner becomes top-left after rotation
              // Subtract feature width to get the new bottom-left corner
              absoluteY = placedRect.y + (originalDims.width - localX - operation.width);
            } else {
              // Point operations (holes): Y_new = originalWidth - X_old
              absoluteY = placedRect.y + (originalDims.width - localX);
            }
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
              // For rotated planks, slot length/width swap is handled by visualizer
              operationValues[opHeaderIndexMap.get(lenHeader)] = operation.length.toFixed(1);
              operationValues[opHeaderIndexMap.get(widthHeader)] = operation.width.toFixed(1);
            }
          }
        });
      }
    }

    // ════════════════════════════════════════════════════════════════════════════
    // PROCESS L-CUT TRIPLETS - PLANK-LOCAL COORDINATES
    // ════════════════════════════════════════════════════════════════════════════
    // Nest Result stores PLANK-LOCAL coords (matches physical cut piece).
    // G-code adds plank position to convert to sheet space when cutting.
    // - ROTATION: For rotated planks, local coords are in rotated plank space
    // - MIRRORING: Already handled in FormattedData.js stage
    // ════════════════════════════════════════════════════════════════════════════
    if (plank.l_cuts && plank.l_cuts.length > 0) {
      plank.l_cuts.forEach((lcut, index) => {
        const lCutNum = index + 1;
        
        let localStartX, localStartY, localCenterX, localCenterY, localEndX, localEndY;
        
        if (!orientation.rotated) {
          localStartX = lcut.start.x;
          localStartY = lcut.start.y;
          localCenterX = lcut.center.x;
          localCenterY = lcut.center.y;
          localEndX = lcut.end.x;
          localEndY = lcut.end.y;
        } else {
          // Rotated 90° clockwise: X_new = Y_old, Y_new = originalWidth - X_old
          localStartX = lcut.start.y;
          localStartY = originalDims.width - lcut.start.x;
          localCenterX = lcut.center.y;
          localCenterY = originalDims.width - lcut.center.x;
          localEndX = lcut.end.y;
          localEndY = originalDims.width - lcut.end.x;
        }
        
        const startXHeader = `L_cut_${lCutNum}_start_X`;
        const startYHeader = `L_cut_${lCutNum}_start_Y`;
        const centerXHeader = `L_cut_${lCutNum}_center_X`;
        const centerYHeader = `L_cut_${lCutNum}_center_Y`;
        const endXHeader = `L_cut_${lCutNum}_end_X`;
        const endYHeader = `L_cut_${lCutNum}_end_Y`;
        
        if (opHeaderIndexMap.has(startXHeader)) {
          operationValues[opHeaderIndexMap.get(startXHeader)] = localStartX.toFixed(1);
          operationValues[opHeaderIndexMap.get(startYHeader)] = localStartY.toFixed(1);
          operationValues[opHeaderIndexMap.get(centerXHeader)] = localCenterX.toFixed(1);
          operationValues[opHeaderIndexMap.get(centerYHeader)] = localCenterY.toFixed(1);
          operationValues[opHeaderIndexMap.get(endXHeader)] = localEndX.toFixed(1);
          operationValues[opHeaderIndexMap.get(endYHeader)] = localEndY.toFixed(1);
        }
      });
    }
    
    // ════════════════════════════════════════════════════════════════════════════
    // PROCESS INCUT CUTS - PLANK-LOCAL COORDINATES (2 or 4 POINTS EACH)
    // ════════════════════════════════════════════════════════════════════════════
    // Same rotation rule as L-cuts: 90° CW → X_new = Y_old, Y_new = originalWidth - X_old
    if (plank.incut_cuts && plank.incut_cuts.length > 0) {
      plank.incut_cuts.forEach((incut, index) => {
        const incutNum = index + 1;
        
        const rotatePoint = (pt) => {
          if (!orientation.rotated) return { x: pt.x, y: pt.y };
          return { x: pt.y, y: originalDims.width - pt.x };
        };
        
        const local1 = rotatePoint(incut.point1);
        const local2 = rotatePoint(incut.point2);
        
        const setVal = (header, val) => {
          if (opHeaderIndexMap.has(header)) {
            operationValues[opHeaderIndexMap.get(header)] = val.toFixed(1);
          }
        };
        
        setVal(`Incut_cut_${incutNum}_point1_X`, local1.x);
        setVal(`Incut_cut_${incutNum}_point1_Y`, local1.y);
        setVal(`Incut_cut_${incutNum}_point2_X`, local2.x);
        setVal(`Incut_cut_${incutNum}_point2_Y`, local2.y);
        
        if (incut.point3) {
          const local3 = rotatePoint(incut.point3);
          setVal(`Incut_cut_${incutNum}_point3_X`, local3.x);
          setVal(`Incut_cut_${incutNum}_point3_Y`, local3.y);
        }
        if (incut.point4) {
          const local4 = rotatePoint(incut.point4);
          setVal(`Incut_cut_${incutNum}_point4_X`, local4.x);
          setVal(`Incut_cut_${incutNum}_point4_Y`, local4.y);
        }
      });
    }
    
    // ════════════════════════════════════════════════════════════════════════════
    // PROCESS GOLA PROFILE TRIPLETS - PLANK-LOCAL COORDINATES
    // ════════════════════════════════════════════════════════════════════════════
    // Nest Result stores PLANK-LOCAL coords (matches physical cut piece).
    // G-code adds plank position to convert to sheet space when cutting.
    // ════════════════════════════════════════════════════════════════════════════
    if (plank.gola_profiles && plank.gola_profiles.length > 0) {
      plank.gola_profiles.forEach((gola, index) => {
        const golaNum = index + 1;
        
        let localStartX, localStartY, localCenterX, localCenterY, localEndX, localEndY;
        
        if (!orientation.rotated) {
          localStartX = gola.start.x;
          localStartY = gola.start.y;
          localCenterX = gola.center.x;
          localCenterY = gola.center.y;
          localEndX = gola.end.x;
          localEndY = gola.end.y;
        } else {
          localStartX = gola.start.y;
          localStartY = originalDims.width - gola.start.x;
          localCenterX = gola.center.y;
          localCenterY = originalDims.width - gola.center.x;
          localEndX = gola.end.y;
          localEndY = originalDims.width - gola.end.x;
        }
        
        const startXHeader = `Gola_profile_${golaNum}_start_X`;
        const startYHeader = `Gola_profile_${golaNum}_start_Y`;
        const centerXHeader = `Gola_profile_${golaNum}_center_X`;
        const centerYHeader = `Gola_profile_${golaNum}_center_Y`;
        const endXHeader = `Gola_profile_${golaNum}_end_X`;
        const endYHeader = `Gola_profile_${golaNum}_end_Y`;
        
        if (opHeaderIndexMap.has(startXHeader)) {
          operationValues[opHeaderIndexMap.get(startXHeader)] = localStartX.toFixed(1);
          operationValues[opHeaderIndexMap.get(startYHeader)] = localStartY.toFixed(1);
          operationValues[opHeaderIndexMap.get(centerXHeader)] = localCenterX.toFixed(1);
          operationValues[opHeaderIndexMap.get(centerYHeader)] = localCenterY.toFixed(1);
          operationValues[opHeaderIndexMap.get(endXHeader)] = localEndX.toFixed(1);
          operationValues[opHeaderIndexMap.get(endYHeader)] = localEndY.toFixed(1);
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
  // Track Incut (inclined) cut headers: Incut_cut_N_point1_X, etc.
  const incutMaxIndex = { count: 0 };
  
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
    
    // Check for Incut (inclined) cut headers: Incut_cut_N_point1_X .. point4_Y
    const incutMatch = h.match(/^Incut_cut_(\d+)_point(1|2|3|4)_(X|Y)$/);
    if (incutMatch) {
      const idx = parseInt(incutMatch[1]);
      if (idx > incutMaxIndex.count) incutMaxIndex.count = idx;
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
      const existingDetails = plankDetailsMap.get(plankId) || { operations: {}, l_cuts: [], gola_profiles: [], incut_cuts: [] };
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
      
      // Extract Incut cuts - 2 or 4 points per cut
      const incut_cuts = existingDetails.incut_cuts || [];
      for (let incIdx = 1; incIdx <= incutMaxIndex.count; incIdx++) {
        const p1XIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point1_X`);
        const p1YIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point1_Y`);
        const p2XIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point2_X`);
        const p2YIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point2_Y`);
        
        if (p1XIdx === -1 || p1YIdx === -1 || p2XIdx === -1 || p2YIdx === -1) continue;
        
        const p1X = parseFloat(String(row[p1XIdx] ?? '').replace(/mm/g, '').trim());
        const p1Y = parseFloat(String(row[p1YIdx] ?? '').replace(/mm/g, '').trim());
        const p2X = parseFloat(String(row[p2XIdx] ?? '').replace(/mm/g, '').trim());
        const p2Y = parseFloat(String(row[p2YIdx] ?? '').replace(/mm/g, '').trim());
        
        if (!isNaN(p1X) && !isNaN(p1Y) && !isNaN(p2X) && !isNaN(p2Y) &&
            (p1X !== 0 || p1Y !== 0 || p2X !== 0 || p2Y !== 0)) {
          const incutObj = {
            point1: { x: p1X, y: p1Y },
            point2: { x: p2X, y: p2Y }
          };
          
          // Check for point3 and point4 (4-point rectangular cutout)
          const p3XIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point3_X`);
          const p3YIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point3_Y`);
          const p4XIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point4_X`);
          const p4YIdx = formattedHeaders.indexOf(`Incut_cut_${incIdx}_point4_Y`);
          
          if (p3XIdx !== -1 && p3YIdx !== -1 && p4XIdx !== -1 && p4YIdx !== -1) {
            const p3X = parseFloat(String(row[p3XIdx] ?? '').replace(/mm/g, '').trim());
            const p3Y = parseFloat(String(row[p3YIdx] ?? '').replace(/mm/g, '').trim());
            const p4X = parseFloat(String(row[p4XIdx] ?? '').replace(/mm/g, '').trim());
            const p4Y = parseFloat(String(row[p4YIdx] ?? '').replace(/mm/g, '').trim());
            if (!isNaN(p3X) && !isNaN(p3Y) && !(p3X === 0 && p3Y === 0)) {
              incutObj.point3 = { x: p3X, y: p3Y };
            }
            if (!isNaN(p4X) && !isNaN(p4Y) && !(p4X === 0 && p4Y === 0)) {
              incutObj.point4 = { x: p4X, y: p4Y };
            }
          }
          
          const incutExists = incut_cuts.some(ic =>
            ic.point1.x === p1X && ic.point1.y === p1Y && ic.point2.x === p2X && ic.point2.y === p2Y
          );
          if (!incutExists) {
            incut_cuts.push(incutObj);
          }
        }
      }
      
      // --- MODIFIED: Store EB Value, L-cuts, Gola profiles, and Incut cuts in Map ---
      const ebVal = ebIndex > -1 ? (parseFloat(row[ebIndex]) || 0) : 0;
      plankDetailsMap.set(plankId, { operations, ebValue: ebVal, l_cuts, gola_profiles, incut_cuts });
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
  
  // Add Incut cut headers - 2 points always, plus point3/point4 if present in formatted data
  const hasPoint3Headers = formattedHeaders.some(h => /^Incut_cut_\d+_point3_X$/.test(h));
  for (let i = 1; i <= incutMaxIndex.count; i++) {
    dynamicOpHeader.push(
      `Incut_cut_${i}_point1_X`, `Incut_cut_${i}_point1_Y`,
      `Incut_cut_${i}_point2_X`, `Incut_cut_${i}_point2_Y`
    );
    if (hasPoint3Headers) {
      dynamicOpHeader.push(
        `Incut_cut_${i}_point3_X`, `Incut_cut_${i}_point3_Y`,
        `Incut_cut_${i}_point4_X`, `Incut_cut_${i}_point4_Y`
      );
    }
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
    const details = plankDetailsMap.get(uniqueIdForLookup) || { operations: {}, ebValue: 0, l_cuts: [], gola_profiles: [], incut_cuts: [] }; 

    grouped[groupKey].push({
      id: String(id), name: String(name), width, height, thickness,
      material: originalMaterial, grain, operations: details.operations,
      ebValue: details.ebValue, // Store EB value in object
      l_cuts: details.l_cuts || [], // Store L-cut triplets
      gola_profiles: details.gola_profiles || [], // Store Gola profile triplets
      incut_cuts: details.incut_cuts || [] // Store inclined (incut) cuts - 2 points each
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

const CUT_ORDER_PLANK_THRESHOLD = 12;
const COL_SHEET = 4;
const COL_X = 5;
const COL_Y = 6;

/**
 * Fills the Cut Order column (last column) in finalResults.
 * For each sheet with more than CUT_ORDER_PLANK_THRESHOLD planks, assigns 1, 2, 3... by position (Y then X).
 * Leaves Cut Order blank for sheets with <= 12 planks.
 */
function _fillCutOrderColumn(finalResults) {
  if (!finalResults || finalResults.length < 2) return;
  const header = finalResults[0];
  const cutOrderCol = header.length - 1;
  if (header[cutOrderCol] !== "Cut Order") return;

  const dataRows = finalResults.slice(1);
  const bySheet = {};
  dataRows.forEach((row, idx) => {
    const sheet = row[COL_SHEET];
    if (!bySheet[sheet]) bySheet[sheet] = [];
    bySheet[sheet].push({ row: row, originalIndex: idx });
  });

  Object.keys(bySheet).forEach(sheetKey => {
    const group = bySheet[sheetKey];
    if (group.length <= CUT_ORDER_PLANK_THRESHOLD) return;
    group.sort((a, b) => {
      const yA = parseFloat(a.row[COL_Y]) || 0;
      const yB = parseFloat(b.row[COL_Y]) || 0;
      if (yA !== yB) return yA - yB;
      const xA = parseFloat(a.row[COL_X]) || 0;
      const xB = parseFloat(b.row[COL_X]) || 0;
      return xA - xB;
    });
    group.forEach((item, i) => {
      item.row[cutOrderCol] = i + 1;
    });
  });
}

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
      origW: headers.indexOf('Original Width'),
      origH: headers.indexOf('Original Height'),
      eb: headers.indexOf('EB Value'),
      cutOrder: headers.indexOf('Cut Order')
    };

    const requiredCols = ['id', 'name', 'mat', 'thk', 'sheet', 'x', 'y', 'w', 'h', 'rot', 'origW', 'origH', 'eb'];
    if (requiredCols.some(k => hIdx[k] === -1)) throw new Error("Missing standard columns in 'Nest Result'.");

    // 2. Build room/box lookup from Formatted_Plank_Data (by plank ID)
    const roomBoxByPlankId = new Map();
    const formattedSheet = ss.getSheetByName("Formatted_Plank_Data");
    if (formattedSheet) {
      const formattedData = formattedSheet.getDataRange().getValues();
      if (formattedData.length >= 2) {
        const formattedHeaders = formattedData[0].map(h => String(h).trim());
        const plankIdCol = formattedHeaders.indexOf('plank_id');
        const roomNameCol = formattedHeaders.indexOf('room_name');
        const boxModelCol = formattedHeaders.indexOf('box_model');
        if (plankIdCol >= 0) {
          for (let r = 1; r < formattedData.length; r++) {
            const row = formattedData[r];
            const pid = String(row[plankIdCol] || '').trim();
            if (!pid) continue;
            roomBoxByPlankId.set(pid, {
              roomName: roomNameCol >= 0 ? String(row[roomNameCol] || '').trim() : '',
              boxModel: boxModelCol >= 0 ? String(row[boxModelCol] || '').trim() : ''
            });
          }
        }
      }
    }

    // 3. Scan for Dynamic Operation Columns
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

    // 4. Process Rows
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
        
        // Nest Result stores plank-local; use directly for visualizer (no conversion)
        const relStartX = Number(startX);
        const relStartY = Number(startY);
        const relCenterX = Number(centerX);
        const relCenterY = Number(centerY);
        const relEndX = Number(endX);
        const relEndY = Number(endY);
        
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
        
        // Nest Result stores plank-local; use directly for visualizer (no conversion)
        const relStartX = Number(startX);
        const relStartY = Number(startY);
        const relCenterX = Number(centerX);
        const relCenterY = Number(centerY);
        const relEndX = Number(endX);
        const relEndY = Number(endY);
        
        gola_profiles.push({
          start: { x: relStartX, y: relStartY },
          center: { x: relCenterX, y: relCenterY },
          end: { x: relEndX, y: relEndY }
        });
        
        golaIdx++;
      }

      // Extract Incut cuts - 2 or 4 points per cut for visualization
      const incut_cuts = [];
      let incutIdx = 1;
      while (true) {
        const p1XCol = headers.indexOf(`Incut_cut_${incutIdx}_point1_X`);
        const p1YCol = headers.indexOf(`Incut_cut_${incutIdx}_point1_Y`);
        const p2XCol = headers.indexOf(`Incut_cut_${incutIdx}_point2_X`);
        const p2YCol = headers.indexOf(`Incut_cut_${incutIdx}_point2_Y`);
        
        if (p1XCol === -1 || p1YCol === -1 || p2XCol === -1 || p2YCol === -1) break;
        
        const p1X = row[p1XCol];
        const p1Y = row[p1YCol];
        const p2X = row[p2XCol];
        const p2Y = row[p2YCol];
        
        if (p1X === "" && p1Y === "" && p2X === "" && p2Y === "") {
          incutIdx++;
          continue;
        }
        
        const incutObj = {
          point1: { x: Number(p1X), y: Number(p1Y) },
          point2: { x: Number(p2X), y: Number(p2Y) }
        };
        
        const p3XCol = headers.indexOf(`Incut_cut_${incutIdx}_point3_X`);
        const p3YCol = headers.indexOf(`Incut_cut_${incutIdx}_point3_Y`);
        const p4XCol = headers.indexOf(`Incut_cut_${incutIdx}_point4_X`);
        const p4YCol = headers.indexOf(`Incut_cut_${incutIdx}_point4_Y`);
        if (p3XCol !== -1 && p3YCol !== -1) {
          const p3X = row[p3XCol], p3Y = row[p3YCol];
          if (p3X !== "" && p3Y !== "") incutObj.point3 = { x: Number(p3X), y: Number(p3Y) };
        }
        if (p4XCol !== -1 && p4YCol !== -1) {
          const p4X = row[p4XCol], p4Y = row[p4YCol];
          if (p4X !== "" && p4Y !== "") incutObj.point4 = { x: Number(p4X), y: Number(p4Y) };
        }
        
        incut_cuts.push(incutObj);
        incutIdx++;
      }

      const plankId = String(row[hIdx.id]).trim();
      const roomBox = roomBoxByPlankId.get(plankId) || { roomName: '', boxModel: '' };

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
        incut_cuts: incut_cuts, // Inclined (incut) cuts - 2 points each, line visualization
        // --- MODIFIED: Pass Original Sizes to UI ---
        originalWidth: Number(row[hIdx.origW]),
        originalHeight: Number(row[hIdx.origH]),
        ebValue: Number(row[hIdx.eb]),
        roomName: roomBox.roomName,
        boxModel: roomBox.boxModel,
        cutOrder: (hIdx.cutOrder >= 0 && row[hIdx.cutOrder] !== '' && row[hIdx.cutOrder] != null) ? (parseInt(row[hIdx.cutOrder], 10) || null) : null
      });
    }

    // 5. Group by Sheet
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

    const template = HtmlService.createTemplateFromFile("cutlist_editor");
    template.data = JSON.stringify({
      clientDetails: clientName, 
      spreadsheetName: ss.getName(),
      planks: sheetGroups,
      stats: { totalPlanks: placedPlanks.length, totalSheets: Object.keys(sheetGroups).length, materialThicknessStats: materialThicknessColors },
      constants: { SHEET_WIDTH, SHEET_HEIGHT, SPACING }
    });

    const html = template.evaluate().setWidth(1400).setHeight(850);
    ui.showModalDialog(html, "Cutlist Editor");

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

// =================================================================
// ====================     EDITABLE CUTLIST FUNCTIONS     ==========
// =================================================================

/**
 * Saves the edited cutlist from the visual editor back to the Nest Result sheet.
 * Called from the HTML editor via google.script.run
 * @param {string} jsonString - JSON string containing layouts and modifications
 * @returns {Object} - Success/failure status with message
 */
function saveEditedCutlist(jsonString) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const nestSheet = ss.getSheetByName("Nest Result");
    if (!nestSheet) {
      throw new Error("Nest Result sheet not found");
    }
    
    const payload = JSON.parse(jsonString);
    const layouts = payload.layouts;           // Updated allSheetLayouts
    const modifications = payload.modifications;  // Array of changes
    
    if (!modifications || modifications.length === 0) {
      return { success: true, message: "No changes to save" };
    }
    
    // Get existing data
    const data = nestSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    
    // Column indices for standard columns
    let cols = {
      id: headers.indexOf("Plank ID"),
      name: headers.indexOf("Plank Name"),
      material: headers.indexOf("Material"),
      thickness: headers.indexOf("Thickness"),
      sheet: headers.indexOf("Sheet"),
      x: headers.indexOf("X"),
      y: headers.indexOf("Y"),
      width: headers.indexOf("Placed Width"),
      height: headers.indexOf("Placed Height"),
      rotated: headers.indexOf("Rotated"),
      origWidth: headers.indexOf("Original Width"),
      origHeight: headers.indexOf("Original Height"),
      ebValue: headers.indexOf("EB Value"),
      cutOrder: headers.indexOf("Cut Order")
    };

    // If we have cutOrder modifications but no Cut Order column, extend sheet
    const hasCutOrderMods = modifications.some(m => m.type === 'cutOrder');
    if (hasCutOrderMods && cols.cutOrder === -1) {
      data[0].push("Cut Order");
      for (let r = 1; r < data.length; r++) data[r].push('');
      cols.cutOrder = data[0].length - 1;
    }
    
    // Validate required columns exist
    if (cols.id === -1 || cols.x === -1 || cols.y === -1 || cols.sheet === -1) {
      throw new Error("Missing required columns in Nest Result sheet");
    }
    
    // Process each modification
    let modifiedCount = 0;
    
    for (const mod of modifications) {
      // Find row by Plank ID
      let rowIndex = -1;
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][cols.id]).trim() === String(mod.plankId).trim()) {
          rowIndex = r;
          break;
        }
      }
      
      if (rowIndex === -1) {
        Logger.log(`Warning: Plank ID ${mod.plankId} not found in Nest Result`);
        continue;
      }
      
      // Get old position for coordinate recalculation
      const oldX = parseFloat(data[rowIndex][cols.x]) || 0;
      const oldY = parseFloat(data[rowIndex][cols.y]) || 0;
      const oldWidth = parseFloat(data[rowIndex][cols.width]) || 0;
      const oldHeight = parseFloat(data[rowIndex][cols.height]) || 0;
      
      if (mod.type === 'move') {
        // Update sheet number
        data[rowIndex][cols.sheet] = mod.toSheet;
        
        // Update X, Y coordinates
        data[rowIndex][cols.x] = mod.newX.toFixed(1);
        data[rowIndex][cols.y] = mod.newY.toFixed(1);
        
        // Recalculate operation coordinates (shift by delta)
        _recalculateOperationCoords(data, rowIndex, headers, oldX, oldY, mod.newX, mod.newY);
        
        modifiedCount++;
      }
      
      if (mod.type === 'rotate') {
        // Update rotated flag
        const wasRotated = String(data[rowIndex][cols.rotated]).toLowerCase() === 'yes';
        data[rowIndex][cols.rotated] = wasRotated ? "No" : "Yes";
        
        // Swap width and height
        data[rowIndex][cols.width] = oldHeight.toFixed(1);
        data[rowIndex][cols.height] = oldWidth.toFixed(1);
        
        // Also swap original dimensions if present
        if (cols.origWidth !== -1 && cols.origHeight !== -1) {
          const origW = parseFloat(data[rowIndex][cols.origWidth]) || 0;
          const origH = parseFloat(data[rowIndex][cols.origHeight]) || 0;
          data[rowIndex][cols.origWidth] = origH.toFixed(1);
          data[rowIndex][cols.origHeight] = origW.toFixed(1);
        }
        
        // Recalculate operation coordinates with rotation transform
        _recalculateOperationCoordsRotated(data, rowIndex, headers, mod.angle || 90, oldWidth, oldHeight);
        
        modifiedCount++;
      }
      
      if (mod.type === 'flip') {
        // Flip operation coordinates
        _recalculateOperationCoordsFlipped(data, rowIndex, headers, mod.direction, oldWidth, oldHeight);
        
        modifiedCount++;
      }

      if (mod.type === 'cutOrder' && cols.cutOrder >= 0 && mod.cutOrder != null) {
        data[rowIndex][cols.cutOrder] = parseInt(mod.cutOrder, 10) || '';
        modifiedCount++;
      }
    }

    // Sync L_cut, Gola_profile, Incut_cut from editor layouts so they persist after reopen
    _syncPlankLocalFeaturesFromLayouts(data, headers, cols, layouts);
    
    // Write back to sheet
    nestSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    
    return { 
      success: true, 
      message: `Successfully saved ${modifiedCount} modification(s) to Nest Result sheet` 
    };
    
  } catch (error) {
    Logger.log(`saveEditedCutlist Error: ${error.message}\nStack: ${error.stack}`);
    return { 
      success: false, 
      message: `Failed to save: ${error.message}` 
    };
  }
}

/**
 * Syncs L_cut, Gola_profile, and Incut_cut from editor payload.layouts into sheet data
 * so they persist after save and reopen (avoids L-cuts going missing).
 * Extends data columns if L_cut/Gola/Incut headers are missing.
 */
function _syncPlankLocalFeaturesFromLayouts(data, headers, cols, layouts) {
  if (!layouts || typeof layouts !== 'object') return;
  var plankById = {};
  var maxLCut = 0, maxGola = 0, maxIncut = 0;
  Object.keys(layouts).forEach(function (sheetNum) {
    var planks = layouts[sheetNum];
    if (Array.isArray(planks)) {
      planks.forEach(function (p) {
        if (p && p.id != null) {
          plankById[String(p.id).trim()] = p;
          if (p.l_cuts && p.l_cuts.length > maxLCut) maxLCut = p.l_cuts.length;
          if (p.gola_profiles && p.gola_profiles.length > maxGola) maxGola = p.gola_profiles.length;
          if (p.incut_cuts && p.incut_cuts.length > maxIncut) maxIncut = p.incut_cuts.length;
        }
      });
    }
  });

  var needCols = [];
  for (var i = 1; i <= maxLCut; i++) {
    needCols.push('L_cut_' + i + '_start_X', 'L_cut_' + i + '_start_Y', 'L_cut_' + i + '_center_X', 'L_cut_' + i + '_center_Y', 'L_cut_' + i + '_end_X', 'L_cut_' + i + '_end_Y');
  }
  for (var i = 1; i <= maxGola; i++) {
    needCols.push('Gola_profile_' + i + '_start_X', 'Gola_profile_' + i + '_start_Y', 'Gola_profile_' + i + '_center_X', 'Gola_profile_' + i + '_center_Y', 'Gola_profile_' + i + '_end_X', 'Gola_profile_' + i + '_end_Y');
  }
  var hasInplankPoints = false;
  Object.keys(plankById).forEach(function (pid) {
    var p = plankById[pid];
    if (p && p.incut_cuts) p.incut_cuts.forEach(function (ic) {
      if (ic.point3 || ic.point4) hasInplankPoints = true;
    });
  });
  for (var i = 1; i <= maxIncut; i++) {
    needCols.push('Incut_cut_' + i + '_point1_X', 'Incut_cut_' + i + '_point1_Y', 'Incut_cut_' + i + '_point2_X', 'Incut_cut_' + i + '_point2_Y');
    if (hasInplankPoints) {
      needCols.push('Incut_cut_' + i + '_point3_X', 'Incut_cut_' + i + '_point3_Y', 'Incut_cut_' + i + '_point4_X', 'Incut_cut_' + i + '_point4_Y');
    }
  }
  for (var c = 0; c < needCols.length; c++) {
    if (headers.indexOf(needCols[c]) === -1) {
      headers.push(needCols[c]);
      data[0].push(needCols[c]);
      for (var r = 1; r < data.length; r++) data[r].push('');
    }
  }

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var plankId = row[cols.id] != null ? String(row[cols.id]).trim() : '';
    if (!plankId) continue;
    var plank = plankById[plankId];
    if (!plank) continue;

    var idx = 1;
    if (plank.l_cuts && plank.l_cuts.length > 0) {
      plank.l_cuts.forEach(function (lc) {
        var startXCol = headers.indexOf('L_cut_' + idx + '_start_X');
        var startYCol = headers.indexOf('L_cut_' + idx + '_start_Y');
        var centerXCol = headers.indexOf('L_cut_' + idx + '_center_X');
        var centerYCol = headers.indexOf('L_cut_' + idx + '_center_Y');
        var endXCol = headers.indexOf('L_cut_' + idx + '_end_X');
        var endYCol = headers.indexOf('L_cut_' + idx + '_end_Y');
        if (startXCol !== -1 && startYCol !== -1 && centerXCol !== -1 && centerYCol !== -1 && endXCol !== -1 && endYCol !== -1) {
          row[startXCol] = (lc.start && lc.start.x != null) ? Number(lc.start.x).toFixed(1) : '';
          row[startYCol] = (lc.start && lc.start.y != null) ? Number(lc.start.y).toFixed(1) : '';
          row[centerXCol] = (lc.center && lc.center.x != null) ? Number(lc.center.x).toFixed(1) : '';
          row[centerYCol] = (lc.center && lc.center.y != null) ? Number(lc.center.y).toFixed(1) : '';
          row[endXCol] = (lc.end && lc.end.x != null) ? Number(lc.end.x).toFixed(1) : '';
          row[endYCol] = (lc.end && lc.end.y != null) ? Number(lc.end.y).toFixed(1) : '';
        }
        idx++;
      });
    }
    while (true) {
      var startXCol = headers.indexOf('L_cut_' + idx + '_start_X');
      if (startXCol === -1) break;
      var startYCol = headers.indexOf('L_cut_' + idx + '_start_Y');
      var centerXCol = headers.indexOf('L_cut_' + idx + '_center_X');
      var centerYCol = headers.indexOf('L_cut_' + idx + '_center_Y');
      var endXCol = headers.indexOf('L_cut_' + idx + '_end_X');
      var endYCol = headers.indexOf('L_cut_' + idx + '_end_Y');
      if (startYCol === -1 || centerXCol === -1 || centerYCol === -1 || endXCol === -1 || endYCol === -1) break;
      row[startXCol] = row[startYCol] = row[centerXCol] = row[centerYCol] = row[endXCol] = row[endYCol] = '';
      idx++;
    }

    idx = 1;
    if (plank.gola_profiles && plank.gola_profiles.length > 0) {
      plank.gola_profiles.forEach(function (gp) {
        var startXCol = headers.indexOf('Gola_profile_' + idx + '_start_X');
        var startYCol = headers.indexOf('Gola_profile_' + idx + '_start_Y');
        var centerXCol = headers.indexOf('Gola_profile_' + idx + '_center_X');
        var centerYCol = headers.indexOf('Gola_profile_' + idx + '_center_Y');
        var endXCol = headers.indexOf('Gola_profile_' + idx + '_end_X');
        var endYCol = headers.indexOf('Gola_profile_' + idx + '_end_Y');
        if (startXCol !== -1 && startYCol !== -1 && centerXCol !== -1 && centerYCol !== -1 && endXCol !== -1 && endYCol !== -1) {
          row[startXCol] = (gp.start && gp.start.x != null) ? Number(gp.start.x).toFixed(1) : '';
          row[startYCol] = (gp.start && gp.start.y != null) ? Number(gp.start.y).toFixed(1) : '';
          row[centerXCol] = (gp.center && gp.center.x != null) ? Number(gp.center.x).toFixed(1) : '';
          row[centerYCol] = (gp.center && gp.center.y != null) ? Number(gp.center.y).toFixed(1) : '';
          row[endXCol] = (gp.end && gp.end.x != null) ? Number(gp.end.x).toFixed(1) : '';
          row[endYCol] = (gp.end && gp.end.y != null) ? Number(gp.end.y).toFixed(1) : '';
        }
        idx++;
      });
    }
    while (true) {
      var startXCol = headers.indexOf('Gola_profile_' + idx + '_start_X');
      if (startXCol === -1) break;
      var startYCol = headers.indexOf('Gola_profile_' + idx + '_start_Y');
      var centerXCol = headers.indexOf('Gola_profile_' + idx + '_center_X');
      var centerYCol = headers.indexOf('Gola_profile_' + idx + '_center_Y');
      var endXCol = headers.indexOf('Gola_profile_' + idx + '_end_X');
      var endYCol = headers.indexOf('Gola_profile_' + idx + '_end_Y');
      if (startYCol === -1 || centerXCol === -1 || centerYCol === -1 || endXCol === -1 || endYCol === -1) break;
      row[startXCol] = row[startYCol] = row[centerXCol] = row[centerYCol] = row[endXCol] = row[endYCol] = '';
      idx++;
    }

    idx = 1;
    if (plank.incut_cuts && plank.incut_cuts.length > 0) {
      plank.incut_cuts.forEach(function (ic) {
        var p1XCol = headers.indexOf('Incut_cut_' + idx + '_point1_X');
        var p1YCol = headers.indexOf('Incut_cut_' + idx + '_point1_Y');
        var p2XCol = headers.indexOf('Incut_cut_' + idx + '_point2_X');
        var p2YCol = headers.indexOf('Incut_cut_' + idx + '_point2_Y');
        if (p1XCol !== -1 && p1YCol !== -1 && p2XCol !== -1 && p2YCol !== -1) {
          row[p1XCol] = (ic.point1 && ic.point1.x != null) ? Number(ic.point1.x).toFixed(1) : '';
          row[p1YCol] = (ic.point1 && ic.point1.y != null) ? Number(ic.point1.y).toFixed(1) : '';
          row[p2XCol] = (ic.point2 && ic.point2.x != null) ? Number(ic.point2.x).toFixed(1) : '';
          row[p2YCol] = (ic.point2 && ic.point2.y != null) ? Number(ic.point2.y).toFixed(1) : '';
        }
        var p3XCol = headers.indexOf('Incut_cut_' + idx + '_point3_X');
        var p3YCol = headers.indexOf('Incut_cut_' + idx + '_point3_Y');
        var p4XCol = headers.indexOf('Incut_cut_' + idx + '_point4_X');
        var p4YCol = headers.indexOf('Incut_cut_' + idx + '_point4_Y');
        if (p3XCol !== -1 && p3YCol !== -1) {
          row[p3XCol] = (ic.point3 && ic.point3.x != null) ? Number(ic.point3.x).toFixed(1) : '';
          row[p3YCol] = (ic.point3 && ic.point3.y != null) ? Number(ic.point3.y).toFixed(1) : '';
        }
        if (p4XCol !== -1 && p4YCol !== -1) {
          row[p4XCol] = (ic.point4 && ic.point4.x != null) ? Number(ic.point4.x).toFixed(1) : '';
          row[p4YCol] = (ic.point4 && ic.point4.y != null) ? Number(ic.point4.y).toFixed(1) : '';
        }
        idx++;
      });
    }
    while (true) {
      var p1XCol = headers.indexOf('Incut_cut_' + idx + '_point1_X');
      if (p1XCol === -1) break;
      var p1YCol = headers.indexOf('Incut_cut_' + idx + '_point1_Y');
      var p2XCol = headers.indexOf('Incut_cut_' + idx + '_point2_X');
      var p2YCol = headers.indexOf('Incut_cut_' + idx + '_point2_Y');
      if (p1YCol === -1 || p2XCol === -1 || p2YCol === -1) break;
      row[p1XCol] = row[p1YCol] = row[p2XCol] = row[p2YCol] = '';
      var p3XCol = headers.indexOf('Incut_cut_' + idx + '_point3_X');
      var p3YCol = headers.indexOf('Incut_cut_' + idx + '_point3_Y');
      var p4XCol = headers.indexOf('Incut_cut_' + idx + '_point4_X');
      var p4YCol = headers.indexOf('Incut_cut_' + idx + '_point4_Y');
      if (p3XCol !== -1) row[p3XCol] = '';
      if (p3YCol !== -1) row[p3YCol] = '';
      if (p4XCol !== -1) row[p4XCol] = '';
      if (p4YCol !== -1) row[p4YCol] = '';
      idx++;
    }
  }
}

/**
 * Recalculates operation coordinates when a plank is moved (translation only).
 * Only shifts coordinates that are stored in ABSOLUTE (sheet) space.
 * L_cut, Gola_profile, and Incut_cut are stored in PLANK-LOCAL coords and must NOT be shifted on move.
 */
function _recalculateOperationCoords(data, rowIndex, headers, oldX, oldY, newX, newY) {
  const deltaX = newX - oldX;
  const deltaY = newY - oldY;

  // Plank-local columns: do not apply delta (they stay relative to plank origin)
  function isPlankLocalColumn(header) {
    return /^L_cut_\d+_/.test(header) || /^Gola_profile_\d+_/.test(header) || /^Incut_cut_\d+_/.test(header);
  }

  headers.forEach((header, colIndex) => {
    if (isPlankLocalColumn(header)) return;

    // Match X coordinate columns (standard ops only; plank-local already skipped)
    if (header.match(/_X$/) && (header.match(/_\d+_/) || header.match(/_start_X$/) || header.match(/_center_X$/) || header.match(/_end_X$/))) {
      const val = parseFloat(data[rowIndex][colIndex]);
      if (!isNaN(val) && val !== 0 && data[rowIndex][colIndex] !== '') {
        data[rowIndex][colIndex] = (val + deltaX).toFixed(1);
      }
    }
    // Match Y coordinate columns
    if (header.match(/_Y$/) && (header.match(/_\d+_/) || header.match(/_start_Y$/) || header.match(/_center_Y$/) || header.match(/_end_Y$/))) {
      const val = parseFloat(data[rowIndex][colIndex]);
      if (!isNaN(val) && val !== 0 && data[rowIndex][colIndex] !== '') {
        data[rowIndex][colIndex] = (val + deltaY).toFixed(1);
      }
    }
  });
}

/**
 * Recalculates operation coordinates when a plank is rotated.
 * All operations (holes, grooves, L_cut, Gola_profile, Incut_cut) follow the plank.
 * - Holes/grooves/slots: stored ABSOLUTE; convert to relative, rotate, convert back to absolute (and swap length/width for grooves).
 * - L_cut, Gola_profile, Incut_cut: stored PLANK-LOCAL; treat as relative, rotate, write back relative.
 */
function _recalculateOperationCoordsRotated(data, rowIndex, headers, angle, plankWidth, plankHeight) {
  const plankX = parseFloat(data[rowIndex][headers.indexOf("X")]) || 0;
  const plankY = parseFloat(data[rowIndex][headers.indexOf("Y")]) || 0;

  function isPlankLocalColumn(header) {
    return /^L_cut_\d+_/.test(header) || /^Gola_profile_\d+_/.test(header) || /^Incut_cut_\d+_/.test(header);
  }
  
  headers.forEach((header, colIndex) => {
    const xMatch = header.match(/^(.+_\d+)_X$/) || header.match(/^(.+)_(start|center|end)_X$/);
    if (!xMatch) return;
    const baseKey = xMatch[1];
    const yHeader = header.replace(/_X$/, '_Y');
    const yColIndex = headers.indexOf(yHeader);
    if (yColIndex === -1) return;

    const valX = parseFloat(data[rowIndex][colIndex]);
    const valY = parseFloat(data[rowIndex][yColIndex]);
    if (isNaN(valX) || isNaN(valY) || data[rowIndex][colIndex] === '' || data[rowIndex][yColIndex] === '') return;

    const isPlankLocal = isPlankLocalColumn(header);
    let relX, relY;
    if (isPlankLocal) {
      relX = valX;
      relY = valY;
    } else {
      relX = valX - plankX;
      relY = valY - plankY;
    }
    if (relX === 0 && relY === 0 && !isPlankLocal) return;

    let newRelX, newRelY;
    if (angle === 90 || angle === -270) {
      newRelX = relY;
      newRelY = plankWidth - relX;
    } else if (angle === 180 || angle === -180) {
      newRelX = plankWidth - relX;
      newRelY = plankHeight - relY;
    } else if (angle === 270 || angle === -90) {
      newRelX = plankHeight - relY;
      newRelY = relX;
    } else {
      newRelX = relY;
      newRelY = plankWidth - relX;
    }

    if (isPlankLocal) {
      data[rowIndex][colIndex] = newRelX.toFixed(1);
      data[rowIndex][yColIndex] = newRelY.toFixed(1);
    } else {
      data[rowIndex][colIndex] = (plankX + newRelX).toFixed(1);
      data[rowIndex][yColIndex] = (plankY + newRelY).toFixed(1);
    }
  });

  // Groove/slot length and width swapping (standard ops only)
  headers.forEach((header, colIndex) => {
    const match = header.match(/^(.+_\d+)_X$/);
    if (!match) return;
    const baseKey = match[1];
    const lenColIndex = headers.indexOf(baseKey + "_length");
    const widthColIndex = headers.indexOf(baseKey + "_width");
    if (lenColIndex === -1 || widthColIndex === -1) return;
    const oldLen = parseFloat(data[rowIndex][lenColIndex]) || 0;
    const oldWidth = parseFloat(data[rowIndex][widthColIndex]) || 0;
    if (oldLen !== 0 || oldWidth !== 0) {
      if (angle === 90 || angle === 270 || angle === -90 || angle === -270) {
        data[rowIndex][lenColIndex] = oldWidth.toFixed(1);
        data[rowIndex][widthColIndex] = oldLen.toFixed(1);
      }
    }
  });
}

/**
 * Recalculates operation coordinates when a plank is flipped.
 * All operations (holes, grooves, L_cut, Gola_profile, Incut_cut) follow the plank.
 * - Holes/grooves: stored ABSOLUTE; convert to relative, mirror, convert back to absolute.
 * - L_cut, Gola_profile, Incut_cut: stored PLANK-LOCAL; treat as relative, mirror, write back relative.
 */
function _recalculateOperationCoordsFlipped(data, rowIndex, headers, direction, plankWidth, plankHeight) {
  const plankX = parseFloat(data[rowIndex][headers.indexOf("X")]) || 0;
  const plankY = parseFloat(data[rowIndex][headers.indexOf("Y")]) || 0;

  function isPlankLocalColumn(header) {
    return /^L_cut_\d+_/.test(header) || /^Gola_profile_\d+_/.test(header) || /^Incut_cut_\d+_/.test(header);
  }
  
  headers.forEach((header, colIndex) => {
    const xMatch = header.match(/^(.+)_X$/);
    if (!xMatch || (!header.match(/_\d+_/) && !header.match(/_start_X$/) && !header.match(/_center_X$/) && !header.match(/_end_X$/))) return;
    const yHeader = header.replace('_X', '_Y');
    const yColIndex = headers.indexOf(yHeader);
    if (yColIndex === -1) return;

    const valX = parseFloat(data[rowIndex][colIndex]);
    const valY = parseFloat(data[rowIndex][yColIndex]);
    if (isNaN(valX) || isNaN(valY) || data[rowIndex][colIndex] === '' || data[rowIndex][yColIndex] === '') return;

    const isPlankLocal = isPlankLocalColumn(header);
    let relX = isPlankLocal ? valX : valX - plankX;
    let relY = isPlankLocal ? valY : valY - plankY;
    
    let newRelX = relX;
    let newRelY = relY;
    if (direction === 'horizontal') newRelX = plankWidth - relX;
    else if (direction === 'vertical') newRelY = plankHeight - relY;

    if (isPlankLocal) {
      data[rowIndex][colIndex] = newRelX.toFixed(1);
      data[rowIndex][yColIndex] = newRelY.toFixed(1);
    } else {
      data[rowIndex][colIndex] = (plankX + newRelX).toFixed(1);
      data[rowIndex][yColIndex] = (plankY + newRelY).toFixed(1);
    }
  });
}