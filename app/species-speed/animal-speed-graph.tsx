/* eslint-disable */
"use client";
import * as d3 from "d3";
import { select } from "d3-selection";
import { useEffect, useRef, useState } from "react";

// Example data: Only the first three rows are provided as an example
// Add more animals or change up the style as you desire

// TODO: Write this interface
interface AnimalDatum {
  name: string;
  diet: "Carnivore" | "Herbivore" | "Omnivore";
  speed: number;
}

export default function AnimalSpeedGraph() {
  // useRef creates a reference to the div where D3 will draw the chart.
  // https://react.dev/reference/react/useRef
  const graphRef = useRef<HTMLDivElement>(null);

  const [animalData, setAnimalData] = useState<AnimalDatum[]>([]);

  // TODO: Load CSV data
  useEffect(() => {
    // Load CSV and map to AnimalDatum
    d3.csv("/[CELINE_M] - Cleaned Animal Data.csv").then((data) => {
      const mapped = data
        .filter((row) => row.Animal && row.Diet && row["Average Speed (km/h)"])
        .map((row) => ({
          name: row.Animal,
          diet: row.Diet as "Carnivore" | "Herbivore" | "Omnivore",
          speed: parseFloat(row["Average Speed (km/h)"] ?? ""),
        })) as AnimalDatum[];
      setAnimalData(mapped);
    });
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

    // TODO: Implement the rest of the graph
    // HINT: Look up the documentation at these links
    // https://github.com/d3/d3-scale#band-scales
    // https://github.com/d3/d3-scale#linear-scales
    // https://github.com/d3/d3-scale#ordinal-scales
    // https://github.com/d3/d3-axis

    const x = d3
      .scaleBand<string>()
      .domain(animalData.map((d) => d.name))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(animalData, (d) => d.speed) ?? 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3
      .scaleOrdinal<AnimalDatum["diet"], string>()
      .domain(["Carnivore", "Herbivore", "Omnivore"])
      .range(["red", "green", "blue"]);

    svg
      .selectAll("rect")
      .data(animalData)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.name)!)
      .attr("y", (d) => y(d.speed))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - margin.bottom - y(d.speed))
      .attr("fill", (d) => color(d.diet));

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
  }, [animalData]);

  // TODO: Return the graph
  return <div ref={graphRef} />;
}
