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
import { useDispatch } from "react-redux";
import { Breadcrumbs, Typography } from "@mui/material";
import { verifyLogin } from "../../services/authService";
import { getByRoleName } from "../../services/roleService";
import { getUserByID } from "../../services/userService";
import { addMessageToast } from "../../store/slices/Toast";
import { removeLocalStorage } from "../../functions";
import { setUserDataLocal } from "../../store/slices/UserData";

function MainLayout({ children }) {

    const ROLE_LIST_DEFAULT = [
        "Bots",
        "Configs",
        "Configs/ByBit",
        "Configs/ByBit/V3",
        "Configs/ByBit/V3/Config",
        "Configs/ByBit/V3/ConfigHistory",
        // "Configs/ByBit/V3/Scanner",
        // "Configs/ByBit/V1",
        // "Configs/ByBit/V1/Spot",
        // "Configs/ByBit/V1/Margin",
        // "Configs/ByBit/V1/Scanner",
        // "Configs/OKX",
        // "Configs/OKX/V3",
        // "Configs/OKX/V3/Config",
        // "Configs/OKX/V3/Scanner",
        // "Configs/OKX/V1",
        // "Configs/OKX/V1/Spot",
        // "Configs/OKX/V1/Margin",
        // "Configs/OKX/V1/Scanner",
        "Positions",
        "Positions/ByBit",
        "Positions/ByBit/V3",
        // "Positions/ByBit/V1",
        // "Positions/OKX",
        // "Positions/OKX/V3",
        // "Positions/OKX/V1",
        "Coins",
        "Coins/ByBit",
        "Order",
        "Positions",
        // "Instruments",
        // "Instruments/ByBit",
        // "Instruments/OKX",
    ]

    const linkList = [
        {
            linK: "Bots",
            name: "Bots",
            icon: <SmartToyIcon className={styles.icon} />
        },
        {
            linK: "Configs/ByBit/V3/Config",
            name: "ConfigV3",
            icon: <LocalMallIcon className={styles.icon} />
        },

        {
            linK: "Positions/ByBit/V3",
            name: "PositionsV3",
            icon: <ViewInArIcon className={styles.icon} />
        },

    ]

    const location = useLocation()
    const navigate = useNavigate()

    const dispatch = useDispatch()

    const [marginLeft, setMarginLeft] = useState(window.innerWidth <= 740 ? "" : "300px");
    const [userData, setUserData] = useState("");
    const [roleList, setRoleList] = useState([]);


    const getRouteName = () => (
        location.pathname.split("/")[1]
    )


    const toggleSidebar = () => {
        setMarginLeft(marginLeft ? "" : "300px")
    }

    const locationPathSplit = location.pathname.split("/")


    const renderLinkBreadcrumbs = (item) => {
        const path = locationPathSplit.slice(0, locationPathSplit.indexOf(item) + 1).join('/');
        return `${path}`;
    };


    const handleBreadcrumbs = () => {
        return <Breadcrumbs
            aria-label="breadcrumb"
            style={{
                fontWeight: 450,
                marginBottom: "12px"
            }}
        >

            {
                location.pathname.split("/").map((value, index) => {
                    if (index === 0) {
                        return <Link
                            to="/"
                            style={{ fontSize: ".9rem", opacity: .5 }}
                            key={index}
                        >
                            Home
                        </Link>
                    }
                    else if (index === locationPathSplit.length - 1) {
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
                            to={renderLinkBreadcrumbs(value)}
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

    const handleVerifyLogin = async () => {
        try {
            const res = await verifyLogin()
            const userData = res.data.data
            getRoleList(userData._id)
        } catch (error) {
            removeLocalStorage()
            navigate("/login")
        }
    }

    const getRoleList = async (userID) => {
        try {

            const resUser = await getUserByID(userID)

            const { data: resUserData } = resUser.data
            if (resUserData) {

                setUserData(resUserData)

                const res = await getByRoleName(resUserData?.roleName || "")
                const { data: resData } = res.data

                const newRoleList = resData.roleList.concat(ROLE_LIST_DEFAULT)

                const routeCurrent = location.pathname.replace("/", "")

                if (!newRoleList.includes(routeCurrent) && routeCurrent) {
                    navigate("404")
                }
                setRoleList(newRoleList || [])
                dispatch(setUserDataLocal({
                    ...resUserData,
                    roleList: newRoleList
                }))

            }

        } catch (error) {
            dispatch(addMessageToast({
                status: 500,
                message: "Get Role User Error",
            }))
            removeLocalStorage()
            navigate("/login")
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
            <Helmet title={`${getRouteName() || "Dashboard"} | CyberBot`} />
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
                                marginBottom: "6px",
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
                        © Copyright <b>CYBER TEAM</b>. All Rights Reserved
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