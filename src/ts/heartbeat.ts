import { sendHeartbeatsToAPI } from "./api"

const HEARTBEAT_INTERVAL = 60
const MAX_INACTIVITY = 6 * 60
const FLUSH_INTERVAL = 30 * 1000
const BATCH_SIZE = 25

export type Heartbeat = {
    entity: string
    project: string
    time: number
    type: "file"
    category: "designing"
    language: "Figma"
    is_write: boolean
}

let lastHeartbeat: Heartbeat | null = null
let heartbeatQueue: Heartbeat[] = []
let lastActivityTime = 0
let isFlushing = false
let pendingWrite = false

setInterval(() => {
    const now = Math.floor(Date.now() / 1000)
    const active = lastActivityTime > 0 && now - lastActivityTime < MAX_INACTIVITY
    const heartbeatStale = !lastHeartbeat || now - lastHeartbeat.time >= HEARTBEAT_INTERVAL

    if (active && heartbeatStale) sendHeartbeat(false)
}, 12_000)

export function markActivity() {
    lastActivityTime = Math.floor(Date.now() / 1000)
}

export function sendHeartbeat(isWrite:boolean) {
    const entity = figma.currentPage.name
    const now = Math.floor(Date.now() / 1000)

    if (isWrite) pendingWrite = true

    if (lastHeartbeat && lastHeartbeat.entity === entity && now - lastHeartbeat.time < HEARTBEAT_INTERVAL) {
        return
    }

    if (pendingWrite) isWrite = true

    const heartbeat: Heartbeat = {
        entity,
        project: figma.root.name,
        time: now,
        type: "file",
        category: "designing",
        language: "Figma",
        is_write: isWrite
    }

    console.log("Heartbeat:", heartbeat)

    heartbeatQueue.push(heartbeat)
    lastHeartbeat = heartbeat
    pendingWrite = false

    if (heartbeatQueue.length >= BATCH_SIZE) flushHeartbeat()
}

setInterval(() => {flushHeartbeat()}, FLUSH_INTERVAL)

async function flushHeartbeat() {
    if (isFlushing  || heartbeatQueue.length === 0) return

    isFlushing = true

    const batch = heartbeatQueue.slice(0, BATCH_SIZE)
    try {
        await sendHeartbeatsToAPI(batch)
        heartbeatQueue.splice(0, batch.length)
    } catch (error) {
        console.error("Failed to send heartbeat batch:", error) 
        return
    } finally {isFlushing = false}

    if (heartbeatQueue.length >= BATCH_SIZE) flushHeartbeat()
}
