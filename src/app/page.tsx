"use client";

import React, { useEffect, useRef, useState } from "react";

import * as d3 from "d3";

/* ───────────── TYPES ───────────── */
type Region = "Africa" | "Americas" | "Asia" | "Europe" | "Oceania";
interface Country {
  name: string;
  value: number;
  region: Region;
  flag: string;
  year: number;
}
interface Frame {
  year: number;
  countries: Country[];
}

/* ───────────── STYLE CONST ───────────── */
const COLOR: Record<Region, string> = {
  Africa: "#e44e9d",
  Americas: "#29a9ff",
  Asia: "#1e7fe5",
  Europe: "#a557d8",
  Oceania: "#ff6b00",
};

/* layout / speed */
const W = 1500, H = 500;
const M = { top: 30, right: 220, bottom: 80, left: 110 } as const;
const BAR_H = 42;
const BAR_DURATION = 90; // ms transition
const AUTO_INTERVAL = 100; // ms next frame
const TIMELINE_STEP = 3; // timeline
const MAX_BARS = 10;

/* ───────────── COMPONENT ───────────── */
export default function BarChartRace() {
  const svgRef = useRef<SVGSVGElement>(null);

  const [frames, setFrames] = useState<Frame[]>([]);
  const [idx, setIdx] = useState(0);
  const [play, setPlay] = useState(true);

  const lastRef = useRef<number>(performance.now()); 
  const rafId = useRef<number>(0);

  useEffect(() => {
    d3.csv("/population.csv", (row: d3.DSVRowString<string>) => {


      const raw = (row["Value"] ?? row["Population"] ?? row["all years"] ?? "").toString().trim();
      const val = parseInt(raw.replace(/[, ]/g, ""), 10);
      if (Number.isNaN(val)) return;

      const entity = (row["Entity"] as string).replace(/\s*\(UN\)\s*/, "").trim();

      //ignore case entity
       if (entity === 'World' || entity.includes('developed') || entity.includes('countries') || entity.includes('Asia')) {
        return null; 
      }
      const region =((row["region"] as string)?.trim() as Region) ?? (entity as Region);

      return {
        year: +row["Year"]!,
        name: entity,
        region,
        value: val,
        flag: (row["flag"] as string) || "",
      };
    }).then((rows: Country[] | undefined) => {
      if (!rows) return;
      const byYear = d3.group(rows, (d: Country) => d.year);
      const list: Frame[] = [];
      for (const [year, countries] of byYear) list.push({ year, countries });
      list.sort((a, b) => a.year - b.year);
      setFrames(list);
      setIdx(0);
    });
  }, []);

  useEffect(() => {
    if (!frames.length) return;

    const frame = frames[idx];
    const data = [...frame.countries].sort((a, b) => b.value - a.value).slice(0, MAX_BARS);

    const x = d3.scaleLinear().domain([0, d3.max(data, (d: Country) => d.value) ?? 1]) .range([M.left, W - M.right]);

    const y = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.name))
      .range([M.top, M.top + BAR_H * data.length])
      .padding(0.1);

    const minY = frames[0].year;
    const maxY = frames.at(-1)!.year;

    const tlScale = d3.scaleLinear().domain([minY, maxY]).range([M.left, W - M.right]);
    const yrsLabel = d3.range(minY, maxY + 1).filter((y: number) => y % TIMELINE_STEP === 0);

    const svg = d3.select(svgRef.current!).attr("viewBox", `0 0 ${W} ${H}`);

    /* ---------- X-Axis ---------- */
    svg
      .selectAll<SVGGElement, unknown>("g.axis")
      .data([0])
      .join("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${M.top})`)
      .transition()
      .duration(BAR_DURATION)
      .call(
        d3
          .axisTop(x)
          .ticks(6)
          .tickSize(-BAR_H * data.length)
          .tickFormat((d) => d3.format(",")(d as number))
      )
      .call((g) => g.selectAll("line").attr("stroke", "#ccc"))
      .call((g) => g.select(".domain").attr("stroke", "#999"))
      .call((g) =>
        g.selectAll("text").attr("fill", "#666").style("font-size", "12px")
      );

    /* ---------- Bars ---------- */
    const barG = svg
      .selectAll("g.bars")
      .data([0])
      .join("g")
      .attr("class", "bars");
    const bars = barG
      .selectAll<SVGGElement, Country>("g.bar")
      .data(data, (d: Country) => d.name);

    /* exit */
    bars
      .exit()
      .transition()
      .duration(BAR_DURATION)
      .attr("transform", `translate(0,${H})`)
      .remove();

    /* enter skeleton */
    const enter = bars
      .enter()
      .append("g")
      .attr("class", "bar")
      .attr("transform", `translate(0,${H})`);
    enter.append("rect").attr("height", y.bandwidth()).attr("x", M.left);
    enter.append("text").attr("class", "val").attr("dy", "1.1em");
    enter
      .append("text")
      .attr("class", "name")
      .attr("dy", "1.1em")
      .attr("text-anchor", "end");
    enter.append("image");
    enter.append("circle").attr("stroke", "#fff").attr("stroke-width", 2);

    const all = enter.merge(bars as any);

    all
      .transition()
      .duration(BAR_DURATION)
      .attr("transform", (d: Country) => `translate(0,${y(d.name)})`);

    const r = y.bandwidth() / 2 - 2;

    all
    .select<SVGRectElement>("rect")
    .transition()
    .duration(BAR_DURATION)
    .attr("width", (d: Country) => x(d.value) - M.left)
    .attr("fill", (d: Country) => COLOR[d.region] || "#cccccc")

    all
      .select<SVGTextElement>("text.val")
      .transition()
      .duration(BAR_DURATION)
      .attr("x", (d: Country) => x(d.value) + 8)
      .text((d: Country) => d3.format(",")(d.value));

    all
      .select<SVGTextElement>("text.name")
      .transition()
      .duration(BAR_DURATION)
      .attr("x", M.left - 10)
      .text((d: Country) => d.name);

    all
      .select<SVGImageElement>("image")
      .attr("href", (d) => d.flag)
      .attr("width", r * 2)
      .attr("height", r * 2)
      .transition()
      .duration(BAR_DURATION)
      .attr("x", (d: Country) => x(d.value) - r * 2 - 4)
      .attr("y", 4);

    all
      .select<SVGCircleElement>("circle")
      .transition()
      .duration(BAR_DURATION)
      .attr("r", r)
      .attr("cx", (d: Country) => x(d.value) - r - 4)
      .attr("cy", r + 2)
      .attr("fill", (d: Country) => COLOR[d.region]);

    /* ---------- Year & Total ---------- */
    svg
      .selectAll("g.label")
      .data([0])
      .join("g")
      .attr("class", "label")
      .call((g) => {
        g.selectAll("text.year")
          .data([frame.year])
          .join("text")
          .attr("class", "year")
          .attr("x", W - 230)
          .attr("y", H - 120)
          .attr("text-anchor", "end")
          .attr("font-size", "96px")
          .attr("fill", "#c5c5c5")
          .attr("font-weight", 600)
          .text((d: number) => d);

        /* Total */
        g.selectAll("text.total")
          .data([d3.sum(data, (d) => d.value)])
          .join("text")
          .attr("class", "total")
          .attr("x", W - 230)
          .attr("y", H - 80)
          .attr("text-anchor", "end")
          .attr("font-size", "30px")
          .attr("fill", "#c5c5c5")
          .text((d: number) => `Total: ${d3.format(",")(d)}`);
      });

    /* ---------- Timeline ---------- */
    const tl = svg
      .selectAll("g.timeline")
      .data([0])
      .join("g")
      .attr("class", "timeline");

    const baseY = H - 32; // y of baseline
    const majorLen = 10;
    const minorLen = 6; 
    const tri = 8; 

    /* baseline -------------------------------------------------- */
    tl.selectAll("line.base")
      .data([0])
      .join("line")
      .attr("class", "base")
      .attr("x1", M.left)
      .attr("x2", W - M.right)
      .attr("y1", baseY)
      .attr("y2", baseY)
      .attr("stroke", "#888");

    tl.selectAll("line.tick-major")
      .data(yrsLabel) 
      .join("line")
      .attr("class", "tick-major")
      .attr("x1", (d: number) => tlScale(d))
      .attr("x2", (d: number) => tlScale(d))
      .attr("y1", baseY)
      .attr("y2", baseY + majorLen) 
      .attr("cursor", "pointer")
      .attr("stroke", "#888");

    const yrsMinor = d3
      .range(minY, maxY + 1)
      .filter((y: number) => y % TIMELINE_STEP !== 0);

    tl.selectAll("line.tick-minor")
      .data(yrsMinor)
      .join("line")
      .attr("class", "tick-minor")
      .attr("x1", (d:number) => tlScale(d))
      .attr("x2", (d:number) => tlScale(d))
      .attr("y1", baseY)
      .attr("y2", baseY + minorLen) 
      .attr("cursor", "pointer")
      .attr("stroke", "#888"); 

    tl.selectAll("text.lbl")
      .data(yrsLabel)
      .join("text")
      .attr("class", "lbl")
      .attr("x", (d) => tlScale(d))
      .attr("y", baseY + minorLen + 20) 
      .attr("text-anchor", "middle")
      .attr("fill", "#777")
      .attr("cursor", "pointer")
      .style("font-size", "11px")
      .text((d: number) => d);

    const pointer = tl
      .selectAll<SVGPathElement, number>("path.ptr")
      .data([frame.year])
      .join("path")
      .attr("class", "ptr")
      .attr("fill", "#888")
      .attr("cursor", "pointer") 
      .attr("d", (d) => {
        const cx = tlScale(d);
        return `M${cx - tri} ${baseY - 8}
            L${cx + tri} ${baseY - 8}
            L${cx}       ${baseY - 0}
            Z`;
      })
      .call(
        d3
          .drag<SVGPathElement, number>()
          .on("start", () => setPlay(false))
          .on("drag", (event: d3.D3DragEvent<SVGPathElement, number, unknown>) => {
            const clampedX = Math.max(M.left, Math.min(W - M.right, event.x));
            const yr = Math.round(tlScale.invert(clampedX));
            const i = d3.bisector<{ year: number }, number>((d) => d.year).left(frames, yr) - 1;
            const newIdx = Math.max(0, Math.min(frames.length - 1, i));
            if (newIdx !== idx) setIdx(newIdx); 
          })
      );


    tl.on("click", (event: MouseEvent) => {
      const [x] = d3.pointer(event);
      const yr = Math.round(
        tlScale.invert(Math.max(M.left, Math.min(W - M.right, x)))
      );
      const newIx = frames.findIndex((f) => f.year === yr);
      if (newIx !== -1 && newIx !== idx) {
        setIdx(newIx);
        lastRef.current = performance.now(); 
        setPlay(false);
      }
    });
  }, [idx, frames]);

  /* -----------------------------------------------------------
   auto-loop
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!play || !frames.length) return;

    const loop = (t: number) => {
      if (t - lastRef.current > AUTO_INTERVAL) {
        setIdx((i) => (i + 1) % frames.length);
        lastRef.current = t; // รีเซ็ต time stamp
      }
      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current);
    };
  }, [play, frames.length]);

  /* ── 4. RENDER ──────────────────────────────────────────── */
  return (
    <div
      style={{
        position: "relative",
        width: W,
        margin: "0 auto",
        marginTop: 50,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {frames.length === 0 && <p style={{ textAlign: "center" }}>Loading…</p>}
      <svg ref={svgRef} width={W} height={H} />
      {/* play / pause */}
      <button
        onClick={() => setPlay((p) => !p)}
        style={{
          position: "absolute",
          left: 30,
          bottom: 35,
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: "#333",
          color: "#fff",
          border: "none",
          fontSize: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,.3)",
          cursor: "pointer",
        }}
      >
        {play ? "❚❚" : "▶"}
      </button>
      <div style={{ position: "relative", left: 30, fontSize: 13 }}>
        <span style={{ fontSize: 16, fontWeight: "bold", color: "#000000" }}>
          Region
        </span>
        {Object.entries(COLOR).map(([r, c]) => (
          <span key={r} style={{ marginLeft: 14, color: "#000000" }}>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: c,
                marginRight: 4,
              }}
            />
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
