import api from "../utils/api"

// GET

export const getAllInstrumentsInfo = async () => {
    return await api.get("/instrumentsInfo/getAll")
}

// OTHER
export const syncInstrumentsInfo = async () => {
    return await api.get("/instrumentsInfo/sync")
}
