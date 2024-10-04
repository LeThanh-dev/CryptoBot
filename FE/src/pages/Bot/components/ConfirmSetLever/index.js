import { FormControl, FormLabel, TextField } from "@mui/material";
import styles from "./AddBot.module.scss"
import { useForm } from "react-hook-form";
import { memo } from "react";
import DialogCustom from "../../../../components/DialogCustom";
import { setLever } from "../../../../services/botService";
import { useDispatch } from "react-redux";
import { addMessageToast } from "../../../../store/slices/Toast";

function ConfirmSetLever({
    onClose,
    setLoadingSetMargin,
    botData,
    loading
}, ref) {


    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const dispatch = useDispatch();


    const handleSetLever = async (data) => {
        setLoadingSetMargin(botData._id)
        try {
            const res = await setLever({
                botData,
                password:data.password
            })
            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Set Lever Error",
            }))
        }
        setLoadingSetMargin("")
    }

 

    return (
        <DialogCustom
            open={true}
            onClose={onClose}
            onSubmit={handleSubmit(handleSetLever)}
            dialogTitle="Required"
            loading = {loading}
            hideCloseBtn
        >

            <form className={styles.dialogForm}>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Password</FormLabel>
                    <TextField
                        {...register("password", {
                            required: true,
                        })}
                        size="small"
                    />
                    {errors.password?.type === "required" && <p className="formControlErrorLabel">The Password Required.</p>}

                </FormControl>
            </form>
        </DialogCustom >
    );
}

export default memo(ConfirmSetLever)