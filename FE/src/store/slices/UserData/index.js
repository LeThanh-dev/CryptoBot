import { createSlice } from '@reduxjs/toolkit'

const userDataSlice = createSlice({
    name: 'userData',
    initialState: {
        userData: {
            "_id": "",
            "userName": "",
            "roleName": "",
            "roleList": [],
            "isActive": false,
        },
    },
    reducers: {

        setUserDataLocal: (state, action) => {
            state.userData = action.payload
        },

    }
})

export const { setUserDataLocal } = userDataSlice.actions
export default userDataSlice.reducer