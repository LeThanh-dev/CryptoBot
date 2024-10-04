import api from "../../../../utils/api"

// GET

export const getAllStrategiesSpot = async (botListInput) => {
    return await api.post("/spot/getAllStrategiesSpot", { botListInput })
}
export const getAllSymbolSpot = async () => {
    return await api.get("/spot/getAllSymbolSpot")
}

export const getFutureAvailable = async (botID) => {
    return await api.get(`/spot/getFutureAvailable/${botID}`)
}

export const getTotalFutureByBot = async (userID) => {
    return await api.get(`/spot/getTotalFutureByBot/${userID}`)
}

export const getSpotTotal = async (botID) => {
    return await api.get(`/spot/getSpotTotal/${botID}`)
}

// CREATE
export const createStrategiesSpot = async (data) => {
    return await api.post("/spot/createStrategiesSpot", data)
}

// UPDATE
export const updateStrategiesSpotByID = async ({ id, data }) => {
    return await api.put(`/spot/updateStrategiesSpotByID/${id}`, data)
}
export const updateStrategiesMultipleSpot = async (data) => {
    return await api.post("/spot/updateStrategiesMultipleSpot", data)
}
export const addToBookmarkSpot = async ({ symbolID }) => {
    return await api.put(`/spot/addToBookmarkSpot/${symbolID}`)
}
export const removeToBookmarkSpot = async ({ symbolID }) => {
    return await api.put(`/spot/removeToBookmarkSpot/${symbolID}`)
}

// DELETE
export const deleteStrategiesSpot = async (id) => {
    return await api.delete(`/spot/deleteStrategiesSpot/${id}`)
}
export const deleteStrategiesItemSpot = async (data) => {
    return await api.post("/spot/deleteStrategiesItemSpot", data)
}
export const deleteStrategiesMultipleSpot = async (data) => {
    return await api.post("/spot/deleteStrategiesMultipleSpot", data)
}

// OTHER
export const syncSymbolSpot = async () => {
    return await api.get("/spot/syncSymbolSpot")
}
export const copyMultipleStrategiesToSymbolSpot = async (newData) => {
    return await api.post(`/spot/copyMultipleStrategiesToSymbolSpot`, newData)
}
export const copyMultipleStrategiesToBotSpot = async (newData) => {
    return await api.post(`/spot/copyMultipleStrategiesToBotSpot`, newData)
}
export const balanceWallet = async (data) => {
    return await api.post("/spot/balanceWallet", data)
}

// Other V1
export const getSpotBorrowCheck = async ({ botListData,symbol }) => {
    return await api.post("/spot/getSpotBorrowCheck", { botListData,symbol })
}