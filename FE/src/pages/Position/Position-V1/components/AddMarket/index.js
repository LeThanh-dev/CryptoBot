import { FormControl, FormLabel, TextField, Select, MenuItem } from "@mui/material";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import DialogCustom from "../../../../../components/DialogCustom";
import { closeMarket } from "../../../../../services/positionV1Service";
import { addMessageToast } from "../../../../../store/slices/Toast";
import styles from "../../../../Bot/components/AddBot/AddBot.module.scss"
import { useState } from "react";


function AddMarket({
    onClose,
    positionData
}) {

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleSubmitLimit = async (data) => {
        setLoading(true)
        try {
            const res = await closeMarket({
                positionData: {
                    ...positionData,
                    Symbol: `${positionData.Symbol}USDT`,
                },
                Quantity: data.Quantity,
            })
            const { status, message } = res.data

            dispatch(addMessageToast({
                status,
                message,
            }))
            if (status === 200) {
                handleClose(true)
            }
        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Close Market Error",
            }))
        }
        setLoading(false)
    }

    const handleClose = (dataChange = false) => {
        onClose({
            isOpen: false,
            dataChange
        })
    }
    return (
        <DialogCustom
            loading={loading}
            dialogTitle="Close Market"
            open={true}
            onClose={() => { handleClose(false) }}
            onSubmit={handleSubmit(handleSubmitLimit)}
            reserveBtn
            submitBtnColor="warning"
        >
            <form className={styles.dialogForm}>
                {/* <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Price</FormLabel>
                    <TextField
                        {...register("Price", { required: true })}
                        type="number"
                        size="small"
                    />
                    {errors.Price && <p className="formControlErrorLabel">The Price field is required.</p>}

                </FormControl> */}
                <FormControl className={styles.formControl}>
                    <FormLabel className={styles.label}>Quantity</FormLabel>
                    <TextField
                        {...register("Quantity")}
                        type="number"
                        size="small"
                        defaultValue={positionData.MaxQty}
                    />
                    {errors.Quantity && <p className="formControlErrorLabel">The Quantity field is required.</p>}

                </FormControl>


            </form>
        </DialogCustom>
    );
}

export default AddMarket;