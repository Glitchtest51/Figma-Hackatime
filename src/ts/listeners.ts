import { sendHeartbeat, markActivity } from "./heartbeat"

export async function setupListeners() {
    await figma.loadAllPagesAsync()

    figma.on('selectionchange', () => {
        // markActivity()
        void sendHeartbeat(false)
        console.log('selectionchange')
    })

    figma.on('currentpagechange', () => {
        // markActivity()
        void sendHeartbeat(false)
        console.log('currentpagechange')
    })

    figma.on('documentchange', (event) => {
        if (!event.documentChanges.some(change => change.origin === 'LOCAL')) {return}

        markActivity()
        void sendHeartbeat(true)
        console.log('documentchange')
    })
}