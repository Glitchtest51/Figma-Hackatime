import { Heartbeat } from "./heartbeat";

export async function checkAPI()  {
    let apiKey = (await figma.clientStorage.getAsync('apiKey'))?.trim()
    let url = (await figma.clientStorage.getAsync('apiURL'))?.trim().replace(/\/$/, "")

    if (!apiKey && !url) {
        return { ok: false, reason: "missing_both" };
    }
    if (!url) {
        return { ok: false, reason: "missing_url" };
    }
    if (!apiKey) {
        return { ok: false, reason: "missing_key" };
    }
    
    if (/^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(url)) {
        try {
            const response = await fetch(`${url}/users/current`, {headers: {Authorization: `Basic ${base64EncodeString(apiKey)}`}})
            
            if (response.status === 401) {
                return { ok: false, reason: "invalid_credentials" }
            }
    
            if (!response.ok) {
                return {ok: false, reason: "api_error", status: response.status}
            }
    
            return { ok: true }
        } catch {
            return {ok: false, reason: "network_error"}
        }
    } else {
        return {ok: false, reason: "invalid_url"}
    }
}

export async function sendHeartbeatsToAPI(heartbeats: Heartbeat[]) {
    let apiKey = (await figma.clientStorage.getAsync('apiKey'))?.trim()
    let url = (await figma.clientStorage.getAsync('apiURL'))?.trim().replace(/\/$/, "")

    if (!apiKey || !url) {
        throw new Error("Missing API key or API URL")
    }

    const response = await fetch(`${url}/users/current/heartbeats.bulk`, {method: "POST", headers: { Authorization: `Basic ${base64EncodeString(apiKey)}`, "Content-Type": "application/json"}, body: JSON.stringify(heartbeats)})
    if (response.status !== 201 && response.status !== 202) {
        const body = await response.text()

        throw new Error(`Heartbeat API failed (${response.status}): ${body}`)
    }

    console.log(`Sent ${heartbeats.length} heartbeats`)
}

function base64EncodeString(value: string) {
    const bytes = new Uint8Array(value.length)

    for (let i = 0; i < value.length; i++) {
        bytes[i] = value.charCodeAt(i)
    }

    return figma.base64Encode(bytes)
}