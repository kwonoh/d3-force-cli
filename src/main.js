const commandLineArgs = require('command-line-args');
const d3 = require('d3-force');
const fs = require('fs');

const optionDefinitions = [
    {name: 'input', alias: 'i', type: String}, {
        name: 'output',
        alias: 'o',
        type: String,
        help: 'If empty, the programm will inplace the input file.'
    },
    {name: 'link-distance', type: Number},
    {name: 'link-iterations', type: Number},
    {name: 'charge-strength', type: Number}
];

function main(options)
{
    if (fs.existsSync(options.input)) {
        if (!options.output) options.output = options.input;

        try {
            const g = JSON.parse(fs.readFileSync(options.input));
            computeLayout(g, options, () => {
                fs.writeFileSync(options.output, JSON.stringify(g));
            });
        }
        catch (err) {
            console.error(f`Unable to parse file ${options.input}`);
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
    if (options.linkDistance) forceLink.distance(options.linkDistance);
    if (options.linkIterations) forceLink.iterations(options.linkIterations);

    const forceCharge = d3.forceManyBody();
    if (options.chargeStrength) forceCharge.strength(options.chargeStrength);

    const copyPosition = () => {
        h.nodes.forEach((u) => {
            const v = g.nodes[u.index];
            v.x = u.x;
            v.y = u.y;
        });
    };

    const simulation = d3.forceSimulation()
                           .force('link', forceLink)
                           .force('charge', forceCharge)
                           .force('center', d3.forceCenter())
                           .on('end', () => {
                               copyPosition();
                               if (onend) onend();
                           });

    simulation.nodes(h.nodes);
    forceLink.links(h.links);
}

if (require.main === module) {
    main(commandLineArgs(optionDefinitions, {camelCase: true}));
}
