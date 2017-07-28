import Logger from './Logger';

const Benchmark = {

    labels: {},

    start(label) {
        this.labels[label] = Date.now();
    },

    stop(label, {output = true} = {}) {
        const diff = Date.now() - this.labels[label];

        if (output) {
            Logger.debug(`Benchmark:${label} = ${diff}`);
        }

        return diff;
    }
};

export default Benchmark;
