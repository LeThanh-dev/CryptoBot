import { FormControl, FormLabel, MenuItem, Select, TextField } from "@mui/material";
import styles from "./AddBot.module.scss"
import { useForm } from "react-hook-form";
import { memo, useRef } from "react";
import DialogCustom from "../../../../components/DialogCustom";
import { createBot } from "../../../../services/botService";
import { useDispatch } from "react-redux";
import { addMessageToast } from "../../../../store/slices/Toast";

const botTypeList = [
    {
        name: "BybitV3",
        value: "BybitV3"
    }
]

function AddBot({
    open,
    onClose,
    roleName
}, ref) {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const dispatch = useDispatch();

    const newBotDataRef = useRef()

    const checkRoleNameAdmin = ()=>{
        return roleName === "Admin" || roleName === "SuperAdmin"
    }

    const handleSubmitAddBot = async formData => {

        try {
            const res = await createBot({
                ...formData,
                Status: checkRoleNameAdmin() ? "Stopped" : "Pending",
            })

            const { message, data: resData, status } = res.data

            resData && (newBotDataRef.current = resData)
            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Add Bot Error",
            }))
        }
        closeDialog()
    }

    const closeDialog = () => {
        onClose({
            isOpen: false,
            dataChange: newBotDataRef.current
        })
        reset()
    }

    return (
        <DialogCustom
            open={open}
            onClose={closeDialog}
            onSubmit={handleSubmit(handleSubmitAddBot)}
            dialogTitle="Add Bot"
        >

            <form className={styles.dialogForm}>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Name</FormLabel>
                    <TextField
                        {...register("botName", { required: true, pattern: /\S/ })}

                        size="small"
                    />
                    {errors.botName && <p className="formControlErrorLabel">The Bot Name field is required.</p>}

                </FormControl>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Bot Type</FormLabel>
                    <Select
                        defaultValue={botTypeList[0].value}
                        size="small"
                        {...register("botType", { required: true })}
                    >
                        {
                            botTypeList.map(item => (
                                <MenuItem value={item.value} key={item.value}>{item.name}</MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Note</FormLabel>
                    <TextField
                        placeholder="Note"
                        multiline
                        rows={3}
                        {...register("note")}
                        size="small"
                    />
                </FormControl>

            </form>
        </DialogCustom >
    );
}

export default memo(AddBot)