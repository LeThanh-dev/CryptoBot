import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Heading from "./components/Heading";
import SideBar from "./components/SideBar";
import styles from "./Mainlayout.module.scss"
import { Helmet } from "react-helmet";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { memo, useEffect, useState } from "react";
import clsx from "clsx";
import { useDispatch, useSelector } from "react-redux";
import { Breadcrumbs, Typography } from "@mui/material";
import { verifyLogin } from "../../services/authService";
import { getByRoleName } from "../../services/roleService";
import { getUserByID } from "../../services/userService";
import { addMessageToast } from "../../store/slices/Toast";
import { removeLocalStorage } from "../../functions";

function MainLayout({ children }) {

    const linkList = [
        {
            linK: "/Bots",
            name: "Bots",
            icon: <SmartToyIcon className={styles.icon} />
        },
        {
            linK: "/Strategies",
            name: "Strategies",
            icon: <LocalMallIcon className={styles.icon} />
        },

        {
            linK: "/Positions",
            name: "Positions",
            icon: <ViewInArIcon className={styles.icon} />
        },

    ]

    const location = useLocation()

    const dispatch = useDispatch()

    const [marginLeft, setMarginLeft] = useState(window.innerWidth <= 740 ? "" : "300px");
    const [userData, setUserData] = useState("");
    const [roleList, setRoleList] = useState([]);

    const { listBreadcrumbs } = useSelector(state => state.breadcrumbsSlice)

    const getRouteName = () => (
        location.pathname.split("/")[1]
    )


    const toggleSidebar = () => {
        setMarginLeft(marginLeft ? "" : "300px")
    }

    const handleBreadcrumbs = () => {
        return <Breadcrumbs
            aria-label="breadcrumb"
            style={{
                fontWeight: 450,
                marginBottom: "12px"
            }}
        >

            {
                listBreadcrumbs.map((value, index) => {
                    if (index === 0) {
                        return <Link
                            to="/"
                            style={{ fontSize: ".9rem", opacity: .5 }}
                            key={index}
                        >
                            Home
                        </Link>
                    }
                    else if (index === listBreadcrumbs.length - 1) {
                        return <Typography
                            color="text.primary"
                            style={{
                                color: "black",
                                opacity: ".8",
                                fontSize: ".9rem"
                            }}
                            key={index}
                        >{value}</Typography>

                    }
                    else {
                        return <Link
                            to={`/${value}`}
                            style={{ fontSize: ".9rem", opacity: .5 }}
                            key={index}
                        >
                            {value}
                        </Link>
                    }
                })
            }

        </Breadcrumbs>
    }

    const navigate = useNavigate()

    const handleVerifyLogin = async () => {
        try {
            await verifyLogin()
            getRoleList()
        } catch (error) {
            removeLocalStorage()
            navigate("/login")
        }
    }

    const getRoleList = async () => {
        try {
            let userData = JSON.parse(localStorage.getItem("user"))
            const resUser = await getUserByID(userData?._id)
            const { status, message, data: resUserData } = resUser.data
            if (resUserData) {
                localStorage.setItem('user', JSON.stringify(resUserData))
                setUserData(resUserData)

                userData = JSON.parse(localStorage.getItem("user"))
                const res = await getByRoleName(userData?.roleName || "")
                const { status, message, data: resData } = res.data
                localStorage.setItem("roleList", JSON.stringify(resData.roleList || []))

                setRoleList(resData.roleList || [])
            }

        } catch (error) {
            localStorage.setItem("roleList", JSON.stringify([]))
            dispatch(addMessageToast({
                status: 500,
                message: "Get Role User Error",
            }))

        }
    }

    useEffect(() => {
        handleVerifyLogin()

    }, []);





    useEffect(() => {
        window.innerWidth <= 740 && setMarginLeft("")
        window.scrollTo(0, 0)
    }, [location]);

    return (
        <div
            className={styles.mainlayout}
            style={{
                "--marginLeft": marginLeft
            }}
        >
            <Helmet title={`${getRouteName() || "Dashboard"} - Trading Bot`} />
            <div className={styles.heading}>
                <Heading
                    toggleSidebar={toggleSidebar}
                    userData={userData}
                />
            </div>
            <div
                className={styles.body}
                onClick={() => {
                    window.innerWidth <= 740 && setMarginLeft("")
                }}>
                <SideBar
                    openSidebar={marginLeft}
                    roleList={roleList}
                />
                <div className={styles.content}>
                    <div className={styles.contentMain}>
                        <div className={styles.title}>
                            <p style={{
                                fontSize: "1.5rem",
                                fontWeight: "500",
                                color: "#012970",
                                marginBottom: "6px"
                            }}>{getRouteName()}</p>
                            {
                                <div role="presentation"  >
                                    {location.pathname !== "/" && (
                                        handleBreadcrumbs()
                                    )}
                                </div>
                            }
                        </div>
                        <div style={{
                            backgroundColor: "white",
                            padding: "12px",
                            borderRadius: "5px",
                            boxShadow: "0px 0 30px rgba(1, 41, 112, 0.1)"
                        }}>
                            <Outlet />
                        </div>
                    </div>
                    <div className={styles.footer}>
                        © Copyright <b>FOMO LAND</b>. All Rights Reserved
                    </div>
                </div>
            </div>

            <div className={styles.footerLink}>
                {
                    linkList.map(item => (

                        <NavLink
                            className={({ isActive }) => clsx(styles.footerLinkItem, isActive ? styles.active : undefined)}
                            to={item.linK}
                            key={item.linK}
                        >
                            {item.icon}
                            <p className={styles.footerLinkItemName}>{item.name}</p>
                        </NavLink>
                    ))
                }
            </div>

        </div>
    );
}

export default memo(MainLayout);