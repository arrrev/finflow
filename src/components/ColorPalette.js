"use client";
import React from 'react';

const COLORS = [
    // Row 1: Grayscale
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    // Row 2: Basic Colors
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    // Row 3: Light
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
import { useState } from 'react';

export default function ColorPalette({ selectedColor = '#fbbf24', onSelect }) {
    const [customColor, setCustomColor] = useState(selectedColor);
    const [isExpanded, setIsExpanded] = useState(false);

    const colors = [
        '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
        '#84cc16', '#06b6d4', '#6366f1', '#a855f7',
        '#f43f5e', '#eab308', '#22c55e', '#0ea5e9'
    ];

    const handleColorSelect = (color) => {
        onSelect(color);
        setCustomColor(color);
        setIsExpanded(false);
    };

    return (
        className = "w-6 h-6 p-0 border-0 rounded overflow-hidden"
        />
            </div >
        </div >
    );
}
