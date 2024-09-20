import FingerprintIcon from '@mui/icons-material/Fingerprint';
import DialogCustom from "../../../../../../components/DialogCustom";
import { useEffect, useState } from "react";
import DataGridCustom from "../../../../../../components/DataGridCustom";
import { useDispatch, useSelector } from "react-redux";
import { addMessageToast } from "../../../../../../store/slices/Toast";
import { getAllUserByRoleName } from "../../../../../../services/userService";
import { Button } from "@mui/material";
import { loginSwitch } from '../../../../../../services/authService';
import { useNavigate } from 'react-router-dom';
import { setUserDataLocal } from '../../../../../../store/slices/UserData';

function SwitchUserModal({
    onClose
}) {

    const userData = useSelector(state => state.userDataSlice.userData)

    const roleName = userData?.roleName

    const tableColumns = [

        {
            field: 'Action',
            headerName: 'Switch',
            maxWidth: 100,
            minWidth: 100,
            type: "actions",
            renderCell: (params) => {
                const rowData = params.row; // Dữ liệu của hàng hiện tại
                const userID = rowData["id"]
                const userName = rowData["userName"]

                return (
                    <span
                        style={{
                            color: "var(--blueLightColor)",
                            lineHeight: "100%",
                            cursor: "pointer"
                        }}
                        onClick={() => {
                            handleSwitchUser({
                                userID,
                                userName
                            })
                        }}
                    >
                        <FingerprintIcon style={{ fontSize: "1.7rem" }} />
                    </span>
                )
            },

        },
        {
            field: 'userName',
            headerName: 'Name',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1
        },
        {
            field: 'roleName',
            headerName: 'Role',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1
        },
        {
            field: 'groupName',
            headerName: 'Group',
            minWidth: 150,
            flex: window.innerWidth <= 740 ? undefined : 1
        },

    ]
    const [userList, setUserList] = useState([]);
    const dispatch = useDispatch()
    const navigate = useNavigate()


    const handleGetAllUserByRoleName = async () => {
        try {

            const res = await getAllUserByRoleName({
                roleName,
                groupID: userData?.groupID
            })
            const { status, data: resData } = res.data
            if (status === 200) {
                const newData = resData?.map(item => (
                    {
                        ...item,
                        groupName: item?.groupID?.name,
                        id: item._id,
                    }
                ))
                setUserList(newData)
            }
        } catch (error) {
            console.log(error);
            dispatch(addMessageToast({
                status: 500,
                message: "Get All User Switch Error",
            }))
        }
    }

    const handleSwitchUser = async ({
        userID,
        userName
    }) => {
        try {
            const res = await loginSwitch({
                userID,
                userName
            });
            const { message, data: resData, status } = res.data
            dispatch(addMessageToast({
                status: status,
                message: message,
            }))

            if (status === 200) {
                navigate("/")
                navigate(0)
                localStorage.setItem('tk_crypto_temp', resData.token)
                console.log(resData.user);
                
                setTimeout(()=>{
                    dispatch(setUserDataLocal(resData.user))
                },500)
            }
        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: error.message
            }));
        }
    }


    useEffect(() => {
        userData.userName && userData.roleName !== "Trader" && handleGetAllUserByRoleName()
    }, [userData.userName]);

    return (
        <DialogCustom
            open={true}
            backdrop
            dialogTitle='Switch User'
            onClose={onClose}
            submitBtnText='Switch'
            onSubmit={handleSwitchUser}
            hideActionBtn
            maxWidth="sm"
        >
            {localStorage.getItem("tk_crypto_temp") && <Button
                variant='contained'
                style={{
                    margin: '6px auto 16px',
                    width: "fit-content",
                }}
                onClick={() => {
                    localStorage.removeItem("tk_crypto_temp")
                    navigate("/")
                    navigate(0)
                }}
            >
                Back To Main Account
            </Button>}
            {userData.roleName !== "Trader" && <DataGridCustom
                tableRows={userList}
                tableColumns={tableColumns}
                checkboxSelection={false}
            />}
        </DialogCustom>
    );
}

export default SwitchUserModal;