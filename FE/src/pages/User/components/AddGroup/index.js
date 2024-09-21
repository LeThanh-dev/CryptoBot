import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { FormControl, FormLabel, InputAdornment, MenuItem, Select, Switch, TextField } from "@mui/material";
import styles from "./AddBot.module.scss"
import { useForm } from "react-hook-form";
import { memo, useEffect, useMemo, useState } from "react";
import DialogCustom from "../../../../components/DialogCustom";
import { useDispatch, useSelector } from "react-redux";
import { createNewUser } from "../../../../services/userService";
import { addMessageToast } from "../../../../store/slices/Toast";
import { getAllGroup } from "../../../../services/groupService";

function AddGroup({
    onClose,
    groupSelected
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
    const [roleNameSelected, setRoleNameSelected] = useState(false);

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

    const handleSubmitAddGroup = async (data) => {
        data = {
            ...data,
            userName: data.userName?.trim(),
            roleName: roleNameSelected,
            groupID: data.groupID ? data.groupID : undefined
        }
        try {
            const res = await createNewUser(data);
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
                message: "Create User Error"
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
        userData.userName &&  handleGetAllGroup()
    }, [userData.userName]);

    return (
        <DialogCustom
            open={true}
            onClose={() => { closeDialog() }}
            onSubmit={handleSubmit(handleSubmitAddGroup)}
            dialogTitle="Add User"
        >

            <form className={styles.dialogForm}>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Username</FormLabel>
                    <TextField
                        error={errors.userName?.type === 'required'}
                        size="small"
                        {...register("userName", { required: true, minLength: 5 })}
                    />
                    {errors.userName?.type === 'required' && <p className="formControlErrorLabel">The Username Required.</p>}
                    {errors.userName?.type === 'minLength' && <p className="formControlErrorLabel">Minimum length is 5 characters.</p>}

                </FormControl>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Password</FormLabel>
                    <TextField
                        error={errors.password?.type === 'required'}
                        type="password"
                        size="small"
                        {...register("password", { required: true, minLength: 5 })}
                        InputProps={{
                            endAdornment:
                                <InputAdornment
                                    position="end"
                                    style={{
                                        cursor: "pointer"
                                    }}
                                    onClick={e => {
                                        const typeCurrent = e.currentTarget.parentElement.querySelector("input")
                                        typeCurrent.type === "password" ? (typeCurrent.type = "text") : (typeCurrent.type = "password")
                                    }}
                                >
                                    <RemoveRedEyeIcon />
                                </InputAdornment>,
                        }}
                    />
                    {errors.password?.type === 'required' && <p className="formControlErrorLabel">The Password Required.</p>}
                    {errors.password?.type === 'minLength' && <p className="formControlErrorLabel">Minimum length is 5 characters.</p>}

                </FormControl>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Role</FormLabel>
                    <Select
                        size="small"
                        className={styles.select}
                        defaultValue={ROLE_LIST[ROLE_LIST?.length - 1]}
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
                                defaultValue={groupSelected !== "All" ? groupSelected : ""}
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

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Active</FormLabel>
                    <Switch
                        {...register("isActive",)}
                    />
                </FormControl>

            </form>

        </DialogCustom >
    );
}

export default memo(AddGroup)