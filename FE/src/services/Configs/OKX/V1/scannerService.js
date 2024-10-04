import api from "../../../../utils/api"

// GET

export const getAllConfigScanner = async (botListInput) => {
    return await api.post("/scannerOKXV1/getAllConfigScanner", { botListInput })
}
export const closeAllBotForUpCodeV1 = async () => {
    return await api.get("/scannerOKXV1/closeAllBotForUpCode")
}

// CREATE
export const createConfigScanner = async (data) => {
    return await api.post("/scannerOKXV1/createConfigScanner", data)
}
export const updateStrategiesMultipleScanner = async (data) => {
    return await api.post("/scannerOKXV1/updateStrategiesMultipleScanner", data)
}

export const deleteStrategiesMultipleScanner = async (data) => {
    return await api.post("/scannerOKXV1/deleteStrategiesMultipleScanner", data)
}
export const deleteStrategiesByIDScanner = async (data) => {
    return await api.post("/scannerOKXV1/deleteStrategiesByIDScanner", data)
}
export const copyMultipleStrategiesToBotScanner = async (data) => {
    return await api.post("/scannerOKXV1/copyMultipleStrategiesToBotScanner", data)
}
export const handleBookmarkScanner = async (data) => {
    return await api.post("/scannerOKXV1/handleBookmarkScanner", data)
}
export const updateConfigByID = async (data) => {
    return await api.post("/scannerOKXV1/updateConfigByID", data)
}


// OTHER
export const syncSymbolScanner = async () => {
    return await api.get("/scannerOKXV1/syncSymbolScanner")
}
