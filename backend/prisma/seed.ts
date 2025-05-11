import { PrismaClient, BomItemType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Seed User Roles and Permissions (example, adapt if already exists or handled elsewhere)
  // This is often a prerequisite for other data that might reference users/roles.
  // For simplicity, I'm assuming roles like 'BIM_ENGINEER' might be relevant for who defines models.
  // If your role seeding is separate, this part can be omitted or adapted.
  let bimEngineerRole = await prisma.userRole.findFirst({ where: { role: 'BIM_ENGINEER' } });
  if (!bimEngineerRole) {
    bimEngineerRole = await prisma.userRole.create({
      data: {
        role: 'BIM_ENGINEER',
        roleType: 'INTERNAL',
      },
    });
  }

  // --- Seed "Simple Box" ModelDefinition ---
  const simpleBoxModelName = 'Simple Box';
  await prisma.modelDefinition.upsert({
    where: { name: simpleBoxModelName },
    update: {}, // No updates if it exists, just ensure it's there
    create: {
      name: simpleBoxModelName,
      description: 'A basic rectangular box with configurable dimensions, materials, and adjacencies. Used for cabinets, storage units etc. Planks include Top, Bottom, Left, Right, Back. Optional Door and Shelves.',
      imageUrl: '/img/models/simple-box.png', // From simpleBox.json
      inputParameters: {
        create: [
          // Based on simpleBox.json runtimeInputs and PROJECT_CONTEXT_AND_ROADMAP.md Section 6.II.D
          { inputName: 'boxHeight', displayLabel: 'Box Height', inputType: 'NUMBER', unit: 'mm', defaultValue: '700', description: 'Overall height of the box (Min: 250mm, Max: 2400mm)' },
          { inputName: 'boxWidth', displayLabel: 'Box Width', inputType: 'NUMBER', unit: 'mm', defaultValue: '600', description: 'Overall width of the box (Min: 250mm, Max: 2400mm)' },
          { inputName: 'boxDepth', displayLabel: 'Box Depth', inputType: 'NUMBER', unit: 'mm', defaultValue: '550', description: 'Overall depth of the box (Min: 250mm, Max: 750mm)' },
          { inputName: 'leftAdjacency', displayLabel: 'Left Adjacency', inputType: 'SELECT', options: ['Expose', 'Wall', 'Box'], defaultValue: 'Expose', description: 'What is to the left of this box?' },
          { inputName: 'rightAdjacency', displayLabel: 'Right Adjacency', inputType: 'SELECT', options: ['Expose', 'Wall', 'Box'], defaultValue: 'Expose', description: 'What is to the right of this box?' },
          { inputName: 'outerMaterialCode', displayLabel: 'Outer Material Code', inputType: 'TEXT', description: 'Material code for exposed surfaces.' }, // Or SELECT if from Material Repo
          { inputName: 'innerMaterialCode', displayLabel: 'Inner Material Code', inputType: 'TEXT', description: 'Material code for internal surfaces.' }, // Or SELECT
          { inputName: 'backMaterialCode', displayLabel: 'Back Panel Material Code', inputType: 'TEXT', description: 'Material code for the back panel.' }, // Or SELECT
          { inputName: 'hasDoor', displayLabel: 'Has Door?', inputType: 'BOOLEAN', defaultValue: 'false', description: 'Does the box have a door?' },
          { inputName: 'numberOfShelves', displayLabel: 'Number of Shelves', inputType: 'NUMBER', defaultValue: '0', description: 'How many internal shelves?' },
          { inputName: 'skirtingHeight', displayLabel: 'Skirting Height', inputType: 'NUMBER', unit: 'mm', defaultValue: '0', description: 'Height of skirting, if any, below the box.' },
        ],
      },
      bomItems: {
        create: [
          // --- Planks ---
          {
            itemName: 'Left Plank',
            itemType: BomItemType.PLANK,
            itemDescription: 'The left vertical side panel of the box.',
            itemLogicScript: `
              (inputs, rules) => {
                const { boxHeight, boxDepth, leftAdjacency, outerMaterialCode, innerMaterialCode, skirtingHeight } = inputs;
                const { getMaterialThickness, edgeBanding } = rules;

                const ET = getMaterialThickness(outerMaterialCode); // Exposed material thickness
                const IT = getMaterialThickness(innerMaterialCode); // Inner material thickness
                // Back panel thickness (BT) and its effect on depth is handled by other planks or overall depth calculations.
                // For this plank, we primarily care about its own material and edge banding.

                const CEB = edgeBanding.exposed.thickness_mm; // Exposed edge banding
                const IEB = edgeBanding.internal.thickness_mm; // Internal edge banding

                let plankWidth, plankHeight, materialCode, plankThickness;
                let holes = [];
                let grooves = [];

                if (leftAdjacency === 'Expose') {
                  plankHeight = boxHeight - (2 * CEB); // Height adjusted for top/bottom edge banding
                  plankWidth = boxDepth - CEB; // Depth adjusted for front edge banding (back edge might be raw or grooved)
                  materialCode = outerMaterialCode;
                  plankThickness = ET;
                  // VB Screw Holes for Exposed Left Plank (example)
                  // holes.push({ type: 'VB_SCREW', x: 50 - CEB, y: plankHeight - IT + 9 + CEB, z: ET - 11, tool: 'T6' });
                } else { // 'Wall' or 'Box'
                  plankHeight = boxHeight - skirtingHeight - (2 * IEB); // Adjusted for skirting and internal edge banding
                  plankWidth = boxDepth - IEB; // Adjusted for front internal edge banding
                  materialCode = innerMaterialCode;
                  plankThickness = IT;
                  // Screw holes for internal Left Plank (example)
                  // holes.push({ type: 'SCREW', x: plankWidth / 4, y: skirtingHeight + IT / 2 - ET, z: -0.01, tool: 'T3' });
                }
                
                // Simplified example: Actual hole/groove logic from simpleBoxGenerator.ts would be more complex
                // and needs careful adaptation. For example, back panel groove:
                // const BT_val = getMaterialThickness(inputs.backMaterialCode);
                // if (BT_val === 8) grooves.push({ type: 'BACK_GROOVE', depth: 10, tool: 'T7', position: 'REAR_EDGE_CENTERED' });


                return { name: 'Left Plank', width: plankWidth, height: plankHeight, thickness: plankThickness, materialCode, grainDirection: 'vertical', holes, grooves };
              }
            `,
          },
          {
            itemName: 'Right Plank',
            itemType: BomItemType.PLANK,
            itemDescription: 'The right vertical side panel of the box.',
            itemLogicScript: `
              (inputs, rules) => {
                const { boxHeight, boxDepth, rightAdjacency, outerMaterialCode, innerMaterialCode, skirtingHeight } = inputs;
                const { getMaterialThickness, edgeBanding } = rules;
                const ET = getMaterialThickness(outerMaterialCode);
                const IT = getMaterialThickness(innerMaterialCode);
                const CEB = edgeBanding.exposed.thickness_mm;
                const IEB = edgeBanding.internal.thickness_mm;

                let plankWidth, plankHeight, materialCode, plankThickness;
                if (rightAdjacency === 'Expose') {
                  plankHeight = boxHeight - (2 * CEB);
                  plankWidth = boxDepth - CEB;
                  materialCode = outerMaterialCode;
                  plankThickness = ET;
                } else {
                  plankHeight = boxHeight - skirtingHeight - (2 * IEB);
                  plankWidth = boxDepth - IEB;
                  materialCode = innerMaterialCode;
                  plankThickness = IT;
                }
                return { name: 'Right Plank', width: plankWidth, height: plankHeight, thickness: plankThickness, materialCode, grainDirection: 'vertical', holes: [], grooves: [] };
              }
            `,
          },
          {
            itemName: 'Top Plank',
            itemType: BomItemType.PLANK,
            itemDescription: 'The top horizontal panel of the box.',
            itemLogicScript: `
              (inputs, rules) => {
                const { boxWidth, boxDepth, leftAdjacency, rightAdjacency, outerMaterialCode, innerMaterialCode, backMaterialCode } = inputs;
                const { getMaterialThickness, edgeBanding } = rules;
                const ET = getMaterialThickness(outerMaterialCode);
                const IT = getMaterialThickness(innerMaterialCode);
                const BT = getMaterialThickness(backMaterialCode);
                const IEB = edgeBanding.internal.thickness_mm;
                
                let plankWidth;
                // Simplified width calculation - actual depends on construction (overlay, inset)
                if (leftAdjacency === 'Expose' && rightAdjacency === 'Expose') {
                  plankWidth = boxWidth - (2 * ET) - (2 * IEB); // If sides are exposed, top sits between them
                } else if (leftAdjacency === 'Expose' || rightAdjacency === 'Expose') {
                  plankWidth = boxWidth - ET - IT - (2 * IEB); // One side exposed, one internal
                } else {
                  plankWidth = boxWidth - (2 * IT) - (2 * IEB); // Both sides internal
                }
                const plankDepth = boxDepth - BT - IEB; // Depth adjusted for back panel and front edge banding

                return { name: 'Top Plank', width: plankWidth, height: plankDepth, thickness: IT, materialCode: innerMaterialCode, grainDirection: 'horizontal', holes: [], grooves: [] };
              }
            `,
          },
          {
            itemName: 'Bottom Plank',
            itemType: BomItemType.PLANK,
            itemDescription: 'The bottom horizontal panel of the box.',
            itemLogicScript: `
              (inputs, rules) => {
                // Similar logic to Top Plank, but might be affected by skirtingHeight if it sits on top
                const { boxWidth, boxDepth, leftAdjacency, rightAdjacency, outerMaterialCode, innerMaterialCode, backMaterialCode, skirtingHeight } = inputs;
                const { getMaterialThickness, edgeBanding } = rules;
                const ET = getMaterialThickness(outerMaterialCode);
                const IT = getMaterialThickness(innerMaterialCode);
                const BT = getMaterialThickness(backMaterialCode);
                const IEB = edgeBanding.internal.thickness_mm;

                let plankWidth;
                 if (leftAdjacency === 'Expose' && rightAdjacency === 'Expose') {
                  plankWidth = boxWidth - (2 * ET) - (2 * IEB);
                } else if (leftAdjacency === 'Expose' || rightAdjacency === 'Expose') {
                  plankWidth = boxWidth - ET - IT - (2 * IEB);
                } else {
                  plankWidth = boxWidth - (2 * IT) - (2 * IEB);
                }
                const plankDepth = boxDepth - BT - IEB;
                // If bottom plank sits on skirting, its effective position might change, or skirting is separate.
                // For simplicity, assuming similar to top plank here.
                return { name: 'Bottom Plank', width: plankWidth, height: plankDepth, thickness: IT, materialCode: innerMaterialCode, grainDirection: 'horizontal', holes: [], grooves: [] };
              }
            `,
          },
          {
            itemName: 'Back Plank',
            itemType: BomItemType.PLANK,
            itemDescription: 'The back panel of the box.',
            itemLogicScript: `
              (inputs, rules) => {
                const { boxHeight, boxWidth, leftAdjacency, rightAdjacency, outerMaterialCode, innerMaterialCode, backMaterialCode, skirtingHeight } = inputs;
                const { getMaterialThickness } = rules;
                const ET = getMaterialThickness(outerMaterialCode); // Thickness of side panels if exposed
                const IT = getMaterialThickness(innerMaterialCode); // Thickness of side panels if internal
                const BT = getMaterialThickness(backMaterialCode);

                let plankWidth = boxWidth;
                // Adjust width if back panel fits inside a groove in side panels
                // This depends on construction method, e.g., if side panels have 10mm groove depth for back panel
                const grooveDepth = 10; // Assuming a 10mm groove
                if (leftAdjacency === 'Expose') plankWidth -= (ET - grooveDepth); else plankWidth -= (IT - grooveDepth);
                if (rightAdjacency === 'Expose') plankWidth -= (ET - grooveDepth); else plankWidth -= (IT - grooveDepth);
                
                const plankHeight = boxHeight - skirtingHeight; // Adjusted for skirting
                // If top/bottom also have grooves for back panel:
                // plankHeight -= (2 * (IT - grooveDepth)); // Assuming top/bottom are internal material

                return { name: 'Back Plank', width: plankWidth, height: plankHeight, thickness: BT, materialCode: backMaterialCode, grainDirection: 'vertical', holes: [], grooves: [] };
              }
            `,
          },
          {
            itemName: 'Door Plank',
            itemType: BomItemType.PLANK,
            itemDescription: 'Optional door panel.',
            itemLogicScript: `
              (inputs, rules) => {
                if (!inputs.hasDoor) return null; // No door if hasDoor is false

                const { boxHeight, boxWidth, outerMaterialCode, skirtingHeight } = inputs;
                const { getMaterialThickness, edgeBanding } = rules;
                const ET = getMaterialThickness(outerMaterialCode); // Door usually uses outer material
                const CEB = edgeBanding.exposed.thickness_mm;
                const clearance = 2; // Standard door clearance

                // Simplified: assumes single door. Double door logic would split width.
                const plankWidth = boxWidth - (2 * clearance) - (2 * CEB);
                const plankHeight = boxHeight - skirtingHeight - (2 * clearance) - (2 * CEB);
                
                return { name: 'Door Plank', width: plankWidth, height: plankHeight, thickness: ET, materialCode: outerMaterialCode, grainDirection: 'vertical', holes: [], grooves: [] };
              }
            `,
          },
          // --- Hardware (Example) ---
          {
            itemName: 'Hinges',
            itemType: BomItemType.HARDWARE,
            itemDescription: 'Standard cabinet hinges for the door.',
            itemLogicScript: `
              (inputs, rules) => {
                if (!inputs.hasDoor) return null;
                // Simple rule: 2 hinges for doors up to 900mm, 3 above, etc.
                const hinges = inputs.boxHeight <= 900 ? 2 : (inputs.boxHeight <= 1500 ? 3 : 4);
                return { name: 'Hinges', type: 'EURO_CONCEALED', quantity: hinges, unit: 'pieces' };
              }
            `,
          },
          // Add more BOM items for shelves, screws, etc.
          // Shelf logic would be conditional on inputs.numberOfShelves > 0
          // and calculate dimensions similar to Top/Bottom planks.
        ],
      },
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
