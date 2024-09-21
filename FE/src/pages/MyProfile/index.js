import { Avatar, Button, FormControl, FormLabel, Tab, Tabs, TextField } from "@mui/material";
import avatar from "../../assets/avatar.jpg"
import avatarAdmin from "../../assets/admin.jpg"

import styles from "./MyProfile.module.scss"
import AddBreadcrumbs from "../../components/BreadcrumbsCutom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { changePassword } from "../../services/userService";
import { useDispatch, useSelector } from "react-redux";
import { addMessageToast } from "../../store/slices/Toast";


function MyProfile() {

    const userData = useSelector(state => state.userDataSlice.userData)

    const dispatch = useDispatch()

    const [tabNumber, setTabNumber] = useState("Overview");

    const handleChangeTab = (e, newValue) => {
        setTabNumber(newValue)
    }

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        watch
    } = useForm();

    const NewPassword = watch('NewPassword', '');

    const handleSubmitChangePassword = async data => {

        try {
            const res = await changePassword({
                ...data,
                userID: userData._id,
            })
            const { status, message } = res.data

            dispatch(addMessageToast({
                status: status,
                message: message,
            }))
            status === 200 && reset()
        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: "Change Password Error",
            }))
        }
    }

    const handleTabContent = () => {
        switch (tabNumber) {
            case "Overview":
                return (
                    <div className={styles.overview}>
                        <div className={styles.overviewHeader}>
                            <p className={styles.text}>Profile Details</p>
                        </div>

                        <div className={styles.overviewInfo}>
                            <div className={styles.overviewInfoList}>


                                <div className={styles.overviewInfoListItem}>
                                    <p className={styles.label}>User Name</p>
                                    <p>{userData?.userName || "User"}</p>
                                </div>

                                <div className={styles.overviewInfoListItem}>
                                    <p className={styles.label}>Role</p>
                                    <p>{userData?.roleName}</p>

                                </div>

                                <div className={styles.overviewInfoListItem}>
                                    <p className={styles.label}>Group</p>
                                    <p>{userData?.groupID?.name}</p>
                                </div>

                                {/* <div className={styles.overviewInfoListItem}>
                                    <p className={styles.label}>Bot Types</p>
                                    <p>BybitV3</p>
                                </div> */}
                            </div>

                        </div>
                    </div>
                )
            case "ChangePassword":
                return (
                    <form className={styles.overview}>

                        <div className={styles.overviewInfo}>
                            <div className={styles.overviewInfoList}>

                                <div className={styles.overviewInfoListItem} style={{ alignItems: "center" }}>
                                    <p className={styles.label} style={{ fontSize: "1.2rem" }}>OldPassword</p>
                                    <FormControl className={styles.formControl}>
                                        <TextField
                                            type="password"
                                            placeholder="Old Password"
                                            {...register("OldPassword", { required: true })}

                                            size="small"
                                        />
                                        {errors.OldPassword?.type === 'required' && <p className="formControlErrorLabel">The OldPassword Required.</p>}

                                    </FormControl>
                                </div>

                                <div className={styles.overviewInfoListItem} style={{ alignItems: "center" }}>
                                    <p className={styles.label} style={{ fontSize: "1.2rem" }}>NewPassword</p>
                                    <FormControl className={styles.formControl}>
                                        <TextField
                                            type="password"
                                            placeholder="New Password"
                                            {...register("NewPassword", { required: true, minLength: 5 })}

                                            size="small"
                                        />
                                        {errors.NewPassword?.type === 'required' && <p className="formControlErrorLabel">The NewPassword Required.</p>}
                                        {errors.NewPassword?.type === 'minLength' && <p className="formControlErrorLabel">Minimum length is 5 characters.</p>}

                                    </FormControl>
                                </div>

                                <div className={styles.overviewInfoListItem} style={{ alignItems: "center" }}>
                                    <p className={styles.label} style={{ fontSize: "1.2rem" }}>ConfirmPassword</p>
                                    <FormControl className={styles.formControl}>
                                        <TextField
                                            type="password"
                                            placeholder="Confirm Password"
                                            {...register("ConfirmPassword",
                                                {
                                                    required: true,
                                                    minLength: 5,
                                                    validate: value => value === NewPassword || "Password do not match"
                                                },
                                            )}

                                            size="small"
                                        />
                                        {errors.ConfirmPassword?.type === 'required' && <p className="formControlErrorLabel">The ConfirmPassword Required.</p>}
                                        {errors.ConfirmPassword?.type === 'validate' && <p className="formControlErrorLabel">{errors.ConfirmPassword.message}</p>}
                                        {errors.ConfirmPassword?.type === 'minLength' && <p className="formControlErrorLabel">Minimum length is 5 characters.</p>}

                                    </FormControl>
                                </div>
                            </div>

                        </div>

                        <Button
                            variant="contained"
                            style={{
                                margin: "24px auto 0",
                                display: "block"
                            }}
                            onClick={handleSubmit(handleSubmitChangePassword)}
                        >Change Password</Button>
                    </form>
                )
        }
    }
    return (
        <div className={styles.myProfile}>
            <AddBreadcrumbs list={["MyProfile"]} />
            <div className={styles.myProfileInfo}>
                <Avatar src={userData?.roleName !== "SuperAdmin" ? avatar : avatarAdmin} sx={{ width: 160, height: 160 }}
                />
                <p style={{
                    fontSize: "1.5rem",
                    fontWeight: 600,
                    margin: "16px 0 0"
                }}>{userData?.userName || "User"}</p>

                <p style={{
                    fontSize: "1.1rem",
                    fontWeight: 400,
                    opacity: ".8",
                    marginTop: "6px"
                }}>{userData?.roleName}</p>
            </div>
            <div className={styles.myProfileChange}>

                <Tabs value={tabNumber} onChange={handleChangeTab}>
                    <Tab label="Overview" value="Overview" ></Tab>
                    <Tab label="Change Password" value="ChangePassword"></Tab>
                </Tabs>
                <div style={{
                    marginTop: "24px"
                }}>
                    {handleTabContent()}
                </div>
            </div>
        </div>
    );
}

export default MyProfile;