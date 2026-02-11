/* eslint-disable */
"use client";

import * as d3 from "d3";
import { select } from "d3-selection";
import { useEffect, useRef, useState } from "react";

// Example data: Only the first three rows are provided as an example
// Add more animals or change up the style as you desire

interface AnimalDatum {
  name: string;
  speed: number;
  diet: "Herbivore" | "Omnivore" | "Carnivore";
}

export default function AnimalSpeedGraph() {
  // useRef creates a reference to the div where D3 will draw the chart.
  // https://react.dev/reference/react/useRef
  const graphRef = useRef<HTMLDivElement>(null);

  const [animalData, setAnimalData] = useState<AnimalDatum[]>([]);

  // TODO: Load CSV data
  useEffect(() => {
    // Fetch data
    const loadData = async () => {
      try {
        // Uses row mapper anonymous function to translate csv data into format needed
        const animal_data = await d3.csv("/data/sample_animals.csv", (d) => {
          return {
            name: d["Animal"],
            speed: +(d["Average Speed (km/h)"] ?? 0), // "+" operator turns string into number
            diet: d["Diet"],
          } as AnimalDatum;
        });

        setAnimalData(animal_data as AnimalDatum[]);
      } catch (error) {
        console.log("Failed to load CSV:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Clear any previous SVG to avoid duplicates when React hot-reloads
    if (graphRef.current) {
      graphRef.current.innerHTML = "";
    }

    if (animalData.length === 0) return;

    // Set up chart dimensions and margins
    const containerWidth = graphRef.current?.clientWidth ?? 800;
    const containerHeight = graphRef.current?.clientHeight ?? 500;

    // Set up chart dimensions and margins
    const width = Math.max(containerWidth, 600); // Minimum width of 600px
    const height = Math.max(containerHeight, 400); // Minimum height of 400px
    const margin = { top: 70, right: 60, bottom: 80, left: 100 };

    // Create the SVG element where D3 will draw the chart
    // https://github.com/d3/d3-selection
    const svg = select(graphRef.current!).append<SVGSVGElement>("svg").attr("width", width).attr("height", height);

    // Create the Main Group (offset by margins)
    // Everything we draw gets appended to 'g', NOT 'svg' directly
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // x-values for graph
    const x = d3
      .scaleBand()
      .domain(animalData.map((d) => d.name))
      .range([0, width])
      .padding(0.2);

    // y-values for graph
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(animalData, (d) => d.speed) ?? 120])
      .nice()
      .range([height, 0]);

    // colors for graph
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["Herbivore", "Omnivore", "Carnivore"])
      .range(["#76d783", "#f9d448", "#e57373"]);

    g.selectAll("rect")
      .data(animalData)
      .join("rect")
      .attr("x", (d) => x(d.name)!)
      .attr("y", (d) => y(d.speed))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerHeight - y(d.speed)) // Draw from bottom up
      .attr("fill", (d) => colorScale(d.diet));

    // Draw axes

    // X-Axis
    const xAxis = g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x));

    xAxis
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "12px");

    // Y-Axis
    g.append("g").call(d3.axisLeft(y));

    // X-Axis Title
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 10)
      .text("Animal")
      .style("fill", "currentColor")
      .style("font-size", "14px");

    // Y-Axis Title
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -innerHeight / 2)
      .text("Speed (km/h)")
      .style("fill", "currentColor")
      .style("font-size", "14px");

    // HINT: Look up the documentation at these links
    // https://github.com/d3/d3-scale#band-scales
    // https://github.com/d3/d3-scale#linear-scales
    // https://github.com/d3/d3-scale#ordinal-scales
    // https://github.com/d3/d3-axis
  }, [animalData]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-950">
      <div className="w-full max-w-4xl rounded-xl border border-gray-200 bg-zinc-950 p-6 shadow-lg">
        <h2 className="mb-2 text-center text-2xl font-bold text-white">Animal Speeds Comparison</h2>

        {/* This is the div where D3 will inject the SVG */}
        <div ref={graphRef} className="w-full overflow-x-auto" />

        {animalData.length === 0 && <p className="mt-4 text-center text-zinc-500">Loading data...</p>}
      </div>
    </div>
  );
}
