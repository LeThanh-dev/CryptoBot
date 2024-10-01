import api from "../utils/api"

export const getAllUser = async () => {
  return await api.get(`/user/getAllUser`)
}
export const getAllUserLowerGroup = async () => {
  return await api.get(`/user/getAllUserLowerGroup`)
}
export const getAllUserWithoutGroup = async () => {
  return await api.get(`/user/getAllUserWithoutGroup`)
}

export const getUserByID = async (roleName) => {
  return await api.get(`/user/getUserByID/${roleName}`)
}
export const getAllUserByGroupID = async (groupIDList) => {
  return await api.post(`/user/getAllUserByGroupID`, groupIDList)
}
export const getAllUserByRoleName = async ({ roleName, groupID }) => {
  return await api.post(`/user/getAllUserByRoleName`, { roleName, groupID })
}

export const getAllUserByUserIDList = async (list) => {
  return await api.post(`/user/getAllUserByUserIDList`, list)
}

export const changePassword = async (data) => {
  return await api.post("/user/changePassword", data)
}
export const createNewUser = async (data) => {
  return await api.post("/user/createNewUser", data)
}
export const updateUser = async ({ userID, newData }) => {
  return await api.post(`/user/updateUser/${userID}`, { newData })
}
export const deleteUser = async (data) => {
  return await api.post(`/user/deleteUser`, data)
}