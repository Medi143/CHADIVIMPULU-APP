import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface BrandNameProps {
  fontSize?: number;
  color?: string;
  style?: TextStyle;
}

/**
 * Reusable Chadivimpulu™ brand component.
 * TM is rendered as superscript at ~40% of main font size,
 * matching the official logo branding.
 */
export default function BrandName({ fontSize = 24, color = '#FFD700', style }: BrandNameProps) {
  const tmSize = Math.max(Math.round(fontSize * 0.4), 8);

  return (
    <Text style={[{ fontSize, color, fontWeight: 'bold' }, style]}>
      Chadivimpulu
      <Text style={{ fontSize: tmSize, lineHeight: fontSize, color }}>TM</Text>
    </Text>
  );
}
