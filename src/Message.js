export default class {
    constructor(agent, updateQueue) {
        this.agent = agent;
        this.updateQueue = updateQueue;
    }

    payload() {
        return {
            // This ensures only the type & payload properties only get sent over.
            updates: this.updateQueue.map(update => ({
                type: update.type,
                payload: update.payload
            }))
        };
    }

    storeResponse(payload) {
      return (this.response = payload);
    }

}
