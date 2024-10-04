import api from "../../../../utils/api"

// GET

export const getAllStrategiesSpot = async (botListInput) => {
    return await api.post("/spotOKX/getAllStrategiesSpot", { botListInput })
}
export const getAllSymbolSpot = async () => {
    return await api.get("/spotOKX/getAllSymbolSpot")
}

export const getFutureAvailable = async (botID) => {
    return await api.get(`/spotOKX/getFutureAvailable/${botID}`)
}

export const getTotalFutureByBot = async (userID) => {
    return await api.get(`/spotOKX/getTotalFutureByBot/${userID}`)
}

export const getSpotTotal = async (botID) => {
    return await api.get(`/spotOKX/getSpotTotal/${botID}`)
}

// CREATE
export const createStrategiesSpot = async (data) => {
    return await api.post("/spotOKX/createStrategiesSpot", data)
}

// UPDATE
export const updateStrategiesSpotByID = async ({ id, data }) => {
    return await api.put(`/spotOKX/updateStrategiesSpotByID/${id}`, data)
}
export const updateStrategiesMultipleSpot = async (data) => {
    return await api.post("/spotOKX/updateStrategiesMultipleSpot", data)
}
export const addToBookmarkSpot = async ({ symbolID }) => {
    return await api.put(`/spotOKX/addToBookmarkSpot/${symbolID}`)
}
export const removeToBookmarkSpot = async ({ symbolID }) => {
    return await api.put(`/spotOKX/removeToBookmarkSpot/${symbolID}`)
}

// DELETE
export const deleteStrategiesSpot = async (id) => {
    return await api.delete(`/spotOKX/deleteStrategiesSpot/${id}`)
}
export const deleteStrategiesItemSpot = async (data) => {
    return await api.post("/spotOKX/deleteStrategiesItemSpot", data)
}
export const deleteStrategiesMultipleSpot = async (data) => {
    return await api.post("/spotOKX/deleteStrategiesMultipleSpot", data)
}

// OTHER
export const syncSymbolSpot = async (listSymbolObject) => {
    return await api.post("/spotOKX/syncSymbolSpot",listSymbolObject)
}
export const copyMultipleStrategiesToSymbolSpot = async (newData) => {
    return await api.post(`/spotOKX/copyMultipleStrategiesToSymbolSpot`, newData)
}
export const copyMultipleStrategiesToBotSpot = async (newData) => {
    return await api.post(`/spotOKX/copyMultipleStrategiesToBotSpot`, newData)
}
export const balanceWallet = async (data) => {
    return await api.post("/spotOKX/balanceWallet", data)
}

// Other V1
export const getSpotBorrowCheck = async ({ botListData,symbol }) => {
    return await api.post("/spotOKX/getSpotBorrowCheck", { botListData,symbol })
}