import api from "../../../../utils/api"

// GET
export const getAllStrategiesSpot = async (botListInput) => {
    return await api.post("/margin/getAllStrategiesSpot", { botListInput })
}
export const getAllSymbolSpot = async () => {
    return await api.get("/margin/getAllSymbolSpot")
}

export const getFutureAvailable = async (botID) => {
    return await api.get(`/margin/getFutureAvailable/${botID}`)
}

export const getTotalFutureByBot = async (userID) => {
    return await api.get(`/margin/getTotalFutureByBot/${userID}`)
}

export const getSpotTotal = async (botID) => {
    return await api.get(`/margin/getSpotTotal/${botID}`)
}

// CREATE
export const createStrategiesSpot = async (data) => {
    return await api.post("/margin/createStrategiesSpot", data)
}

// UPDATE
export const updateStrategiesSpotByID = async ({ id, data }) => {
    return await api.put(`/margin/updateStrategiesSpotByID/${id}`, data)
}
export const updateStrategiesMultipleSpot = async (data) => {
    return await api.post("/margin/updateStrategiesMultipleSpot", data)
}
export const addToBookmarkSpot = async ({ symbolID }) => {
    return await api.put(`/margin/addToBookmarkSpot/${symbolID}`)
}
export const removeToBookmarkSpot = async ({ symbolID }) => {
    return await api.put(`/margin/removeToBookmarkSpot/${symbolID}`)
}

// DELETE
export const deleteStrategiesSpot = async (id) => {
    return await api.delete(`/margin/deleteStrategiesSpot/${id}`)
}
export const deleteStrategiesItemSpot = async (data) => {
    return await api.post("/margin/deleteStrategiesItemSpot", data)
}
export const deleteStrategiesMultipleSpot = async (data) => {
    return await api.post("/margin/deleteStrategiesMultipleSpot", data)
}

// OTHER
export const syncSymbolSpot = async () => {
    return await api.get("/margin/syncSymbolSpot")
}
export const copyMultipleStrategiesToSymbolSpot = async (newData) => {
    return await api.post(`/margin/copyMultipleStrategiesToSymbolSpot`, newData)
}
export const copyMultipleStrategiesToBotSpot = async (newData) => {
    return await api.post(`/margin/copyMultipleStrategiesToBotSpot`, newData)
}
export const balanceWallet = async (data) => {
    return await api.post("/margin/balanceWallet", data)
}

export const getMarginBorrowCheck = async ({ botListData,symbol,positionSide }) => {
    return await api.post("/margin/getMarginBorrowCheck", { botListData,symbol,positionSide })
}