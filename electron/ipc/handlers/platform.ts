import { IpcMainInvokeEvent } from 'electron'

export const platformHandlers = {
    getPlatform: async () => process.platform
}
