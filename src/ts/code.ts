import { setupListeners } from "./listeners"
import { checkAPI } from "./api"

async function main() {
    const apiKey = await figma.clientStorage.getAsync('apiKey')
    let apiURL = await figma.clientStorage.getAsync('apiURL')

    if (!apiURL) {
        await figma.clientStorage.setAsync('apiURL', "https://hackatime.hackclub.com/api/hackatime/v1")
        apiURL = await figma.clientStorage.getAsync('apiURL')
    }

    let apiOK = await checkAPI()
    if (!apiOK.ok || figma.command === "openConfigUI") {
        figma.showUI(__html__, {themeColors: true, width: 400, height: 430, title: "HackaTime Config"})
        figma.ui.postMessage({type: "apiData", "apiKey": apiKey , "apiURL": apiURL})

        let apiOK = await checkAPI()
        if (!apiOK.ok) {
            figma.ui.postMessage({type: "apiError", "reason": apiOK.reason , "status": apiOK.status})
            return
        }
        figma.ui.postMessage({type: "apiOK"})
        return
    }

    await setupListeners()
}

figma.ui.onmessage = async (message) => {
    if (message.type == "settings") {
        await figma.clientStorage.setAsync('apiKey', message.apiKey.trim())
        await figma.clientStorage.setAsync('apiURL', message.apiURL.trim())

        let apiOK = await checkAPI()

        if (!apiOK.ok) {
            figma.ui.postMessage({type: "apiError", "reason": apiOK.reason , "status": apiOK.status})
            return
        }
        figma.ui.postMessage({type: "apiOK"})
        
        await setupListeners()
    }
}

main()