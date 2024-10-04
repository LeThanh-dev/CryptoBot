import { FormControl, FormLabel, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import styles from "../../../../../Bot/components/AddBot/AddBot.module.scss"
import DialogCustom from "../../../../../../components/DialogCustom";
import { closeLimit, getPriceLimitCurrent } from "../../../../../../services/Positions/ByBIt/V1/positionService";
import { addMessageToast } from "../../../../../../store/slices/Toast";


function AddLimit({
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
    const [priceCurrent, setPriceCurrent] = useState(0);
    const dispatch = useDispatch();

    const handleSubmitLimit = async (data) => {
        setLoading(true)
        try {
            const res = await closeLimit({
                positionData: {
                    ...positionData,
                    Symbol: `${positionData.Symbol}USDT`,
                },
                Quantity: data.Quantity,
                Price: priceCurrent,

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

    const handleGetPriceCurrent = async () => {
        try {
            const symbol = positionData.Symbol
            const res = await getPriceLimitCurrent(`${symbol}USDT`)
            const { status, message, data: resData } = res.data
            if (status === 200) {
                setPriceCurrent(resData)
            }

            dispatch(addMessageToast({
                status,
                message,
            }))

        }
        catch (err) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get Price Current Error",
            }))
        }
    }
    useEffect(() => {
        handleGetPriceCurrent()
    }, []);

    return (
        <DialogCustom
            loading={loading}
            dialogTitle="Close Limit"
            open={true}
            onClose={() => { handleClose(false) }}
            onSubmit={handleSubmit(handleSubmitLimit)}
            reserveBtn
            submitBtnColor="warning"
        >
            {
                <form className={styles.dialogForm}>
                    <FormControl className={styles.formControl}>
                        <FormLabel className={styles.label}>Price</FormLabel>
                        <TextField
                            {...register("Price", { required: true })}
                            type="number"
                            size="small"
                            value={priceCurrent}
                            onChange={e => {
                                setPriceCurrent(e.target.value)
                            }}
                        />
                        {errors.Price && <p className="formControlErrorLabel">The Price Required.</p>}

                    </FormControl>
                    <FormControl className={styles.formControl}>
                        <FormLabel className={styles.label}>Quantity</FormLabel>
                        <TextField
                            {...register("Quantity")}
                            type="number"
                            size="small"
                            defaultValue={Math.abs(positionData.Quantity)}
                        />
                        {errors.Quantity && <p className="formControlErrorLabel">The Quantity Required.</p>}

                    </FormControl>
                </form>
            }
        </DialogCustom>
    );
}

export default AddLimit;