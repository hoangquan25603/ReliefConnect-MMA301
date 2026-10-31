import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { generateQrMatrix } from "../lib/qr";
import { palette } from "./ui";

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  title?: string;
  subtitle?: string;
}

export function QRCodeView({
  value,
  size = 180,
  color = palette.navy,
  backgroundColor = "#ffffff",
  title,
  subtitle,
}: QRCodeViewProps) {
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(value || "RELIEF");
    } catch {
      return [];
    }
  }, [value]);

  const count = matrix.length || 21;
  const cellSize = Math.floor(size / count);
  const actualSize = cellSize * count;

  // Group adjacent identical cells in each row for high rendering performance
  const optimizedRows = useMemo(() => {
    return matrix.map((row) => {
      const spans: { isDark: boolean; length: number }[] = [];
      let currentDark = row[0];
      let currentLen = 1;
      for (let i = 1; i < row.length; i++) {
        if (row[i] === currentDark) {
          currentLen++;
        } else {
          spans.push({ isDark: currentDark, length: currentLen });
          currentDark = row[i];
          currentLen = 1;
        }
      }
      spans.push({ isDark: currentDark, length: currentLen });
      return spans;
    });
  }, [matrix]);

  return (
    <View style={local.container}>
      {title ? <Text style={local.title}>{title}</Text> : null}
      <View
        style={[
          local.qrBox,
          {
            width: actualSize + 24,
            height: actualSize + 24,
            backgroundColor,
          },
        ]}
      >
        <View style={{ width: actualSize, height: actualSize }}>
          {optimizedRows.map((spans, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: "row", height: cellSize }}>
              {spans.map((span, spanIndex) => (
                <View
                  key={spanIndex}
                  style={{
                    width: span.length * cellSize,
                    height: cellSize,
                    backgroundColor: span.isDark ? color : backgroundColor,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
      {subtitle ? <Text style={local.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const local = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 8,
  },
  qrBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.navy,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: palette.muted,
    textAlign: "center",
    fontWeight: "600",
  },
});
