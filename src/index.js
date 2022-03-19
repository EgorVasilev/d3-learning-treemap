'use strict';
import {
    hierarchy,
    rgb,
    scaleOrdinal,
    schemeCategory10,
    select,
    treemap,
} from 'd3';

/* check #plot aspect-ration in CSS as well if you want to change it */
const plotWidth = 1600;
const plotHeight = 1000;
const legendHeight = 200;

function fetchSales() {
    return fetch(
        'https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json'
    ).then((response) => response.json());
}

function setPlotSize() {
    select('#plot').attr('viewBox', `0 0 ${plotWidth} ${plotHeight}`);
}

function handleMouseOver(event, { name, category, value }) {
    const offset = 10;

    select('.tooltip')
        .html(
            `
            <div>name: ${name}</div>
            <div>category: ${category}</div>
            <div>value: ${value}</div>`
        )
        .style('top', `${event.clientY + offset}px`)
        .style('left', `${event.clientX + offset}px`)
        .attr('data-value', value)
        .classed('hidden', false);
}

function handleMouseOut() {
    select('.tooltip').classed('hidden', true);
}

function getColorScale(data) {
    const devices = data.children.map((device) => device.name);

    return scaleOrdinal()
        .domain(devices)
        .range(
            devices.map((_, index) => {
                if (index > schemeCategory10.length - 1) {
                    const color = rgb(
                        schemeCategory10[index - schemeCategory10.length]
                    );

                    color.opacity = 0.3;

                    return color;
                }

                return schemeCategory10[index];
            })
        );
}

function wrap(data) {
    const width = data.x1 - data.x0;
    const height = data.y1 - data.y0;

    let self = select(this);
    let textLength = self.node().getComputedTextLength();
    let text = self.text();

    while (textLength > (isVerticalNode(width, height) ? height : width) - 10) {
        text = text.slice(0, -1);
        self.text(text + '...');
        textLength = self.node().getComputedTextLength();
    }
}

function isVerticalNode(width, height) {
    return width * 1.7 < height;
}

function renderMap(sales, colorScale) {
    const root = hierarchy(sales);

    const tree = treemap()
        .size([plotWidth, plotHeight - legendHeight])
        .padding(1);

    const nodes = tree(
        root
            .sum(function (d) {
                return d.value;
            })
            .sort(function (a, b) {
                return b.height - a.height || b.value - a.value;
            })
    );

    const cells = select('#plot')
        .append('g')
        .selectAll('g')
        .data(nodes.leaves())
        .enter()
        .append('g');

    cells
        .append('rect')
        .attr('class', 'tile')
        .attr('data-name', ({ data }) => data.name)
        .attr('data-category', ({ data }) => data.category)
        .attr('data-value', ({ data }) => data.value)
        .attr('x', (data) => data.x0)
        .attr('y', (data) => data.y0)
        .attr('width', (data) => data.x1 - data.x0)
        .attr('height', (data) => data.y1 - data.y0)
        .attr('fill', ({ data }) => colorScale(data.category))
        .on('mousemove', (event, { data }) => handleMouseOver(event, data))
        .on('mouseout', handleMouseOut);

    cells
        .append('text')
        .attr('transform', (data) => {
            const width = data.x1 - data.x0;
            const height = data.y1 - data.y0;
            const isVertical = isVerticalNode(width, height);

            return (
                `translate(${data.x0 + 10} ${
                    data.y0 + (isVertical ? 10 : 20)
                })` + (isVertical ? ' rotate(90)' : '')
            );
        })
        .text((data) => data.data.name)
        .each(wrap);
}

function renderLegend(colorScale) {
    const plot = select('#plot');
    const cellSize = 25;
    const cellsPadding = 20;
    const fontSize = 17;
    const colors = colorScale.range();

    plot.append('g')
        .attr('id', 'legend')
        .attr('class', 'legend')
        .selectAll('legend')
        .data(colors)
        .enter()
        .append('rect')
        .attr('class', 'legend-item')
        .attr(
            'x',
            (_, index) =>
                index * (cellSize + cellsPadding) -
                (index % 2 === 0 ? 0 : cellSize + cellsPadding)
        )
        .attr(
            'y',
            (_, index) =>
                plotHeight -
                100 +
                (index % 2 !== 0 ? cellSize + cellsPadding : 0)
        )
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', (color) => color);

    select('#legend')
        .selectAll('text')
        .data(colorScale.domain())
        .enter()
        .append('text')
        .style('font-size', fontSize)
        .attr(
            'x',
            (_, index) =>
                cellSize +
                5 +
                index * (cellSize + cellsPadding) -
                (index % 2 !== 0 ? cellSize + cellsPadding : 0)
        )
        .attr(
            'y',
            (_, index) =>
                plotHeight +
                fontSize -
                100 +
                (index % 2 !== 0 ? cellSize + cellsPadding : 0)
        )
        .text((name) => name);
}

setPlotSize();

fetchSales()
    .then((sales) => {
        const colorScale = getColorScale(sales);

        renderMap(sales, colorScale);
        renderLegend(colorScale);
    })
    .catch((error) => {
        console.error('rendering failed:', error);
    });
