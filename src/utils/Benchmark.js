import Logger from './Logger';

let Benchmark = {

    labels: {},

    start: function(label) {
        this.labels[label] = Date.now();
    },

    stop: function(label, {output = true}={}) {
        let diff = Date.now() - this.labels[label];
        if (output) {
            Logger.debug(`Benchmark:${label} = ${diff}`);
        }
        return diff;
    }
};

export default Benchmark;
