# Test Data for Simple Box Model

## 1. Basic Information

- __Model Name / Type:__ `Simple Box`
- __Description:__ `A basic rectangular box with five planks: back, left, right, top, and bottom. Suitable for simple storage units, cabinets, and shelving.`
  - *(You can copy this from the `description` field in `simpleBox.json` or write your own.)*
- __Catalogue Image:__ `/img/models/simple-box.png`
  - *(This is the path from `simpleBox.json`. The UI will likely have an upload feature for this.)*

## 2. Input Parameters (for Runtime)

Here are the runtime input parameters derived from `simpleBox.json`, formatted for your UI:

- __Parameter Name (ID):__ `boxHeight`

  - __Display Label:__ `Box Height`
  - __Input Type:__ `Number`
  - __Default Value:__ (Leave empty or `0`)
  - __Unit (if applicable):__ `mm`
  - __Description:__ `The overall height of the box.`

- __Parameter Name (ID):__ `boxWidth`

  - __Display Label:__ `Box Width`
  - __Input Type:__ `Number`
  - __Default Value:__ (Leave empty or `0`)
  - __Unit (if applicable):__ `mm`
  - __Description:__ `The overall width of the box.`

- __Parameter Name (ID):__ `boxDepth`

  - __Display Label:__ `Box Depth`
  - __Input Type:__ `Number`
  - __Default Value:__ (Leave empty or `0`)
  - __Unit (if applicable):__ `mm`
  - __Description:__ `The overall depth of the box.`

- __Parameter Name (ID):__ `leftAdjacency`

  - __Display Label:__ `Left Side Adjacency`
  - __Input Type:__ `Select` (Options might include: "Expose", "Wall", "AdjacentBox") or `Text`
  - __Default Value:__ `Expose`
  - __Unit (if applicable):__ N/A
  - __Description:__ `Defines how the left side of the box is finished or if it connects to another element.`

- __Parameter Name (ID):__ `rightAdjacency`

  - __Display Label:__ `Right Side Adjacency`
  - __Input Type:__ `Select` (Options might include: "Expose", "Wall", "AdjacentBox") or `Text`
  - __Default Value:__ `Expose`
  - __Unit (if applicable):__ N/A
  - __Description:__ `Defines how the right side of the box is finished or if it connects to another element.`

- __Parameter Name (ID):__ `outerMaterialCode`

  - __Display Label:__ `Outer Material`
  - __Input Type:__ `MaterialPicker` or `Select` (from available material codes)
  - __Default Value:__ (Leave empty or select a common default)
  - __Unit (if applicable):__ N/A
  - __Description:__ `The material code for the external surfaces of the box.`

- __Parameter Name (ID):__ `innerMaterialCode`

  - __Display Label:__ `Inner Material`
  - __Input Type:__ `MaterialPicker` or `Select`
  - __Default Value:__ (Leave empty or select a common default)
  - __Unit (if applicable):__ N/A
  - __Description:__ `The material code for the internal surfaces of the box.`

- __Parameter Name (ID):__ `backMaterialCode`

  - __Display Label:__ `Back Panel Material`
  - __Input Type:__ `MaterialPicker` or `Select`
  - __Default Value:__ (Leave empty or select a common default)
  - __Unit (if applicable):__ N/A
  - __Description:__ `The material code for the back panel of the box.`

- __Parameter Name (ID):__ `hasDoor`

  - __Display Label:__ `Has Door?`
  - __Input Type:__ `Boolean` (Checkbox or Toggle Switch)
  - __Default Value:__ `false` (unchecked)
  - __Unit (if applicable):__ N/A
  - __Description:__ `Indicates if the box includes a door.`

- __Parameter Name (ID):__ `doorExposedSide`

  - __Display Label:__ `Door Exposed Side`
  - __Input Type:__ `Select` (Options like "Front", "Left", "Right") or `Text`
  - __Default Value:__ (Leave empty, e.g., `Front` if `hasDoor` is true)
  - __Unit (if applicable):__ N/A
  - __Description:__ `Specifies which side the door is on. Only applicable if 'Has Door?' is true.` (This field might be conditionally displayed on the UI).

- __Parameter Name (ID):__ `numberOfShelves`

  - __Display Label:__ `Number of Shelves`
  - __Input Type:__ `Number`
  - __Default Value:__ `0`
  - __Unit (if applicable):__ N/A
  - __Description:__ `The number of internal shelves in the box.`

- __Parameter Name (ID):__ `skirting`

  - __Display Label:__ `Skirting`
  - __Input Type:__ `Select` (from available skirting types) or `Text`
  - __Default Value:__ (Leave empty or select "None")
  - __Unit (if applicable):__ N/A
  - __Description:__ `Type of skirting to be added to the box, if any.`

## 3. Bill of Materials (Planks, Hardware, etc.)

Here's the BoM structure. Each item will have its details and the corresponding JavaScript logic script.

### 1. Left Plank

- __Item Name:__ `Left Side Panel`
- __Item Type:__ `Plank`
- __Item Description:__ `The main left vertical panel of the box.`
- __Plank Specific Details (Calculated by script):__
  - Width: *(Calculated)*
  - Height: *(Calculated)*
  - Material Code: *(Derived from runtimeInputs)*
  - Plank ID Format: `B1P1_L`
- __Item Logic Script:__

    ```javascript
    function calculateProperties(runtimeInputs, globalConstants) {
      const {
        boxHeight, boxDepth, leftAdjacency, skirting,
        outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition
      } = runtimeInputs;
      const { edgeBandingExposedThickness, edgeBandingInternalThickness, backPanelGrooveDepth } = globalConstants;

      const BH = boxHeight;
      const BD = boxDepth;
      const LE = leftAdjacency;
      const SKT = skirting || 0;

      const ET = outerMaterialDefinition.overallMaterialThickness_mm;
      const IT = innerMaterialDefinition.overallMaterialThickness_mm;
      const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ELC = outerMaterialDefinition.code;
      const ILC = innerMaterialDefinition.code;

      const CEB = edgeBandingExposedThickness;
      const IEB = edgeBandingInternalThickness;

      let plankWidth, plankHeight, materialCode, plankThickness, grainDirection;
      const screwHoles = [];
      const vbScrewHoles = [];
      let backPanelGroove = null;

      const name = 'Left Plank';
      const plankId = 'B1P1_L'; // Fixed ID

      if (LE === 'Expose') {
        plankWidth = BD - ET - (2 * CEB); // Assuming top/bottom planks are ET thick
        plankHeight = BH - (2 * CEB);     // Assuming top/bottom edges are banded
        materialCode = ELC;
        plankThickness = ET;
        grainDirection = outerMaterialDefinition.grainDirection;
      } else { // Box or Wall
        // Original: BD - ET - BT - 2 * IEB; (ET is outer, BT is back)
        // Corrected: BD - IT (top) - BT (back) - 2 * IEB (front/bottom edge of side)
        // This assumes the side plank sits between a top and bottom plank (both IT thick) and flush against a back panel (BT thick)
        // The width of the side panel is the box depth minus thickness of top/bottom panels and back panel.
        // For a side panel, its "width" is the depth of the box.
        plankWidth = BD - IT - BT - (2 * IEB); // This is depth of side panel
        plankHeight = BH - SKT - (2 * IEB); // Height minus skirting and top/bottom edge banding
        materialCode = ILC;
        plankThickness = IT;
        grainDirection = innerMaterialDefinition.grainDirection;
      }

      // Screw Holes for Left Plank (Original logic had z: -0.01, type: 'T3')
      // Assuming these are for attaching top/bottom panels if not exposed
      if (LE !== 'Expose') {
        // Holes to attach top panel
        screwHoles.push({ x: plankWidth / 4, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 2, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: (3 * plankWidth) / 4, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        // Holes to attach bottom panel
        screwHoles.push({ x: plankWidth / 4, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 2, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: (3 * plankWidth) / 4, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
      }

      // VB Screw Holes for Left Plank (Original logic had z: ET - 11 or IT - 11, type: 'T6')
      // These are for connecting to adjacent exposed elements or for construction
      if (LE === 'Expose') {
        // For bottom connection
        vbScrewHoles.push({ x: 50 - CEB, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        vbScrewHoles.push({ x: plankWidth - 50 + CEB, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        if (plankWidth > 450) {
          vbScrewHoles.push({ x: plankWidth / 2, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        }
        // For top connection
        vbScrewHoles.push({ x: 50 - CEB, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        vbScrewHoles.push({ x: plankWidth - 50 + CEB, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        if (plankWidth > 450) {
          vbScrewHoles.push({ x: plankWidth / 2, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        }
      }
      
      // Back Panel Groove for Left Plank
      let grooveTypeL = '';
      if (BT === 8) grooveTypeL = 'T7';
      else if (BT === 10) grooveTypeL = 'T8';
      else if (BT === 12) grooveTypeL = 'T9';
      else if (BT === 14) grooveTypeL = 'T10'; // Max thickness for groove type
      
      if (grooveTypeL) {
        // Groove is on the inner face, offset from the back edge.
        // x1,y1 is start point, x2,y2 is end point. 'width' of side panel is box depth.
        // Groove runs along height of side panel.
        // Original: x1: plank.width - BT / 2 + CEB ... z: 10 (depth)
        // Assuming groove is 'backPanelGrooveDepth' from the back edge of the plank.
        // And groove depth is BT/2 or a fixed value. Let's use globalConstants.backPanelGrooveDepth.
        const grooveOffsetFromBackEdge = 10; // mm, standard offset for back panel groove
        backPanelGroove = {
          x1: plankWidth - grooveOffsetFromBackEdge - (BT / 2), // X along the width (depth direction of box)
          y1: SKT > 0 ? SKT : (LE === 'Expose' ? CEB : IEB),     // Start Y (along height of box)
          x2: plankWidth - grooveOffsetFromBackEdge - (BT / 2),
          y2: plankHeight - (LE === 'Expose' ? CEB : IEB),       // End Y
          depth: BT / 2, // Groove depth is half of back panel thickness
          type: grooveTypeL
        };
      }

      return {
        plankId, name,
        width: parseFloat(plankWidth.toFixed(2)),
        height: parseFloat(plankHeight.toFixed(2)),
        thickness: plankThickness,
        materialCode, grainDirection,
        screwHoles, vbScrewHoles, backPanelGroove
      };
    }
    ```

### 2. Right Plank

- __Item Name:__ `Right Side Panel`
- __Item Type:__ `Plank`
- __Item Description:__ `The main right vertical panel of the box.`
- __Plank Specific Details (Calculated by script):__
  - Plank ID Format: `B1P1_R`
- __Item Logic Script:__

    ```javascript
    function calculateProperties(runtimeInputs, globalConstants) {
      const {
        boxHeight, boxDepth, rightAdjacency, skirting,
        outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition
      } = runtimeInputs;
      const { edgeBandingExposedThickness, edgeBandingInternalThickness, backPanelGrooveDepth } = globalConstants;

      const BH = boxHeight;
      const BD = boxDepth;
      const RE = rightAdjacency;
      const SKT = skirting || 0;

      const ET = outerMaterialDefinition.overallMaterialThickness_mm;
      const IT = innerMaterialDefinition.overallMaterialThickness_mm;
      const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ELC = outerMaterialDefinition.code;
      const ILC = innerMaterialDefinition.code;

      const CEB = edgeBandingExposedThickness;
      const IEB = edgeBandingInternalThickness;

      let plankWidth, plankHeight, materialCode, plankThickness, grainDirection;
      const screwHoles = [];
      const vbScrewHoles = [];
      let backPanelGroove = null;
      
      const name = 'Right Plank';
      const plankId = 'B1P1_R'; // Fixed ID

      if (RE === 'Expose') {
        plankWidth = BD - ET - (2 * CEB);
        plankHeight = BH - (2 * CEB);
        materialCode = ELC;
        plankThickness = ET;
        grainDirection = outerMaterialDefinition.grainDirection;
      } else { // Box or Wall
        plankWidth = BD - IT - BT - (2 * IEB);
        plankHeight = BH - SKT - (2 * IEB);
        materialCode = ILC;
        plankThickness = IT;
        grainDirection = innerMaterialDefinition.grainDirection;
      }

      // Screw Holes (similar to Left Plank)
      if (RE !== 'Expose') {
        screwHoles.push({ x: plankWidth / 4, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 2, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: (3 * plankWidth) / 4, y: IT / 2, z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 4, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: plankWidth / 2, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
        screwHoles.push({ x: (3 * plankWidth) / 4, y: plankHeight - (IT / 2), z: plankThickness / 2, type: 'T3' });
      }

      // VB Screw Holes (similar to Left Plank)
      if (RE === 'Expose') {
        vbScrewHoles.push({ x: 50 - CEB, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        vbScrewHoles.push({ x: plankWidth - 50 + CEB, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        if (plankWidth > 450) {
          vbScrewHoles.push({ x: plankWidth / 2, y: IT - 9 - CEB, z: plankThickness - 11, type: 'T6_VB_Bottom' });
        }
        vbScrewHoles.push({ x: 50 - CEB, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        vbScrewHoles.push({ x: plankWidth - 50 + CEB, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        if (plankWidth > 450) {
          vbScrewHoles.push({ x: plankWidth / 2, y: plankHeight - IT + 9 + CEB, z: plankThickness - 11, type: 'T6_VB_Top' });
        }
      }
      
      // Back Panel Groove (similar to Left Plank)
      let grooveTypeR = '';
      if (BT === 8) grooveTypeR = 'T7';
      else if (BT === 10) grooveTypeR = 'T8';
      else if (BT === 12) grooveTypeR = 'T9';
      else if (BT === 14) grooveTypeR = 'T10';
      
      if (grooveTypeR) {
        const grooveOffsetFromBackEdge = 10;
        backPanelGroove = {
          x1: plankWidth - grooveOffsetFromBackEdge - (BT / 2),
          y1: SKT > 0 ? SKT : (RE === 'Expose' ? CEB : IEB),
          x2: plankWidth - grooveOffsetFromBackEdge - (BT / 2),
          y2: plankHeight - (RE === 'Expose' ? CEB : IEB),
          depth: BT / 2,
          type: grooveTypeR
        };
      }

      return {
        plankId, name,
        width: parseFloat(plankWidth.toFixed(2)),
        height: parseFloat(plankHeight.toFixed(2)),
        thickness: plankThickness,
        materialCode, grainDirection,
        screwHoles, vbScrewHoles, backPanelGroove
      };
    }
    ```

### 3. Top Plank

- __Item Name:__ `Top Panel`
- __Item Type:__ `Plank`
- __Item Description:__ `The main top horizontal panel of the box.`
- __Plank Specific Details (Calculated by script):__
  - Plank ID Format: `B1P1_T`
- __Item Logic Script:__

    ```javascript
    function calculateProperties(runtimeInputs, globalConstants) {
      const {
        boxWidth, boxDepth, leftAdjacency, rightAdjacency,
        outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition
      } = runtimeInputs;
      const { edgeBandingInternalThickness } = globalConstants; // CEB not used directly here based on original

      const BW = boxWidth;
      const BD = boxDepth;
      const LE = leftAdjacency;
      const RE = rightAdjacency;

      const ET = outerMaterialDefinition.overallMaterialThickness_mm;
      const IT = innerMaterialDefinition.overallMaterialThickness_mm;
      const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ILC = innerMaterialDefinition.code; // Top panel is usually inner material

      const IEB = edgeBandingInternalThickness;

      let plankWidth, plankHeight; // Height of top panel is boxDepth - related items
      const screwHoles = []; // Not in original generator for top
      const vbScrewHoles = [];
      const backPanelGroove = null; // Not typical for top panel

      const name = 'Top Plank';
      const plankId = 'B1P1_T';
      const materialCode = ILC;
      const plankThickness = IT;
      const grainDirection = innerMaterialDefinition.grainDirection;

      // Width calculation for Top/Bottom planks (panel sits between side panels)
      if (LE === 'Expose' && RE === 'Expose') { // Both sides are thick exposed panels
        plankWidth = BW - (2 * ET) - (2 * IEB); // Box width minus two exposed side panel thicknesses, minus edge banding on top/bottom panel
      } else if (LE === 'Expose' || RE === 'Expose') { // One side exposed (ET), one internal (IT)
        plankWidth = BW - ET - IT - (2 * IEB);
      } else { // Both sides internal (IT)
        plankWidth = BW - (2 * IT) - (2 * IEB);
      }
      
      // Height (depth) of Top/Bottom plank
      // Sits in front of back panel, potentially inside side panel grooves for back panel
      // Original: BD - 2 * IT - BT - ET; (This formula was marked as unusual)
      // Corrected: BD - BT - (2 * IEB) (Box depth minus back panel thickness, minus front/back edge banding of top/bottom panel)
      plankHeight = BD - BT - (2 * IEB);


      // VB Main Holes for Top Plank (for connecting to exposed side panels)
      // Original: x: 9.5 - IT, y: 50 - IT, z: IT - 14
      // Assuming these are on the edges of the top plank, to connect downwards into side panels
      if (LE === 'Expose') {
        vbScrewHoles.push({ x: IT / 2, y: 50, z: plankThickness - 14, type: 'T_VB_LE' });
        vbScrewHoles.push({ x: IT / 2, y: plankHeight - 50, z: plankThickness - 14, type: 'T_VB_LE' });
        if (plankHeight > 450) {
          vbScrewHoles.push({ x: IT / 2, y: plankHeight / 2, z: plankThickness - 14, type: 'T_VB_LE' });
        }
      }
      if (RE === 'Expose') {
        vbScrewHoles.push({ x: plankWidth - (IT / 2), y: 50, z: plankThickness - 14, type: 'T_VB_RE' });
        vbScrewHoles.push({ x: plankWidth - (IT / 2), y: plankHeight - 50, z: plankThickness - 14, type: 'T_VB_RE' });
        if (plankHeight > 450) {
          vbScrewHoles.push({ x: plankWidth - (IT / 2), y: plankHeight / 2, z: plankThickness - 14, type: 'T_VB_RE' });
        }
      }

      return {
        plankId, name,
        width: parseFloat(plankWidth.toFixed(2)),
        height: parseFloat(plankHeight.toFixed(2)),
        thickness: plankThickness,
        materialCode, grainDirection,
        screwHoles, vbScrewHoles, backPanelGroove
      };
    }
    ```

### 4. Bottom Plank

- __Item Name:__ `Bottom Panel`
- __Item Type:__ `Plank`
- __Item Description:__ `The main bottom horizontal panel of the box.`
- __Plank Specific Details (Calculated by script):__
  - Plank ID Format: `B1P1_B`
- __Item Logic Script:__ (Identical to Top Plank script, just change `name` and `plankId`)

    ```javascript
    function calculateProperties(runtimeInputs, globalConstants) {
      const {
        boxWidth, boxDepth, leftAdjacency, rightAdjacency, skirting, // Skirting might affect VB hole Y positions if bottom panel is raised
        outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition
      } = runtimeInputs;
      const { edgeBandingInternalThickness } = globalConstants;

      const BW = boxWidth;
      const BD = boxDepth;
      const LE = leftAdjacency;
      const RE = rightAdjacency;
      const SKT = skirting || 0;

      const ET = outerMaterialDefinition.overallMaterialThickness_mm;
      const IT = innerMaterialDefinition.overallMaterialThickness_mm;
      const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ILC = innerMaterialDefinition.code;

      const IEB = edgeBandingInternalThickness;

      let plankWidth, plankHeight;
      const screwHoles = [];
      const vbScrewHoles = [];
      const backPanelGroove = null;

      const name = 'Bottom Plank'; // Changed
      const plankId = 'B1P1_B';   // Changed
      const materialCode = ILC;
      const plankThickness = IT;
      const grainDirection = innerMaterialDefinition.grainDirection;

      if (LE === 'Expose' && RE === 'Expose') {
        plankWidth = BW - (2 * ET) - (2 * IEB);
      } else if (LE === 'Expose' || RE === 'Expose') {
        plankWidth = BW - ET - IT - (2 * IEB);
      } else {
        plankWidth = BW - (2 * IT) - (2 * IEB);
      }
      plankHeight = BD - BT - (2 * IEB);

      // VB Main Holes for Bottom Plank
      // Y-coordinates might need adjustment if skirting raises the bottom panel significantly
      const yOffsetForSkirting = SKT > 0 ? SKT : 0; // Simplified, actual construction detail matters

      if (LE === 'Expose') {
        vbScrewHoles.push({ x: IT / 2, y: 50, z: plankThickness - 14, type: 'B_VB_LE' });
        vbScrewHoles.push({ x: IT / 2, y: plankHeight - 50, z: plankThickness - 14, type: 'B_VB_LE' });
        if (plankHeight > 450) {
          vbScrewHoles.push({ x: IT / 2, y: plankHeight / 2, z: plankThickness - 14, type: 'B_VB_LE' });
        }
      }
      if (RE === 'Expose') {
        vbScrewHoles.push({ x: plankWidth - (IT / 2), y: 50, z: plankThickness - 14, type: 'B_VB_RE' });
        vbScrewHoles.push({ x: plankWidth - (IT / 2), y: plankHeight - 50, z: plankThickness - 14, type: 'B_VB_RE' });
        if (plankHeight > 450) {
          vbScrewHoles.push({ x: plankWidth - (IT / 2), y: plankHeight / 2, z: plankThickness - 14, type: 'B_VB_RE' });
        }
      }
      return {
        plankId, name,
        width: parseFloat(plankWidth.toFixed(2)),
        height: parseFloat(plankHeight.toFixed(2)),
        thickness: plankThickness,
        materialCode, grainDirection,
        screwHoles, vbScrewHoles, backPanelGroove
      };
    }
    ```

### 5. Back Plank

- __Item Name:__ `Back Panel`
- __Item Type:__ `Plank`
- __Item Description:__ `The rear closing panel of the box.`
- __Plank Specific Details (Calculated by script):__
  - Plank ID Format: `B1P1_BP`
- __Item Logic Script:__

    ```javascript
    function calculateProperties(runtimeInputs, globalConstants) {
      const {
        boxWidth, boxHeight, leftAdjacency, rightAdjacency, skirting,
        outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition
      } = runtimeInputs;
      // globalConstants not heavily used here unless for specific offsets

      const BW = boxWidth;
      const BH = boxHeight;
      const LE = leftAdjacency;
      const RE = rightAdjacency;
      const SKT = skirting || 0;

      const ET = outerMaterialDefinition.overallMaterialThickness_mm;
      // IT not directly used for back panel dimensions in original logic
      const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const BLC = backMaterialDefinition.code;

      let plankWidth, plankHeight;
      const screwHoles = []; // Typically no screw holes from front/back
      const vbScrewHoles = [];
      const backPanelGroove = null; // Back panel itself doesn't have groove for another back panel

      const name = 'Back Plank';
      const plankId = 'B1P1_BP';
      const materialCode = BLC;
      const plankThickness = BT;
      const grainDirection = backMaterialDefinition.grainDirection;

      // Width of back panel, fits into grooves of side/top/bottom panels
      // Original: BW - 2 * (ET - 10) if both exposed. (ET-10) is depth of groove in side panel.
      // This assumes groove depth is related to ET. A fixed groove depth might be better.
      // Let's assume groove depth is fixed (e.g. 10mm) or half of side panel thickness.
      // For simplicity, using original logic's effective reduction.
      const grooveDepthInSidePanel = 10; // Assuming this is the intended meaning of (ET-10) related part

      if (LE === 'Expose' && RE === 'Expose') {
        plankWidth = BW - 2 * ET + 2 * grooveDepthInSidePanel; // Fits inside outer panels
      } else if (LE === 'Expose' || RE === 'Expose') { // One side ET, other IT
        plankWidth = BW - ET - innerMaterialDefinition.overallMaterialThickness_mm + 2 * grooveDepthInSidePanel;
      } else { // Both sides IT
        plankWidth = BW - 2 * innerMaterialDefinition.overallMaterialThickness_mm + 2 * grooveDepthInSidePanel;
      }
      
      // Height of back panel
      // Fits between top/bottom panels, potentially above skirting
      plankHeight = BH - SKT - (2 * innerMaterialDefinition.overallMaterialThickness_mm) + (2 * grooveDepthInSidePanel);


      return {
        plankId, name,
        width: parseFloat(plankWidth.toFixed(2)),
        height: parseFloat(plankHeight.toFixed(2)),
        thickness: plankThickness,
        materialCode, grainDirection,
        screwHoles, vbScrewHoles, backPanelGroove
      };
    }
    ```

### 6. Door Plank

- __Item Name:__ `Door Panel`
- __Item Type:__ `Plank`
- __Item Description:__ `The front door panel.`
- __Plank Specific Details (Calculated by script):__
  - Plank ID Format: `B1P1_D` (or `_D1`, `_D2` if double door)
- __Item Logic Script:__

    ```javascript
    function calculateProperties(runtimeInputs, globalConstants) {
      const { door, boxWidth, boxHeight, skirting, doorMaterialDefinition } = runtimeInputs;
      const { edgeBandingExposedThickness, doorClearance } = globalConstants;

      if (!door || !door.hasDoor || !doorMaterialDefinition) {
        return null; // No door plank if not specified or no material
      }

      const BW = boxWidth;
      const BH = boxHeight;
      const SKT = skirting || 0;
      const DMT = doorMaterialDefinition.overallMaterialThickness_mm; // Door Material Thickness
      const DMC = doorMaterialDefinition.code;
      const DMGrain = doorMaterialDefinition.grainDirection;

      const CEB = edgeBandingExposedThickness;
      const CLR = doorClearance; // e.g., 2mm

      let plankWidth, plankHeight;
      const screwHoles = []; // Hinge holes would be here
      const vbScrewHoles = [];
      const backPanelGroove = null;

      const name = 'Door Plank';
      const plankId = 'B1P1_D'; // For a single door or first leaf
      const materialCode = DMC;
      const plankThickness = DMT;
      const grainDirection = DMGrain;

      // Assuming single door for now. Double door logic would split BW.
      // Width: Box width minus clearances on both sides, minus edge banding
      plankWidth = BW - (2 * CLR) - (2 * CEB);
      // Height: Box height minus skirting, minus top/bottom clearances, minus edge banding
      plankHeight = BH - SKT - (2 * CLR) - (2 * CEB);
      
      // TODO: Add hinge hole calculations based on door.exposedSide and hinge type/rules

      // If BW > 600, original generator implies double doors, but generates one plank.
      // For this script to return two planks, it would need to return an array.
      // For now, this script generates one door plank.
      // If double doors are needed, you might have two BoM items "Left Door", "Right Door"
      // or this script could return an array: [doorLeaf1, doorLeaf2]

      return {
        plankId, name,
        width: parseFloat(plankWidth.toFixed(2)),
        height: parseFloat(plankHeight.toFixed(2)),
        thickness: plankThickness,
        materialCode, grainDirection,
        screwHoles, vbScrewHoles, backPanelGroove
      };
    }
    ```

### 7. Shelf Plank

- __Item Name:__ `Internal Shelf`
- __Item Type:__ `Plank`
- __Item Description:__ `An internal shelf.`
- __Plank Specific Details (Calculated by script):__
  - Plank ID Format: `B1P1_S[n]`
- __Item Logic Script:__

    ```javascript
    function calculateProperties(runtimeInputs, globalConstants) {
      const {
        numberOfShelves, boxWidth, boxDepth, leftAdjacency, rightAdjacency,
        outerMaterialDefinition, innerMaterialDefinition, backMaterialDefinition
      } = runtimeInputs;
      const { edgeBandingInternalThickness } = globalConstants;

      if (!numberOfShelves || numberOfShelves <= 0) {
        return null;
      }

      const S = numberOfShelves;
      const BW = boxWidth;
      const BD = boxDepth;
      const LE = leftAdjacency;
      const RE = rightAdjacency;

      const ET = outerMaterialDefinition.overallMaterialThickness_mm;
      const IT = innerMaterialDefinition.overallMaterialThickness_mm;
      const BT = backMaterialDefinition.overallMaterialThickness_mm;
      const ILC = innerMaterialDefinition.code;
      const IEB = edgeBandingInternalThickness;

      const shelfPlanks = [];
      const materialCode = ILC;
      const plankThickness = IT;
      const grainDirection = innerMaterialDefinition.grainDirection; // Typically horizontal for shelves

      let shelfWidthCalulated;
      // Shelf width calculation similar to Top/Bottom planks
      if (LE === 'Expose' && RE === 'Expose') {
        shelfWidthCalulated = BW - (2 * ET) - (2 * IEB);
      } else if (LE === 'Expose' || RE === 'Expose') {
        shelfWidthCalulated = BW - ET - IT - (2 * IEB);
      } else {
        shelfWidthCalulated = BW - (2 * IT) - (2 * IEB);
      }

      // Shelf depth (height of plank)
      const shelfDepthCalculated = BD - BT - (2 * IEB); // Fits in front of back panel, front edge banded

      for (let i = 0; i < S; i++) {
        shelfPlanks.push({
          plankId: `B1P1_S${i + 1}`,
          name: `Shelf ${i + 1}`,
          width: parseFloat(shelfWidthCalulated.toFixed(2)),
          height: parseFloat(shelfDepthCalculated.toFixed(2)), // This is the depth of the shelf
          thickness: plankThickness,
          materialCode,
          grainDirection,
          screwHoles: [], // Shelf pin holes would be on side panels, not shelf itself usually
          vbScrewHoles: [],
          backPanelGroove: null
          // Edge banding can be added here if needed, e.g., front edge
        });
      }
      return shelfPlanks.length > 0 ? shelfPlanks : null; // Return array of shelves
    }
    ```

This provides a comprehensive starting point for your "Simple Box" model definition in the UI, including the logic scripts. Remember that these scripts are based on the provided `simpleBoxGenerator.ts` and may need further refinement and testing within your actual UI environment and against more detailed construction rules. The hole coordinate calculations, in particular, can be complex and highly dependent on specific hardware and assembly methods.

### Important Considerations for Item Logic Scripts

1. __Return Value:__ The `calculateProperties(runtimeInputs, globalConstants)` function for each BoM item should return a plank object matching the "Expected Output Format" you provided. For items that might generate multiple instances (like shelves), the script could return an array of plank objects (`Plank[]`). If a plank is conditional and not generated, it can return `null`.
2. __Material Definitions:__ The scripts will rely on `runtimeInputs` containing full material definitions (e.g., `runtimeInputs.outerMaterialDefinition`).
3. __Global Constants:__ Scripts will use `globalConstants` for values like edge banding thickness.
4. __Plank IDs & Names:__ These will be fixed within each specific plank's script. I'll use `B1P1_` as a prefix, assuming Box 1, Packet 1.
5. __Hole Types:__ I'll categorize holes based on their type prefixes in the generator (`T3` for `screwHoles`, `T6` and `T_VB_...` for `vbScrewHoles`).
6. __Grain Direction:__ This will be sourced from the material definition in `runtimeInputs`.
7. __Dummy Panels:__ The provided `simpleBoxGenerator.ts` includes logic for dummy panels using `createDummyPanel`. Since the full source of `createDummyPanel` isn't available and they are conditional, I will focus on the main structural planks (Left, Right, Top, Bottom, Back, Door, Shelves). Dummy panels could be added as separate BoM items if their logic is defined.

First, let's define the __Sample Runtime Inputs__ and __Global Constants__ that these scripts will use for testing and execution.

### A. Sample Runtime Inputs (for testing scripts)

```json
{
  "boxHeight": 700,
  "boxWidth": 600,
  "boxDepth": 550,
  "leftAdjacency": "Expose",
  "rightAdjacency": "Wall",
  "outerMaterialCode": "OUTER_MAT_01",
  "innerMaterialCode": "INNER_MAT_01",
  "backMaterialCode": "BACK_MAT_01",
  "door": {
    "hasDoor": true,
    "exposedSide": "Front"
  },
  "numberOfShelves": 2,
  "skirting": 0,

  "outerMaterialDefinition": {
    "code": "OUTER_MAT_01",
    "name": "Exposed Laminate Oak",
    "description": "Oak laminate for external surfaces",
    "plyThickness_mm": 18,
    "overallMaterialThickness_mm": 20,
    "plyType": "Blockboard",
    "grainDirection": "Vertical"
  },
  "innerMaterialDefinition": {
    "code": "INNER_MAT_01",
    "name": "Internal Laminate White",
    "description": "White laminate for internal surfaces",
    "plyThickness_mm": 16,
    "overallMaterialThickness_mm": 18,
    "plyType": "HDHMR",
    "grainDirection": "Horizontal"
  },
  "backMaterialDefinition": {
    "code": "BACK_MAT_01",
    "name": "Back Panel MDF",
    "description": "Thin MDF for back panel",
    "plyThickness_mm": 8,
    "overallMaterialThickness_mm": 8,
    "plyType": "MDF",
    "grainDirection": "N/A"
  },
  "doorMaterialDefinition": {
    "code": "DOOR_MAT_01",
    "name": "Door Panel Oak",
    "description": "Oak laminate for door",
    "plyThickness_mm": 18,
    "overallMaterialThickness_mm": 20,
    "plyType": "Blockboard",
    "grainDirection": "Vertical"
  }
}
```

### B. Sample Global Constants (for testing scripts)

```json
{
  "edgeBandingExposedThickness": 1.0,
  "edgeBandingInternalThickness": 0.5,
  "backPanelGrooveDepth": 10,
  "defaultSkirtingHeight": 70, // Example if needed
  "doorClearance": 2 // Clearance around door
}
```

---
