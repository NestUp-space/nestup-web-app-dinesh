// CONFIGURATION - UPDATED WITH YOUR IDS
const INVOICE_CONFIG = {
  FFTL_TEMPLATE_ID: '1E6-apMSbPrkB1yGKLydbNB-9qHu3Sbi9tD5BTud3ITI', 
  MW_TEMPLATE_ID: '1GI4tU9E6CcUjtb7F-tpUWFdJ1t7bhcXcoNcvMczmkDs',    
  MAIN_FOLDER_ID: '1-NGljZSkPualg8ITJQok18_C94G_9goV'    
};

function generateInvoices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = ss.getName();
  
  // 1. GET DATA --------------------------------------------------------------
  
  // A. Get SFT Result
  const sftSheet = ss.getSheetByName("SFT Results");
  if (!sftSheet) {
    SpreadsheetApp.getUi().alert("Sheet 'SFT Result' not found.");
    return;
  }
  
  // Find "Total Square Feet:"
  const sftData = sftSheet.getDataRange().getValues();
  let rawSft = 0;
  for (let r = 0; r < sftData.length; r++) {
    for (let c = 0; c < sftData[r].length; c++) {
      if (String(sftData[r][c]).trim() === "Total Square Feet:") {
        rawSft = sftData[r][c+1]; // Number beside it
        break;
      }
    }
  }
  const totalSFT = Math.round(rawSft); 
  
  // B. Get Customer Details
  const custSheet = ss.getSheetByName("Customer Details");
  if (!custSheet) {
     SpreadsheetApp.getUi().alert("Sheet 'Customer Details' not found.");
     return;
  }
  const custDataRaw = custSheet.getDataRange().getValues();
  let custData = {};
  
  for (let i = 0; i < custDataRaw.length; i++) {
    let key = String(custDataRaw[i][0]).trim();
    let val = custDataRaw[i][1];
    custData[key] = val;
  }
  
  // C. Get Material Quantities (Fuzzy Search)
  const matSheet = ss.getSheetByName("Material Estimate"); 
  if (!matSheet) {
    SpreadsheetApp.getUi().alert("Sheet 'Material Estimate' not found. Please generate it first.");
    return;
  }
  const matData = matSheet.getDataRange().getValues();
  
  const cleanStr = (s) => String(s).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  let materials = {
    'fevicold3': { qty: 0, name: "Fevicol - D3" },
    'fevicolprobond': { qty: 0, name: "Fevicol - Probond" },
    'heatx': { qty: 0, name: "HeatX" },
    'vbfittings': { qty: 0, name: "VB Fittings" },
    'abrotapes': { qty: 0, name: "Abro Tapes" },
    'laminatecutter': { qty: 0, name: "Laminate cutter" }
  };

  for (let r = 0; r < matData.length; r++) {
    for (let c = 0; c < matData[r].length - 1; c++) { 
      let cellVal = cleanStr(matData[r][c]);
      if (materials[cellVal]) {
        let qty = matData[r][c+1];
        if (!isNaN(parseFloat(qty))) {
           materials[cellVal].qty += parseFloat(qty);
        }
      }
    }
  }

  // 2. CALCULATE VALUES ------------------------------------------------------
  
  // --- LOGISTICS (FFTL) ---
  let transportCost = 0;
  if (custData['Transport'] === 'Yes') {
    let input = Browser.inputBox('Transport Amount', 'Enter Transport Amount for ' + custData['Customer Name'] + ':', Browser.Buttons.OK_CANCEL);
    if (input == 'cancel') return;
    transportCost = parseFloat(input);
  }

  let packingCost = 0;
  if (totalSFT > 400) packingCost = totalSFT * 15;
  else if (totalSFT >= 300) packingCost = totalSFT * 17;
  else if (totalSFT >= 200) packingCost = totalSFT * 18;
  else packingCost = totalSFT * 20;

  let loadingCost = (custData['Loading'] === 'Yes') ? 2500 : 0;
  let unloadingCost = (custData['Unloading'] === 'Yes') ? 2500 : 0;
  let hamaliCost = (custData['Hamali'] === 'Yes') ? (totalSFT * 10) : 0;

  // --- MATERIALS (FFTL) ---
  let d3Rate = (String(custData['Project Type']).toLowerCase() === 'home owner') ? 236 : 230;
  
  let materialCosts = [];
  
  if (materials['fevicold3'].qty > 0) materialCosts.push({item: "Fevicol - D3", qty: materials['fevicold3'].qty, price: materials['fevicold3'].qty * d3Rate});
  if (materials['fevicolprobond'].qty > 0) materialCosts.push({item: "Fevicol - Probond", qty: materials['fevicolprobond'].qty, price: materials['fevicolprobond'].qty * 472});
  if (materials['heatx'].qty > 0) materialCosts.push({item: "HeatX", qty: materials['heatx'].qty, price: materials['heatx'].qty * 696.2});
  if (materials['vbfittings'].qty > 0) materialCosts.push({item: "VB Fittings", qty: materials['vbfittings'].qty, price: materials['vbfittings'].qty * 42});
  if (materials['abrotapes'].qty > 0) materialCosts.push({item: "Abro Tapes", qty: materials['abrotapes'].qty, price: materials['abrotapes'].qty * 130});
  if (materials['laminatecutter'].qty > 0) materialCosts.push({item: "Laminate Cutter", qty: materials['laminatecutter'].qty, price: materials['laminatecutter'].qty * 30});

  // --- MW CALCULATIONS ---
  let mwProductionAmount = totalSFT * 220;


  // 3. GENERATE FILES - Save to Project Folder ONLY ------------------------
  
  // Get project invoices folder
  const invoicesFolder = getProjectSubfolder('INVOICES');
  
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

  // --- GENERATE FFTL INVOICE ---
  const fftlFile = DriveApp.getFileById(INVOICE_CONFIG.FFTL_TEMPLATE_ID).makeCopy(sheetName + "_FFTL", invoicesFolder);
  const fftlDoc = DocumentApp.openById(fftlFile.getId());
  const fftlBody = fftlDoc.getBody();
  
  fftlBody.replaceText("{{Proforma Invoice Date}}", dateStr);
  fftlBody.replaceText("{{Proforma Invoice Number}}", "FFTL-" + Math.floor(Math.random() * 1000)); 
  fftlBody.replaceText("{{Customer Name}}", custData['Customer Name'] || "");
  fftlBody.replaceText("{{Site Address}}", custData['Location'] || "");
  
  fftlBody.replaceText("{{Transport Amount}}", transportCost.toFixed(2));
  fftlBody.replaceText("{{Packing Amount}}", packingCost.toFixed(2));
  fftlBody.replaceText("{{Loading Vehicle}}", loadingCost.toFixed(2));
  fftlBody.replaceText("{{Unloading Vehicle}}", unloadingCost.toFixed(2));
  fftlBody.replaceText("{{Lifting/Hamali Amount}}", hamaliCost.toFixed(2));
  
  const tables = fftlBody.getTables();
  if (tables.length > 1) { 
    const itemTable = tables[1]; 
    let totalMatCost = 0;
    materialCosts.forEach(m => {
      let row = itemTable.appendTableRow();
      row.appendTableCell(m.item + " (Qty: " + m.qty + ")");
      row.appendTableCell(m.price.toFixed(2));
      totalMatCost += m.price;
    });

    let grandTotal = transportCost + packingCost + loadingCost + unloadingCost + hamaliCost + totalMatCost;
    let totalRow = itemTable.appendTableRow();
    totalRow.appendTableCell("TOTAL AMOUNT").setBold(true);
    totalRow.appendTableCell(grandTotal.toFixed(2)).setBold(true);
  }
  
  fftlDoc.saveAndClose();
  
  // --- GENERATE MW INVOICE ---
  const mwFile = DriveApp.getFileById(INVOICE_CONFIG.MW_TEMPLATE_ID).makeCopy(sheetName + "_MW", invoicesFolder);
  const mwDoc = DocumentApp.openById(mwFile.getId());
  const mwBody = mwDoc.getBody();
  
  mwBody.replaceText("{{Performa Date}}", dateStr);
  mwBody.replaceText("{{Performa Invoice Number}}", "MW-" + Math.floor(Math.random() * 1000));
  mwBody.replaceText("{{Customer Name}}", custData['Customer Name'] || "");
  mwBody.replaceText("{{Site Address}}", custData['Location'] || "");
  mwBody.replaceText("{{SFT}}", totalSFT);
  mwBody.replaceText("{{Production Amount}}", mwProductionAmount.toFixed(2));
  
  mwDoc.saveAndClose();
  
  // 4. DISPLAY RESULT --------------------------------------------------------
  const fftlUrl = fftlFile.getUrl();
  const mwUrl = mwFile.getUrl();
  const projectFolderUrl = getProjectFolderUrl();
  
  const htmlOutput = HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 15px;">
      <h3 style="color: #2e7d32; margin-top: 0;">✅ Invoices Generated!</h3>
      
      <div style="background: #e8f5e9; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
        <strong>📁 Project Folder (All Files):</strong><br>
        <a href="${projectFolderUrl}" target="_blank" style="color: #1976d2;">Open Project Folder</a>
      </div>
      
      <p><a href="${fftlUrl}" target="_blank">📄 Open FFTL Invoice</a></p>
      <p><a href="${mwUrl}" target="_blank">📄 Open MW Invoice</a></p>
      
      <button onclick="google.script.host.close()" style="background: #757575; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Close</button>
    </div>
  `).setWidth(350).setHeight(280);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Generation Complete');
}