import { FormControl, FormLabel, TextField } from "@mui/material";
import styles from "./EditBot.module.scss"
import { useForm } from "react-hook-form";
import { memo, useRef } from "react";
import DialogCustom from "../../../../../../../../components/DialogCustom";
import { updateBot } from "../../../../../../../../services/botService";
import { useDispatch } from "react-redux";
import { addMessageToast } from "../../../../../../../../store/slices/Toast";


function EditBot({
    botData,
    open,
    onClose
}, ref) {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const dispatch = useDispatch();

    const newBotDataRef = useRef(false)

    const formDataChangeRef = useRef(false)

    const handleSubmitEditBot = async formData => {
        if (formDataChangeRef.current) {
            try {
                const telegramID = formData.telegramID?.trim()
                const telegramToken = formData.telegramToken?.trim()
                const checkTeleInfor = telegramID && telegramToken

                const res = await updateBot({
                    id: botData.id,
                    data: {
                        ...formData,
                        telegramTokenOld: botData.telegramTokenOld?.trim(),
                        telegramID,
                        telegramToken,
                        type: checkTeleInfor ? "telegram" : "",
                        checkBot: botData.Status === "Running" && botData.ApiKey,
                        botType: botData.botType
                    }
                })
                const { status, message } = res.data

                newBotDataRef.current = true

                dispatch(addMessageToast({
                    status: status,
                    message: message,
                }))
            }
            catch (err) {
                console.log(err);
                dispatch(addMessageToast({
                    status: 500,
                    message: "Update Bot Error",
                }))
            }
        }
        closeDialog()
    }

    const closeDialog = () => {
        onClose({
            isOpen: false,
            dataChange: newBotDataRef.current,
        })
        reset()
    }

    return (
        <DialogCustom
            open={open}
            onClose={closeDialog}
            onSubmit={handleSubmit(handleSubmitEditBot)}
            dialogTitle="Edit Bot"
        >

            <form className={styles.dialogForm} onChange={e => {
                formDataChangeRef.current = true
            }}>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Name</FormLabel>
                    <TextField
                        defaultValue={botData?.botName}
                        {...register("botName", { required: true, pattern: /\S/ })}
                        size="small"
                    />
                    {errors.botName && <p className="formControlErrorLabel">The Bot Name Required.</p>}

                </FormControl>
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Bot Note</FormLabel>
                    <TextField
                        defaultValue={botData?.note}
                        {...register("note",)}

                        size="small"
                    />
                    {/* {errors.note?.type === 'required' && <p className="formControlErrorLabel">The Bot Note Required.</p>} */}

                </FormControl>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Telegram Token</FormLabel>
                    <TextField
                        defaultValue={botData?.telegramToken}
                        {...register("telegramToken")}
                        size="small"
                    />

                </FormControl>

                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Telegram ID</FormLabel>
                    <TextField
                        defaultValue={botData?.telegramID}
                        {...register("telegramID")}
                        size="small"
                    />
                </FormControl>

            </form>
        </DialogCustom >
    );
}

export default memo(EditBot)