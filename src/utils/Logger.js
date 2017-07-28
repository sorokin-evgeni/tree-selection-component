
let logLevel = 1;

const Logger = {

    /**
     * Set log level
     * @param level 1 - logging, 0 - stop logging.
     */
    setLevel(level) {
        logLevel = level;
    },

    debug(...args) {
        if (!logLevel) {
            return;
        }
        console.log(...args);
    // args.forEach(text => {
    //     document.write(text);
    //     let consoleEl = document.getElementById('console');
    //     consoleEl.innerHTML += text + '<br/>';
    // })
    }

};

export default Logger;
