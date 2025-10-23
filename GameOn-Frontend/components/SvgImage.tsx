import React from "react";
import { View, ActivityIndicator, StyleSheet, ViewStyle, Image } from "react-native";
import { SvgXml } from "react-native-svg";

// In-memory cache for fetched SVG XML strings. null means fetch failed.
const svgCache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

async function fetchSvgXml(uri: string): Promise<string | null> {
  if (svgCache.has(uri)) return svgCache.get(uri) as string | null;
  if (inFlight.has(uri)) return inFlight.get(uri) as Promise<string | null>;

  console.debug(`[SvgImage] fetch start: ${uri}`);
  const p = fetch(uri)
    .then((r) => r.text())
    .then((text) => {
      const t = typeof text === "string" ? text.trim() : "";
      if (t.match(/<svg[\s>]/i) || t.includes("<svg")) {
        svgCache.set(uri, text);
        console.debug(`[SvgImage] fetched and cached: ${uri}`);
        return text;
      }
      console.warn(`[SvgImage] fetched content for ${uri} did not contain <svg>`);
      svgCache.set(uri, null);
      return null;
    })
    .catch((err) => {
      console.warn(`[SvgImage] fetch failed for ${uri}:`, err?.message || err);
      svgCache.set(uri, null);
      return null;
    })
    .finally(() => {
      inFlight.delete(uri);
    });

  inFlight.set(uri, p);
  return p;
}

export default function SvgImage({
  uri,
  width = 48,
  height = 48,
  style,
}: {
  uri: string;
  width?: number;
  height?: number;
  style?: ViewStyle;
}) {
  const [xml, setXml] = React.useState<string | null | undefined>(undefined);
  const [pngFallback, setPngFallback] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    setXml(undefined);
    if (!uri) {
      setXml(null);
      return;
    }
    // If cached, set immediately
    if (svgCache.has(uri)) {
      const cached = svgCache.get(uri) as string | null;
      console.debug(`[SvgImage] cache hit for ${uri}: ${cached ? "ok" : "null"}`);
      if (mounted) setXml(cached);
      return;
    }

    fetchSvgXml(uri).then((val) => {
      if (!mounted) return;
      if (val) {
        setXml(val);
        return;
      }
      if (uri.toLowerCase().endsWith(".svg")) {
        const pngUri = uri.replace(/\.svg$/i, ".png");
        fetch(pngUri, { method: "GET" })
          .then((r) => {
            if (r.ok) {
              console.debug(`[SvgImage] using PNG fallback for ${uri} -> ${pngUri}`);
              setPngFallback(pngUri);
            } else {
              setXml(null);
            }
          })
          .catch(() => setXml(null));
      } else {
        setXml(null);
      }
    });

    return () => {
      mounted = false;
    };
  }, [uri]);

  if (xml === undefined) {
    return (
      <View style={[styles.wrapper, { width, height }, style]}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (xml === null && pngFallback == null) {
    return <View style={[styles.wrapper, { width, height }, style]} />;
  }

  if (pngFallback) {
    return (
      <View style={[styles.wrapper, { width, height }, style]}>
        <Image source={{ uri: pngFallback }} style={{ width, height }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { width, height }, style]}>
      <SvgXml xml={xml as string} width={width} height={height} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
  },
});
