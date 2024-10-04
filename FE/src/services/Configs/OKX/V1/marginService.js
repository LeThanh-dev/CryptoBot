import api from "../../../../utils/api"

// GET
export const getAllStrategiesSpot = async (botListInput) => {
    return await api.post("/marginOKX/getAllStrategiesSpot", { botListInput })
}
export const getAllSymbolSpot = async () => {
    return await api.get("/marginOKX/getAllSymbolSpot")
}

export const getFutureAvailable = async (botID) => {
    return await api.get(`/marginOKX/getFutureAvailable/${botID}`)
}

export const getTotalFutureByBot = async (userID) => {
    return await api.get(`/marginOKX/getTotalFutureByBot/${userID}`)
}

export const getSpotTotal = async (botID) => {
    return await api.get(`/marginOKX/getSpotTotal/${botID}`)
}

// CREATE
export const createStrategiesSpot = async (data) => {
    return await api.post("/marginOKX/createStrategiesSpot", data)
}

// UPDATE
export const updateStrategiesSpotByID = async ({ id, data }) => {
    return await api.put(`/marginOKX/updateStrategiesSpotByID/${id}`, data)
}
export const updateStrategiesMultipleSpot = async (data) => {
    return await api.post("/marginOKX/updateStrategiesMultipleSpot", data)
}
export const addToBookmarkSpot = async ({ symbolID }) => {
    return await api.put(`/marginOKX/addToBookmarkSpot/${symbolID}`)
}
export const removeToBookmarkSpot = async ({ symbolID }) => {
    return await api.put(`/marginOKX/removeToBookmarkSpot/${symbolID}`)
}

// DELETE
export const deleteStrategiesSpot = async (id) => {
    return await api.delete(`/marginOKX/deleteStrategiesSpot/${id}`)
}
export const deleteStrategiesItemSpot = async (data) => {
    return await api.post("/marginOKX/deleteStrategiesItemSpot", data)
}
export const deleteStrategiesMultipleSpot = async (data) => {
    return await api.post("/marginOKX/deleteStrategiesMultipleSpot", data)
}

// OTHER
export const syncSymbolSpot = async (listSymbolObject) => {
    return await api.post("/marginOKX/syncSymbolSpot",listSymbolObject)
}
export const copyMultipleStrategiesToSymbolSpot = async (newData) => {
    return await api.post(`/marginOKX/copyMultipleStrategiesToSymbolSpot`, newData)
}
export const copyMultipleStrategiesToBotSpot = async (newData) => {
    return await api.post(`/marginOKX/copyMultipleStrategiesToBotSpot`, newData)
}
export const balanceWallet = async (data) => {
    return await api.post("/marginOKX/balanceWallet", data)
}

export const getMarginBorrowCheck = async ({ botListData,symbol,positionSide }) => {
    return await api.post("/marginOKX/getMarginBorrowCheck", { botListData,symbol,positionSide })
}