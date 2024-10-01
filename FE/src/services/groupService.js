import api from "../utils/api"

export const getAllGroup = async () => {
    return await api.get("/group/getAll")
}

export const getGroupByUserIDCreated = async (userID) => {
    return await api.get(`/group/getGroupByUserIDCreated/${userID}`)
}
export const getGroupByID = async (groupID) => {
    return await api.get(`/group/getGroupByID/${groupID}`)
}
export const createGroup = async (data) => {
    return await api.post("/group/create", data)
}

export const updateGroup = async ({groupID,data}) => {
    return await api.put(`/group/update/${groupID}`, data)
}
export const deleteMultipleGroup = async (groupID) => {
    return await api.post(`/group/deleteMultiple`,groupID)
}