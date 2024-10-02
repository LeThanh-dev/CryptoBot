import { FormControl, FormLabel, MenuItem, Select, TextField } from "@mui/material";
import styles from "./AddBot.module.scss"
import { useForm } from "react-hook-form";
import { memo, useEffect, useMemo, useState } from "react";
import DialogCustom from "../../../../components/DialogCustom";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../../../../services/userService";
import { addMessageToast } from "../../../../store/slices/Toast";
import { getAllGroup } from "../../../../services/groupService";

function EditUser({
    onClose,
    dataInput
}, ref) {

    const userData = useSelector(state => state.userDataSlice.userData)
    
    const ROLE_LIST = useMemo(() => {

        const ROLE_LIST = []

        const roleName = userData.roleName
        if (roleName === "SuperAdmin") {
            ROLE_LIST.push(
                "Admin",
                "ManagerTrader",
                "Trader"
            )
        }
        else if (roleName === "Admin") {
            ROLE_LIST.push(
                "ManagerTrader",
                "Trader"
            )
        }
        return ROLE_LIST
    }, [userData.roleName])

    const {
        register,
        unregister,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const dispatch = useDispatch();

    const [groupList, setGroupList] = useState([]);
    const [roleNameSelected, setRoleNameSelected] = useState(dataInput.roleName);


    const handleGetAllGroup = async () => {
        try {
            const res = await getAllGroup()
            const { status, data: resData } = res.data

            if (status === 200) {
                const newData = resData?.map(item => (
                    {
                        name: item.name,
                        value: item._id,
                    }
                ))
                setGroupList([
                    {
                        name: "None",
                        value: undefined
                    },
                    ...newData
                ])
            }
        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get All Group Error",
            }))
        }
    }

    const handleSubmitUpdateUser = async (newData) => {
        newData = {
            ...newData,
            oldGroupID: dataInput.groupID?._id,
            roleName: roleNameSelected,
            password: newData.password ? newData.password : undefined,
            groupID: newData.groupID ? newData.groupID : undefined,
        }

        try {
            const res = await updateUser({ userID: dataInput.id, newData })
            const { message, status } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            if (status === 200) {
                reset()
                closeDialog(true)
            }
            else {
                reset({
                    password: ""
                })
            }
        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: "Update User Error"
            }));
        }
    }


    const closeDialog = (dataChange = false) => {
        onClose({
            isOpen: false,
            dataChange
        })
        reset()
    }

    useEffect(() => {
        userData.userName &&   handleGetAllGroup()
    }, [userData.userName]);

    return (
        <DialogCustom
            open={true}
            onClose={() => { closeDialog() }}
            onSubmit={handleSubmit(handleSubmitUpdateUser)}
            dialogTitle="Edit User"
        >

            <form className={styles.dialogForm}>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Username</FormLabel>
                    <TextField
                        disabled
                        defaultValue={dataInput.userName}
                        size="small"
                        {...register("userName")}
                    />

                </FormControl>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Password</FormLabel>
                    <TextField
                        error={errors.password?.type === 'required'}
                        type="password"
                        size="small"
                        placeholder="**********"
                        {...register("password", { required: false, minLength: 5 })}
                    />
                    {errors.password?.type === 'minLength' && <p className="formControlErrorLabel">Minimum length is 5 characters.</p>}

                </FormControl>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Role</FormLabel>
                    <Select
                        size="small"
                        className={styles.select}
                        defaultValue={dataInput.roleName ? dataInput.roleName : ROLE_LIST[ROLE_LIST?.length - 1]}
                        onChange={e => {
                            const value = e.target.value;
                            value === "Admin" && unregister("groupID")
                            setRoleNameSelected(value)
                        }}
                    >
                        {
                            ROLE_LIST.map(item => (

                                <MenuItem value={item} key={item}>{item}</MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>

                {
                    roleNameSelected !== "Admin" && (
                        <FormControl className={styles.formControl}>
                            <FormLabel className={styles.label}>Group</FormLabel>
                            <Select
                                size="small"
                                className={styles.select}
                                defaultValue={dataInput.groupID?._id}
                                {...register("groupID")}
                            >
                                {
                                    groupList.map(item => (

                                        <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    )
                }

            </form>

        </DialogCustom >
    );
}

export default memo(EditUser)