import api from "../../../../utils/api"

export const getPriceLimitCurrent = async (symbol) => {
    return await api.post("/positionByBitV3/getPriceLimitCurrent", {symbol})
}

export const getAllPosition = async (botListID) => {
    return await api.post("/positionByBitV3/getAllPosition", { botListID })
}

export const updatePL = async (botListID) => {
    return await api.post("/positionByBitV3/updatePL", { botListID })
}

export const closeMarket = async ({ positionData, Quantity }) => {
    return await api.post("/positionByBitV3/closeMarket", { positionData, Quantity })
}
export const closeLimit = async ({ positionData, Quantity, Price }) => {
    return await api.post("/positionByBitV3/closeLimit", { positionData, Quantity, Price })
}
export const closeAllPosition = async (botListID) => {
    return await api.post("/positionByBitV3/closeAllPosition", { botListID })
}

