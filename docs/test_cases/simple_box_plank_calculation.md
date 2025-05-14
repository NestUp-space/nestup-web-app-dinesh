# Test Case: Simple Box Plank Calculation

This document outlines a test case for verifying the plank list generation for a "Simple Box Model". It includes the model definition, sample runtime inputs, and the expected plank list output based on the defined logic and constants.

## 1. Model Definition: Simple Box Model

This refers to a model similar to `SIMPLE_MODEL` in `frontend/src/components/dashboard/model-management/templates/testModels.ts`.

**Input Parameters (`runtimeInputs`):**

* `boxDepth`: Number (e.g., 560) - Overall depth of the box in mm.
* `boxHeight`: Number (e.g., 720) - Overall height of the box in mm.
* `leftAdjacency`: String, Select Options: "Expose", "Wall", "Box" (e.g., "Expose") - Adjacency of the left side.
* `rightAdjacency`: String, Select Options: "Expose", "Wall", "Box" (e.g., "Wall") - Adjacency of the right side.
* `skirting`: Number (e.g., 100) - Height of the skirting in mm. (Note: This test case assumes `skirting` is treated as a number in calculations).
* `outerMaterialCode`: String (e.g., "OUT001") - Material code for external surfaces.
* `innerMaterialCode`: String (e.g., "IN001") - Material code for internal surfaces.
    *Note: `boxWidth` is not used by the `SIMPLE_MODEL`'s default plank logic but might be present as a general input.*

**Plank Bill of Materials (`bomItems` of type `PLANK`):**

The `SIMPLE_MODEL` typically includes two main planks: Left Side and Right Side.

**a. Left Side Panel (`plankIdentifier: "LT"`, `packetNumber: "P1"`)**

* **`widthLogic` (Core logic assigned to `Width`):**

    ```javascript
    if (leftAdjacency === 'Expose') {
      Width = boxDepth - MATERIAL_THICKNESS.expose - 
             (2 * EDGE_BANDING.COLOR_EDGEBANDING);
    } else { // Assumes 'Wall' or 'Box' might use inner material/banding
      Width = boxDepth - MATERIAL_THICKNESS.inner - 
             (2 * EDGE_BANDING.INNER_EDGEBANDING);
    }
    ```

* **`lengthLogic` (Core logic assigned to `Height`):**

    ```javascript
    if (leftAdjacency === 'Expose') {
      Height = boxHeight - (2 * EDGE_BANDING.COLOR_EDGEBANDING); // No skirting reduction if exposed directly
    } else {
      Height = boxHeight - skirting - 
             (2 * EDGE_BANDING.INNER_EDGEBANDING);
    }
    ```

* **`materialCodeLogic` (Core logic assigned to `Material`):**

    ```javascript
    if (leftAdjacency === 'Expose') {
      Material = outerMaterialCode;
    } else {
      Material = innerMaterialCode;
    }
    ```

**b. Right Side Panel (`plankIdentifier: "RT"`, `packetNumber: "P1"`)**

* **`widthLogic` (Core logic assigned to `Width`):**

    ```javascript
    if (rightAdjacency === 'Expose') {
      Width = boxDepth - MATERIAL_THICKNESS.expose - 
             (2 * EDGE_BANDING.COLOR_EDGEBANDING);
    } else {
      Width = boxDepth - MATERIAL_THICKNESS.inner - 
             (2 * EDGE_BANDING.INNER_EDGEBANDING);
    }
    ```

* **`lengthLogic` (Core logic assigned to `Height`):**

    ```javascript
    if (rightAdjacency === 'Expose') {
      Height = boxHeight - (2 * EDGE_BANDING.COLOR_EDGEBANDING);
    } else {
      Height = boxHeight - skirting - 
             (2 * EDGE_BANDING.INNER_EDGEBANDING);
    }
    ```

* **`materialCodeLogic` (Core logic assigned to `Material`):**

    ```javascript
    if (rightAdjacency === 'Expose') {
      Material = outerMaterialCode;
    } else {
      Material = innerMaterialCode;
    }
    ```

## 2. Global Constants Used in Logic

* `MATERIAL_THICKNESS`:
  * `expose`: 18 (mm)
  * `inner`: 18 (mm)
  * `back`: 6 (mm)
* `EDGE_BANDING`:
  * `INNER_EDGEBANDING`: 1 (mm)
  * `COLOR_EDGEBANDING`: 2 (mm)

## 3. Sample Runtime Input Values

* `boxNumber` (for Plank ID construction): `"01"`
* `runtimeInputs`:
  * `boxDepth`: 560
  * `boxHeight`: 720
  * `leftAdjacency`: `"Expose"`
  * `rightAdjacency`: `"Wall"`
  * `skirting`: 100 (numeric value)
  * `outerMaterialCode`: `"OUT001"`
  * `innerMaterialCode`: `"IN001"`

## 4. Expected Plank List Output

Based on the logic, constants, and sample inputs above:

**a. Plank 1: Left Side Panel (LT)**

* `plankIdPart` from script: `"P1-LT"`
* Final `plankId`: `"01P1-LT"`
* `leftAdjacency` is "Expose".
* **Width Calculation:**
  * `Width = boxDepth - MATERIAL_THICKNESS.expose - (2 * EDGE_BANDING.COLOR_EDGEBANDING)`
  * `Width = 560 - 18 - (2 * 2)`
  * `Width = 560 - 18 - 4`
  * `Width = 538`
* **Length (Height) Calculation:**
  * `Height = boxHeight - (2 * EDGE_BANDING.COLOR_EDGEBANDING)`
  * `Height = 720 - (2 * 2)`
  * `Height = 720 - 4`
  * `Height = 716`
* **Material Code Calculation:**
  * `Material = outerMaterialCode`
  * `Material = "OUT001"`
* **Expected PlankDetails Object:**

    ```json
    {
      "plankId": "01P1-LT",
      "width": 538,
      "length": 716,
      "materialCode": "OUT001",
      "holes": [],
      "grooves": []
    }
    ```

**b. Plank 2: Right Side Panel (RT)**

* `plankIdPart` from script: `"P1-RT"`
* Final `plankId`: `"01P1-RT"`
* `rightAdjacency` is "Wall".
* **Width Calculation:**
  * `Width = boxDepth - MATERIAL_THICKNESS.inner - (2 * EDGE_BANDING.INNER_EDGEBANDING)`
  * `Width = 560 - 18 - (2 * 1)`
  * `Width = 560 - 18 - 2`
  * `Width = 540`
* **Length (Height) Calculation:**
  * `Height = boxHeight - skirting - (2 * EDGE_BANDING.INNER_EDGEBANDING)`
  * `Height = 720 - 100 - (2 * 1)`
  * `Height = 720 - 100 - 2`
  * `Height = 618`
* **Material Code Calculation:**
  * `Material = innerMaterialCode`
  * `Material = "IN001"`
* **Expected PlankDetails Object:**

    ```json
    {
      "plankId": "01P1-RT",
      "width": 540,
      "length": 618,
      "materialCode": "IN001",
      "holes": [],
      "grooves": []
    }
    ```

**Summary of Expected Plank List (JSON Array):**

```json
[
  {
    "plankId": "01P1-LT",
    "width": 538,
    "length": 716,
    "materialCode": "OUT001",
    "holes": [],
    "grooves": []
  },
  {
    "plankId": "01P1-RT",
    "width": 540,
    "length": 618,
    "materialCode": "IN001",
    "holes": [],
    "grooves": []
  }
]
```

This document can be used to verify the correctness of the plank generation logic after the `skirting` input type change and to ensure the system handles calculations as expected.
