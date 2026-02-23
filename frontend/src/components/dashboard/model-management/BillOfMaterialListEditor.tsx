"use client";

import React, { useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form'; // Removed Controller, Input, Label, Select as they are in BomItem
import { PlusCircle } from 'lucide-react'; // Removed Trash2 as it's in BomItem
// import PlankLogicEditor from './PlankLogicEditor'; // PlankLogicEditor is used by BomItem
import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils'; // cn might not be needed here anymore
import { BomItemType } from './modelSchemas'; // Import from modelSchemas.ts
import BomItem from './BomItem'; // Import the new BomItem component

type PlankPosition = 'left' | 'right' | 'top' | 'bottom' | 'back' | 'door';

interface DefaultPlank {
  itemName: string;
  itemType: BomItemType;
  itemDescription: string;
  plankPosition: PlankPosition;
  defaultDetails: {
    packetNumber: number;
    plankLocationIdentifier: string;
    edgeBandingType: 'CEB' | 'IEB';
  };
}

const DEFAULT_PLANKS: DefaultPlank[] = [
  {
    itemName: 'Left Plank',
    itemType: BomItemType.PLANK,
    itemDescription: 'Left side plank of the box',
    plankPosition: 'left',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'LT',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Right Plank',
    itemType: BomItemType.PLANK,
    itemDescription: 'Right side plank of the box',
    plankPosition: 'right',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'RT',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Top Plank',
    itemType: BomItemType.PLANK,
    itemDescription: 'Top plank of the box',
    plankPosition: 'top',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'TP',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Bottom Plank',
    itemType: BomItemType.PLANK,
    itemDescription: 'Bottom plank of the box',
    plankPosition: 'bottom',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'BP',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Back Panel',
    itemType: BomItemType.PLANK,
    itemDescription: 'Back panel of the box',
    plankPosition: 'back',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'BK',
      edgeBandingType: 'IEB'
    }
  },
  {
    itemName: 'Door Panel',
    itemType: BomItemType.PLANK,
    itemDescription: 'Door panel (if required)',
    plankPosition: 'door',
    defaultDetails: {
      packetNumber: 1,
      plankLocationIdentifier: 'DR',
      edgeBandingType: 'IEB'
    }
  }
];

export default function BillOfMaterialListEditor() {
  const { control, watch /*, register, setValue */ } = useFormContext(); // register and setValue might not be needed directly here
  const { fields, append, remove } = useFieldArray({
    control,
    name: "bomItems",
  });

  // Add default planks if none exist
  useEffect(() => {
    if (fields.length === 0) {
      DEFAULT_PLANKS.forEach(plank => {
        append({
          itemName: plank.itemName,
          itemType: plank.itemType,
          itemDescription: plank.itemDescription,
          details: { // Ensure details are initialized for default planks
            name: plank.itemName,
            widthLogic: '',
            lengthLogic: '',
            materialCode: '',
            grainDirection: 'vertical',
            packetNumber: plank.defaultDetails.packetNumber,
            plankLocationIdentifier: plank.defaultDetails.plankLocationIdentifier,
            edgeBandingType: plank.defaultDetails.edgeBandingType,
            edgeBanding: {}, // Initialize edgeBanding for PLANK
          }
        });
      });
    }
  }, [append, fields.length]);

  // The complex useEffect for managing 'details' based on 'itemType'
  // has been moved into the BomItem component itself.

  return (
    <div className="space-y-6">
      {fields.map((field, index) => (
        <BomItem key={field.id} index={index} remove={remove} />
      ))}
       <Button
        type="button"
        variant="outline"
        onClick={() => append({ 
          itemName: '', 
          itemType: BomItemType.PLANK, // Default to PLANK or make it selectable
          itemDescription: '',
          itemLogicScript: '',
          addonModelId: null,
          // Default details based on the default itemType (PLANK)
          details: { 
            edgeBanding: {},
            name: 'New Plank Item', // Provide a default name or leave empty
            widthLogic: '',
            lengthLogic: '',
            materialCode: '',
            grainDirection: 'vertical',
          },
        })}
        className="mt-4"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add BOM Item
      </Button>
    </div>
  );
}
