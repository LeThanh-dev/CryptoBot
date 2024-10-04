import api from "../utils/api"

export const getAllBot = async () => {
    return await api.get("/bot/getAllBot")
}
export const getAllBotActive = async (botType) => {
    return await api.get(`/bot/getAllBotActive?botType=${botType}`)
}
export const getAllBotByUserID = async (userID) => {
    return await api.get(`/bot/getAllBotByUserID/${userID}`)
}
export const getAllBotActiveByUserID = async (userID, botType) => {
    return await api.get(`/bot/getAllBotActiveByUserID/${userID}?botType=${botType}`)
}
export const getAllBotOnlyApiKeyByUserID = async (userID, botType) => {
    return await api.get(`/bot/getAllBotOnlyApiKeyByUserID/${userID}?botType=${botType}`)
}
export const getAllBotByGroupCreatedByUserID = async () => {
    return await api.post(`/bot/getAllBotByGroupCreatedByUserID`)
}
export const getAllBotBySameGroup = async (groupID) => {
    return await api.get(`/bot/getAllBotBySameGroup/${groupID}`)
}
export const getBotByID = async (botID) => {
    return await api.get(`/bot/${botID}`)
}
export const createBot = async (data) => {
    return await api.post("/bot", data)
}
export const updateBot = async ({ id, data }) => {
    return await api.put(`/bot/${id}`, data)
}
export const deleteBot = async (botID, botType) => {
    return await api.delete(`/bot/${botID}?botType=${botType}`)
}

export const deleteMultipleBot = async (botIDList, botType) => {
    return await api.post(`/bot/deleteMultipleBot?botType=${botType}`, botIDList)
}

export const setMargin = async (botData) => {
    return await api.post(`/bot/setMargin`, botData)
}
export const setLever = async (data) => {
    return await api.post(`/bot/setLever`, data)
}
