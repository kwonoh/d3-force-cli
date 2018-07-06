#!/usr/bin/env node

const commandLineArgs = require('command-line-args');
const d3 = require('d3-force');
const fs = require('fs');

const optionDefinitions = [
    {name: 'input', alias: 'i', type: String},
    {
        name: 'output',
        alias: 'o',
        type: String,
        help: 'If empty, the program will overwrite the input file in place.'
    },
    {name: 'link-distance', type: Number},
    {name: 'link-iterations', type: Number},
    {name: 'charge-strength', type: Number},
    {name: 'log-perf', type: Boolean},
];

function main(options)
{
    if (fs.existsSync(options.input)) {
        if (!options.output) options.output = options.input;

        try {
            const g = JSON.parse(fs.readFileSync(options.input));
            computeLayout(g, options, (computeWallSecs) => {
                if (options.logPerf)
                    console.log(`d3-force wall seconds: ${computeWallSecs}`);
                fs.writeFileSync(options.output, JSON.stringify(g));
            });
        }
        catch (err) {
            console.error(`Unable to parse file ${options.input}`);
            throw err;
        }
    }
    else {
        console.error('Unable to load the input file.');
    }
}

function computeLayout(g, options, onend)
{
    const h = JSON.parse(JSON.stringify(g));
    const forceLink = d3.forceLink();
    if (options.linkDistance !== undefined)
        forceLink.distance(options.linkDistance);
    if (options.linkIterations !== undefined)
        forceLink.iterations(options.linkIterations);

    const forceCharge = d3.forceManyBody();
    if (options.chargeStrength !== undefined)
        forceCharge.strength(options.chargeStrength);

    const copyPosition = () => {
        h.nodes.forEach((u) => {
            const v = g.nodes[u.index];
            v.x = u.x;
            v.y = u.y;
        });
    };

    const started = process.hrtime();
    const simulation = d3.forceSimulation()
                           .force('link', forceLink)
                           .force('charge', forceCharge)
                           .force('center', d3.forceCenter())
                           .on('end', () => {
                               const diff = process.hrtime(started);
                               copyPosition();
                               if (onend) onend(diff[0] + diff[1] / 1e9);
                           });
    simulation.nodes(h.nodes);
    forceLink.links(h.links);
}

if (require.main === module) {
    main(commandLineArgs(optionDefinitions, {camelCase: true}));
}
