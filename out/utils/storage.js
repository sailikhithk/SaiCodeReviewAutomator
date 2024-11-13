"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageManager = void 0;
class StorageManager {
    constructor(context) {
        this.context = context;
    }
    async storeSecret(key, value) {
        await this.context.secrets.store(key, value);
    }
    async getSecret(key) {
        return await this.context.secrets.get(key);
    }
    async deleteSecret(key) {
        await this.context.secrets.delete(key);
    }
}
exports.StorageManager = StorageManager;
//# sourceMappingURL=storage.js.map