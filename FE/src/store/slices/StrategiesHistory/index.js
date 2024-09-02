import { createSlice } from '@reduxjs/toolkit'

const StrategiesHistorySlice = createSlice({
    name: 'StrategiesHistory',
    initialState: {
        dataList: []
    },
    reducers: {

        setStrategiesHistoryData: (state, action) => {
            state.dataList.unshift({
                data: action.payload,
                timeCreated: new Date().toLocaleTimeString()
            })
        },

    }
})

export const { setStrategiesHistoryData } = StrategiesHistorySlice.actions
export default StrategiesHistorySlice.reducer