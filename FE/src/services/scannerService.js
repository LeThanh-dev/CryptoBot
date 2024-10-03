import api from "../utils/api"

// GET

export const getAllConfigScanner = async (botListInput) => {
    return await api.post("/scanner/getAllConfigScanner", { botListInput })
}
export const closeAllBotForUpCodeV1 = async () => {
    return await api.get("/scanner/closeAllBotForUpCode")
}

// CREATE
export const createConfigScanner = async (data) => {
    return await api.post("/scanner/createConfigScanner", data)
}
export const updateStrategiesMultipleScanner = async (data) => {
    return await api.post("/scanner/updateStrategiesMultipleScanner", data)
}

export const deleteStrategiesMultipleScanner = async (data) => {
    return await api.post("/scanner/deleteStrategiesMultipleScanner", data)
}
export const deleteStrategiesByIDScanner = async (data) => {
    return await api.post("/scanner/deleteStrategiesByIDScanner", data)
}
export const copyMultipleStrategiesToBotScanner = async (data) => {
    return await api.post("/scanner/copyMultipleStrategiesToBotScanner", data)
}
export const handleBookmarkScanner = async (data) => {
    return await api.post("/scanner/handleBookmarkScanner", data)
}
export const updateConfigByID = async (data) => {
    return await api.post("/scanner/updateConfigByID", data)
}


// OTHER
export const syncSymbolScanner = async () => {
    return await api.get("/scanner/syncSymbolScanner")
}
