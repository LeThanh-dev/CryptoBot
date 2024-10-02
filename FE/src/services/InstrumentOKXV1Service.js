import api from "../utils/api"

// GET

export const getAllInstrumentOKXV1 = async () => {
    return await api.get("/InstrumentOKXV1/getAll")
}

// OTHER
export const syncInstrumentOKXV1 = async () => {
    return await api.get("/InstrumentOKXV1/sync")
}
