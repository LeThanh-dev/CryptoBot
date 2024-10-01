import { useEffect, useState } from "react";
import { getAllUserByUserIDList, getAllUserWithoutGroup } from "../../../../services/userService";
import DialogCustom from "../../../../components/DialogCustom";
import { Checkbox, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import styles from "./AddMember.module.scss"

function AddMember({
    onClose,
    userListSelected,
    editState = false
}) {

    const tableColumns = [

        { field: 'stt', headerName: 'STT' },
        { field: 'userName', headerName: 'Name' },
        { field: 'role', headerName: 'Role' },
    ]

    const [dataTableSelected, setDataTableSelected] = useState(userListSelected ? userListSelected : []);
    const [userList, setUserList] = useState([]);


    const handleGetAllUser = async () => {
        try {
            const res = await getAllUserWithoutGroup()
            const { status, message, data: resData } = res.data
            let newDataAll = []
            if (editState) {
                const resOld = await getAllUserByUserIDList(userListSelected.map(item => item.userID))
                const { status, message, data: resOldData } = resOld.data
                status === 200 && (newDataAll = newDataAll.concat(resOldData))
            }
            const newData = resData.map(item => ({ ...item, isAdmin: false }))
            newDataAll = newDataAll.concat(newData)

            status === 200 && setUserList(newDataAll)
        } catch (error) {

        }
    }


    const closeDialog = () => {
        onClose({
            isOpen: false,
            dataChange: dataTableSelected
        })
    }

    useEffect(() => {
        handleGetAllUser()
    }, []);

    return (
        <DialogCustom
            dialogTitle="Add Member"
            open={true}
            onClose={closeDialog}
            onSubmit={closeDialog}
            maxWidth="sm"
        >

            <Table className={styles.addMember}>
                <TableHead>
                    <TableRow>
                        <TableCell style={{ padding: 0, width: "60px" }}>
                            <Checkbox
                                checked={userList.length !== 0 && dataTableSelected.length === userList.length}
                                onClick={(e) => {
                                    const checked = e.target.checked;
                                    if (checked) {
                                        setDataTableSelected(dataTableSelected => userList.map(data => {
                                            const itemExists = dataTableSelected.find(item => item.userID === data._id)
                                            if (itemExists) {
                                                return itemExists
                                            }
                                            return {
                                                userID: data._id,
                                                isAdmin: false
                                            }
                                        }))
                                    }
                                    else {
                                        setDataTableSelected([])
                                    }
                                }}
                            />
                        </TableCell>
                        {tableColumns.map((column) => (
                            <TableCell key={column.field} style={{ fontWeight: "bold" }}>
                                {column.headerName}
                            </TableCell>
                        ))}
                        <TableCell
                            style={{ fontWeight: "bold" }}>
                            <p>Admin</p>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {userList.length > 0
                        ?
                        userList.map((user, index) => (
                            <TableRow key={user._id}>
                                <TableCell style={{ padding: 0, }}>
                                    <Checkbox
                                        checked={dataTableSelected.findIndex(item => item.userID === user._id) > -1}
                                        onClick={(e) => {
                                            const checked = e.target.checked;
                                            if (checked) {
                                                setDataTableSelected(dataTableSelected => [
                                                    ...dataTableSelected,
                                                    {
                                                        userID: user._id,
                                                        isAdmin: false
                                                    }
                                                ])
                                            }
                                            else {
                                                setDataTableSelected(dataTableSelected => dataTableSelected.filter(item => item.userID !== user._id))
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    {index + 1}
                                </TableCell>
                                <TableCell>
                                    {user.userName}
                                </TableCell>
                                <TableCell>
                                    {user.roleName}
                                </TableCell>
                                <TableCell>
                                    {
                                        dataTableSelected.find(item => item.userID === user._id) &&
                                        <Checkbox
                                            checked={dataTableSelected.find(item => item.userID === user._id).isAdmin}
                                            onClick={(e) => {
                                                const checked = e.target.checked;
                                                setDataTableSelected(dataTableSelected => dataTableSelected.map(item => {
                                                    if (item.userID === user._id) {
                                                        return {
                                                            userID: user._id,
                                                            isAdmin: checked
                                                        }
                                                    }
                                                    return item
                                                }))
                                            }}
                                        />
                                    }
                                </TableCell>
                            </TableRow>
                        ))
                        :
                        <p style={{
                            textAlign: "center",
                            marginTop: "16px",
                            fontWeight: 500
                        }}>No data</p>
                    }
                </TableBody>
            </Table>
        </DialogCustom>
    );
}

export default AddMember;