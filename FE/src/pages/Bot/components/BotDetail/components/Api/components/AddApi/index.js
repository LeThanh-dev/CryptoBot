import { FormControl, FormLabel, Switch, TextField } from "@mui/material";
import styles from "./AddApi.module.scss"
import { useForm } from "react-hook-form";
import { memo } from "react";
import DialogCustom from "../../../../../../../../components/DialogCustom";
import { addMessageToast } from "../../../../../../../../store/slices/Toast";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { updateBot } from "../../../../../../../../services/botService";

function AddApi({
    open,
    onClose,
    checkBot,
    botType
}, ref) {

    const { botID } = useParams()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const dispatch = useDispatch()

    const handleSubmitAddApi = async data => {

        try {

            const res = await updateBot({
                data: {
                    ...data,
                    ApiKey: data.ApiKey?.trim(),
                    SecretKey: data.SecretKey?.trim(),
                    type: "Api",
                    checkBot,
                    botType
                },
                id: botID
            })

            const { message, status } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            status === 200 && closeDialog(true)

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Add Api Error",
            }))
        }
    }

    const closeDialog = (dataChange = false) => {
        onClose({
            isOpen: false,
            dataChange
        })
        reset()
    }

    return (
        <DialogCustom
            open={open}
            onClose={() => { closeDialog() }}
            onSubmit={handleSubmit(handleSubmitAddApi)}
            dialogTitle="Add Api"
        >

            <form className={styles.dialogForm}>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>ApiKey</FormLabel>
                    <TextField
                        {...register("ApiKey", { required: true })}
                        size="small"
                    />
                    {errors.ApiKey?.type === 'required' && <p className="formControlErrorLabel">The ApiKey Required.</p>}

                </FormControl>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>SecretKey</FormLabel>
                    <TextField
                        {...register("SecretKey", { required: true })}
                        size="small"
                    />
                    {errors.SecretKey?.type === 'required' && <p className="formControlErrorLabel">The SecretKey Required.</p>}

                </FormControl>

                {botType == "OKX_V1" && <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Password</FormLabel>
                    <TextField
                        {...register("Password", { required: true })}
                        size="small"
                    />
                    {errors.Password?.type === 'required' && <p className="formControlErrorLabel">The Password Required.</p>}

                </FormControl>}

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>UTA</FormLabel>
                    <Switch
                        title="UTA"
                        {...register("UTA")}

                    />
                </FormControl>

            </form>
        </DialogCustom >
    );
}

export default memo(AddApi);