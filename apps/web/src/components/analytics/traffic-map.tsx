import { memo, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { feature } from "topojson-client";
import world110m from "world-atlas/countries-110m.json";
import { scaleQuantize } from "d3-scale";

interface TrafficMapProps {
  trafficByCountry: Record<string, number>;
}

export const TrafficMap = memo(function TrafficMap({ trafficByCountry }: TrafficMapProps) {
  const geos = useMemo(() => feature(world110m as any, (world110m as any).objects.countries), []);
  const values = Object.values(trafficByCountry);
  const max = values.length ? Math.max(...values) : 0;

  const colorScale = useMemo(
    () =>
      scaleQuantize<string>()
        .domain([0, max || 1])
        .range([
          "hsl(var(--muted))",
          "hsl(var(--primary) / 0.2)", 
          "hsl(var(--primary) / 0.4)",
          "hsl(var(--primary) / 0.6)",
          "hsl(var(--primary))"
        ]),
    [max]
  );

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
              geographies.map(geo => {
                const code = geo.properties.iso_a3;
                const value = trafficByCountry[code] || 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={value ? colorScale(value) : "hsl(var(--muted))"}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", opacity: 0.8 },
                      pressed: { outline: "none" }
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