"use client";
import React from 'react';

const COLORS = [
    // Row 1: Grayscale
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    // Row 2: Basic Colors
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    // Row 3: Light
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    // Row 4: Medium
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    // Row 5: Dark
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    // Row 6: Darker
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    // Row 7: Darkest
    '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
    // Row 8: Extras
    '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'
];

export default function ColorPalette({ selectedColor, onSelect }) {
    return (
        <div className="p-2 bg-white rounded-lg border border-base-300 shadow-sm w-[280px]">
            <div className="grid grid-cols-10 gap-1">
                {COLORS.map((color, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onSelect(color)}
                        className={`w-5 h-5 rounded-full hover:scale-125 transition-transform border border-gray-200 relative ${selectedColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                        style={{ backgroundColor: color }}
                        title={color}
                    >
                        {selectedColor === color && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white drop-shadow-md">
                                ✓
                            </span>
                        )}
                    </button>
                ))}
            </div>
            {/* Custom Color (Native Picker) fallback */}
            <div className="pt-2 mt-2 border-t border-gray-100 flex justify-end">
                <label className="text-xs text-gray-400 mr-2 flex items-center">Custom</label>
                <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => onSelect(e.target.value)}
                    className="w-6 h-6 p-0 border-0 rounded overflow-hidden"
                />
            </div>
        </div>
    );
}
