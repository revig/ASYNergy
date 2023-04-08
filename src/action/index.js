export default class {
    constructor(el, skipWatcher = false) {
        this.el = el;
        this.skipWatcher = skipWatcher;
        this.updateQueue = [];
    }
}
