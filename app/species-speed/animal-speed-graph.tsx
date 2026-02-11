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

  // used to set graphing data
  const [animalData, setAnimalData] = useState<AnimalDatum[]>([]);

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

    // Create diet groups for multiple graphs
    const diets: AnimalDatum["diet"][] = ["Herbivore", "Carnivore", "Omnivore"];

    const groupedData = diets.map((diet) => ({
      diet,
      data: animalData.filter((d) => d.diet === diet),
    }));

    // Set up chart dimensions and margins
    const containerWidth = graphRef.current?.clientWidth ?? 800;
    const containerHeight = graphRef.current?.clientHeight ?? 500;

    // Set up chart dimensions and margins
    const width = Math.max(containerWidth, 600); // Minimum width of 600px
    const height = Math.max(containerHeight, 800); // Minimum height of 400px
    const margin = { top: 30, right: 60, bottom: 100, left: 150 };

    // Create the SVG element where D3 will draw the chart
    // https://github.com/d3/d3-selection
    const dietAverages: { diet: string; avg: number }[] = [];

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["Herbivore", "Omnivore", "Carnivore"])
      .range(["#76d783", "#f9d448", "#e57373"]);

    groupedData.forEach(({ diet, data }) => {
      const sortedData = [...data].sort((a, b) => b.speed - a.speed).slice(0, 100);

      const avgSpeed = d3.mean(data, (d) => d.speed) ?? 0;

      dietAverages.push({
        diet,
        avg: avgSpeed,
      });

      const fastest = d3.max(data, (d) => d.speed) ?? 0;
      const slowest = d3.min(data, (d) => d.speed) ?? 0;

      const fastestAnimal = data.find((d) => d.speed === fastest);
      const slowestAnimal = data.find((d) => d.speed === slowest);

      // section header. Add text in between graphs

      select(graphRef.current!)
        .append("h1")
        .text(diet)
        .style("color", "white")
        .style("margin-top", "40px")
        .style("margin-bottom", "8px")
        .style("font-weight", "bold")
        .style("font-size", "20px");

      select(graphRef.current!)
        .append("p")
        .attr("class", "text-zinc-400 mb-6 max-w-2xl leading-relaxed")
        .text(
          `On average, ${diet.toLowerCase()} animals in this dataset move at about ${avgSpeed.toFixed(
            1,
          )} km/h. The fastest ${diet.toLowerCase()} is the ${fastestAnimal?.name}, reaching speeds of up to ${fastest} km/h, while the slowest is the ${slowestAnimal?.name}, moving at approximately ${slowest} km/h.`,
        );

      const svg = select(graphRef.current!)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("margin-bottom", "40px");

      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // Create the Main Group (offset by margins)
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const tooltip = select(graphRef.current!)
        .append("div")
        .style("position", "absolute")
        .style("background", "#111")
        .style("padding", "6px 10px")
        .style("border-radius", "6px")
        .style("color", "white")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0);

      // x-values for graph
      const y = d3
        .scaleBand()
        .domain(sortedData.map((d) => d.name))
        .range([0, innerHeight])
        .padding(0.2);

      // y-values for graph
      const x = d3
        .scaleLinear()
        .domain([0, d3.max(sortedData, (d) => d.speed) ?? 120])
        .nice()
        .range([0, innerWidth]);

      g.selectAll("rect")
        .data(sortedData)
        .join("rect")
        .attr("y", (d) => y(d.name)!)
        .attr("x", 0)
        .attr("height", y.bandwidth())
        .attr("width", (d) => x(d.speed))
        .attr("fill", (d) => colorScale(d.diet))
        .on("mousemove", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(`<strong>${d.name}</strong><br/>${d.speed} km/h`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

      const xAxis = g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x));

      xAxis
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end")
        .style("font-size", "12px");

      g.append("g").call(d3.axisLeft(y));

      g.append("text")
        .attr("text-anchor", "middle")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + margin.bottom - 30)
        .text("Average Speed (km/h)")
        .style("fill", "currentColor")
        .style("font-size", "20px");

      g.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -innerHeight / 2)
        .text("Animal")
        .style("fill", "currentColor")
        .style("font-size", "20px");
    });

    const summaryWidth = width;
    const summaryHeight = 300;

    const summarySvg = select(graphRef.current!)
      .append("svg")
      .attr("width", summaryWidth)
      .attr("height", summaryHeight);

    summarySvg
      .append("text")
      .attr("x", summaryWidth / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("Average Speed by Diet");

    const sMargin = { top: 60, right: 40, bottom: 60, left: 60 };
    const sInnerW = summaryWidth - sMargin.left - sMargin.right;
    const sInnerH = summaryHeight - sMargin.top - sMargin.bottom;

    const sg = summarySvg.append("g").attr("transform", `translate(${sMargin.left},${sMargin.top})`);

    const sx = d3
      .scaleBand()
      .domain(dietAverages.map((d) => d.diet))
      .range([0, sInnerW])
      .padding(0.4);

    const sy = d3
      .scaleLinear()
      .domain([0, d3.max(dietAverages, (d) => d.avg)!])
      .nice()
      .range([sInnerH, 0]);

    sg.append("g").attr("transform", `translate(0,${sInnerH})`).call(d3.axisBottom(sx));
    sg.append("g").call(d3.axisLeft(sy));

    const summaryTooltip = select(graphRef.current!)
      .append("div")
      .style("position", "absolute")
      .style("background", "#111")
      .style("padding", "6px 10px")
      .style("border-radius", "6px")
      .style("color", "white")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    sg.selectAll("rect")
      .data(dietAverages)
      .join("rect")
      .attr("x", (d) => sx(d.diet)!)
      .attr("y", (d) => sy(d.avg))
      .attr("width", sx.bandwidth())
      .attr("height", (d) => sInnerH - sy(d.avg))
      .attr("fill", (d) => colorScale(d.diet))
      .on("mousemove", (event, d) => {
        summaryTooltip
          .style("opacity", 1)
          .html(`<strong>${d.diet}</strong><br/>Avg speed: ${d.avg.toFixed(1)} km/h`)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => summaryTooltip.style("opacity", 0));

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
