/**
 * Creates a custom menu in the Google Sheet when the file is opened.
 * This function runs automatically as a simple trigger.
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    if (!ui) {
      console.error('onOpen: getUi() returned null - script may not be in spreadsheet context');
      return;
    }

    // 1. Create the sub-menu first
    const advancedMenu = ui.createMenu('Advanced AI Solvers')
      .addItem('🔥 Run Simulated Annealing', 'runSimulatedAnnealing')
      .addItem('🐦 Optimize with Particle Swarm (PSO)', 'runParticleSwarmOptimization');

    // 2. Create the main menu with the new 2-step process
    ui.createMenu('Nestup Tools')
    .addItem('🚀 STEP 1: Prepare Data', 'runStep1_PrepareData')
    .addItem('📊 STEP 2: Generate All Reports', 'runStep2_GenerateReports')
    .addSeparator() // --- Separator ---
    .addItem('🎨 Open 3D Designer', 'showDesigner')
    .addItem('Format SketchUp Data', 'showEdgeBindingDialog')
    .addSeparator()
    .addItem('Create Plank List', 'createPlankList')
    .addItem('Create Cutlist (MaxRects)', 'createCutlist')
    .addSubMenu(advancedMenu) // Add the pre-built sub-menu here
    .addSeparator()
    .addItem('Edit Cutlist', 'drawCutlist')
    .addItem('Download Cutlist Report', 'downloadCutlistReport')
    .addSeparator()
    .addItem('Calculate Box SFT (Level 1)', 'calculateBoxSFT')
    .addItem('Create Material Summary Sheet', 'createMaterialSummarySheet')
    .addItem('Generate Hardware','addHardwareSheet')
    .addItem('Generate Material Estimate', 'generateMaterialEstimate')
    .addItem('Generate Input QA', 'generateInputQASheet')
    .addItem('Generate Output QA', 'createOutputQASheet')
    .addItem('Generate invoice', 'generateInvoices')
    .addSeparator()
    .addItem('Check Assembly (Pre-G-Code)', 'showPhase2Validation')
    .addItem('Generate G-Code (Validated)', 'generateGCodeWithValidation')
    .addSeparator()
    .addItem('Generate pressing list', 'generatePressingList')
    .addItem('show Visualization', 'showVisualization')
    .addSeparator()
    .addItem('📁 Export All to Project Folder', 'exportAllDataToProjectFolder')
    .addItem('🔄 Sync Sheets (Import Changes)', 'showSyncDiffDialog')
    .addItem('📂 Open Project Folder', 'openProjectFolder')
      .addItem('🔧 Reset Project Folder Location', 'resetProjectFolderLocation')
      .addToUi();
  } catch (e) {
    console.error('onOpen failed - Nestup Tools menu not added:', e.name, e.message, e.stack);
  }
}
/**
 * NEW: Helper function to get the project name from a "Customer Details" sheet.
 * Assumes the sheet is named "Customer Details" and A2=Name, B2=Project ID.
 * @returns {string} A unique identifier, e.g., "ProjectID_CustomerName"
 */
function getProjectDetails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Customer Details");

  if (!sheet) {
    // If no sheet, just use the current date as a fallback
    return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
  }

  // Get Name from A2 and Project ID from B2
  const customerName = sheet.getRange("A2").getDisplayValue().trim() || "Customer";
  const projectID = sheet.getRange("B2").getDisplayValue().trim() || "Project";

  // Clean the names to be safe for filenames
  const safeName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
  const safeID = projectID.replace(/[^a-zA-Z0-9]/g, '_');

  return `${safeID}_${safeName}`;
}

/**
 * Runs the first part of the sequence: Format and Plank List.
 */
function runStep1_PrepareData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  try {
    ss.toast('Formatting Sketchup data...', 'Step 1/2');
    formatSketchUpData();
    SpreadsheetApp.flush(); // Force the sheet to update

    ss.toast('Creating Plank List...', 'Step 2/2');
    createPlankList();
    SpreadsheetApp.flush();

    ui.alert('✅ Step 1 Complete', 'Data has been formatted and the Plank List is created.\n\nPlease run your chosen AI Solver from the "Advanced AI Solvers" menu now.', ui.ButtonSet.OK);

  } catch (e) {
    ui.alert('An Error Occurred in Step 1', `The process stopped with an error:\n\n${e.message}`, ui.ButtonSet.OK);
  }
}

/**
 * Runs the second part of the sequence: All reports.
 * This assumes the "Nest Result" sheet already exists from running a solver.
 */
function runStep2_GenerateReports() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Check if "Nest Result" sheet exists first
  if (!ss.getSheetByName("Nest Result")) {
    ui.alert('"Nest Result" Sheet Not Found', 'You must run an AI Solver (like PSO) before you can generate reports.', ui.ButtonSet.OK);
    return;
  }

  try {
    ss.toast('Fetching project details...', 'Starting Reports...');
    const projectIdentifier = getProjectDetails();

    ss.toast('Generating visualization...', 'Step 1/8');
    drawCutlist(); // Or use 'showVisualization()'
    SpreadsheetApp.flush();


    ss.toast('Calculating SFT...', 'Step 2/8');
    calculateBoxSFT(); // This is already hardcoded for Level 1
    SpreadsheetApp.flush();

    ss.toast('Creating Material Summary...', 'Step 3/8');
    createMaterialSummarySheet();
    SpreadsheetApp.flush();

    ss.toast('Generating Material Estimate...', 'Step 4/8');
    // We must modify 'generateMaterialEstimate' to accept this
    generateMaterialEstimate(projectIdentifier);
    SpreadsheetApp.flush();

    ss.toast('Generating QA sheets...', 'Step 5/8');
    generateInputQASheet();
    SpreadsheetApp.flush();

    ss.toast('Generating QA sheets...', 'Step 6/8');
    createOutputQASheet();
    SpreadsheetApp.flush();

    ss.toast('Generating Pressing List...', 'Step 8/8');
    generatePressingList();
    SpreadsheetApp.flush();

    // Final success message
    ui.alert('✅ Reports Complete!', 'All 8 reports have been generated.', ui.ButtonSet.OK);

  } catch (e) {
    ui.alert('An Error Occurred in Step 2', `The process stopped with an error:\n\n${e.message}`, ui.ButtonSet.OK);
  }
}

/**
 * Exports all relevant data to the project folder.
 * This function is called from the custom menu.
 */
function exportAllDataToProjectFolder() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    ui.alert('Starting Export', 'Exporting all sheets to project folder...\nThis may take a moment.', ui.ButtonSet.OK);

    // 0. Ensure this spreadsheet is INSIDE the project folder
    moveActiveSpreadsheetToProjectFolder();

    // Export all sheets as linked Google Sheets
    // Assuming exportAllSheetsAsLinkedSpreadsheets() is defined elsewhere
    const results = exportAllSheetsAsLinkedSpreadsheets();

    ui.alert('✅ Export Complete!', 'All data has been exported to the project folder.', ui.ButtonSet.OK);

  } catch (e) {
    ui.alert('An Error Occurred During Export', `The export process stopped with an error:\n\n${e.message}`, ui.ButtonSet.OK);
  }
}
