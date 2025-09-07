import { scaleQuantize } from "d3-scale";
import { memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
// gotten from https://cdn.jsdelivr.net/npm/visionscarto-world-atlas@0.1.0/world/110m.json
import world110m from "src/lib/110m.json";
import { feature } from "topojson-client";

interface TrafficMapProps {
  trafficByCountry: Record<string, number>;
}

const geos = feature(world110m as any, (world110m as any).objects.countries);

export const TrafficMap = memo(function TrafficMap({
  trafficByCountry,
}: TrafficMapProps) {
  const values = Object.values(trafficByCountry);
  const max = values.length ? Math.max(...values) : 0;

  const color = scaleQuantize<string>()
    .domain([0, max])
    .range([
      "oklch(from var(--primary) l c h / 0.5)",
      "oklch(from var(--primary) l c h / 0.65)",
      "oklch(from var(--primary) l c h / 0.80)",
      "oklch(from var(--primary) l c h / 0.95)",
      "oklch(from var(--primary) l c h / 1)",
    ]);

  return (
    <div className="w-full">
      <ComposableMap
        projectionConfig={{ scale: 160 }}
        style={{ width: "100%", height: "auto" }}
        className="outline-none"
      >
        <ZoomableGroup>
          <Geographies geography={geos}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = geo.properties.a3;
                const value = Number(trafficByCountry[code] || 0);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    // OKLCH, visible
                    fill={color(value)}
                    stroke="#e2e8f0"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", opacity: 0.8 },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
});
