import ControlCameraIcon from '@mui/icons-material/ControlCamera';
import RadarIcon from '@mui/icons-material/Radar';
import PermDataSettingIcon from '@mui/icons-material/PermDataSetting';
import PaymentsIcon from '@mui/icons-material/Payments';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import GridViewIcon from '@mui/icons-material/GridView';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import GroupsIcon from '@mui/icons-material/Groups';
import { NavLink } from "react-router-dom"
import clsx from "clsx";
import styles from "./SideBar.module.scss"
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Collapse } from '@mui/material';
import { useState } from 'react';


function SideBar({
    openSidebar,
    roleList
}, ref) {


    const [openAll, setOpenAll] = useState({
        config: {
            state: false,
            children: {
                ByBit: false,
                OKX: false,
            }
        },
        position: {
            state: false,
            children: {
                ByBit: false,
                OKX: false,
            }
        },
    });

    const linkList = [

        {
            link: "/Users",
            name: "Users",
            icon: <PersonIcon className={styles.icon} />
        },
        {
            link: "/Groups",
            name: "Groups",
            icon: <GroupsIcon className={styles.icon} />
        },
        {
            link: "/Bots",
            name: "Bots",
            icon: <SmartToyIcon className={styles.icon} />
        },
        {
            link: "/BotTypes",
            name: "BotTypes",
            icon: <PrecisionManufacturingIcon className={styles.icon} />
        },
        {
            name: "Config",
            icon: <PermDataSettingIcon className={styles.icon} />,
            open: openAll.config.state,
            openFunc: () => {
                setOpenAll(data => {
                    const newData = { ...data }
                    newData.config.state = !newData.config.state
                    return newData
                })
            },
            children: [
                {
                    link: "ByBit",
                    name: "ByBit",
                    icon: <ShoppingCartIcon className={styles.icon} />,
                    open: openAll.config.children.ByBit,
                    openFunc: () => {
                        setOpenAll(data => {
                            const newData = { ...data }
                            newData.config.children.ByBit = !newData.config.children.ByBit
                            return newData
                        })
                    },
                    children: [
                        {
                            link: "/Spot",
                            name: "V1",
                            icon: <ShoppingCartIcon className={styles.icon} />
                        },
                        {
                            link: "/ConfigV3",
                            name: "V3",
                            icon: <LocalMallIcon className={styles.icon} />
                        },
                    ]
                },
                {
                    link: "OKX",
                    name: "OKX",
                    icon: <ShoppingCartIcon className={styles.icon} />,
                    open: openAll.config.children.OKX,
                    openFunc: () => {
                        setOpenAll(data => {
                            const newData = { ...data }
                            newData.config.children.OKX = !newData.config.children.OKX
                            return newData
                        })
                    },
                    children: [
                        {
                            link: "/Spot",
                            name: "V1",
                            icon: <ShoppingCartIcon className={styles.icon} />
                        },
                        {
                            link: "/ConfigV3",
                            name: "V3",
                            icon: <LocalMallIcon className={styles.icon} />
                        },
                    ]
                },

            ]
        },

        {
            name: "Positions",
            icon: <ControlCameraIcon className={styles.icon} />,
            open: openAll.position.state,
            openFunc: () => {
                setOpenAll(data => {
                    const newData = { ...data }
                    newData.position.state = !newData.position.state
                    return newData
                })
            },
            children: [
                {
                    link: "/PositionV1",
                    name: "V1",
                    icon: <RadarIcon className={styles.icon} />
                },
                {
                    link: "/PositionV3",
                    name: "V3",
                    icon: <ViewInArIcon className={styles.icon} />
                },
            ]
        },
        {
            link: "/Coin",
            name: "Coin",
            icon: <CurrencyExchangeIcon className={styles.icon} />
        },
        {
            link: "/InstrumentsInfo",
            name: "InstrumentsInfo",
            icon: <PaymentsIcon className={styles.icon} />
        },
        // {
        //     link: "/Order",
        //     name: "Order",
        //     icon: <CreditCardIcon className={styles.icon} />
        // },
    ]


    const renderRouterHasChildren = (item) => {
        return <div key={item.link}>
            <div
                className={styles.sidebarItem}
                onClick={item.openFunc}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}
            >
                <div style={{
                    display: "flex",
                    alignItems: "center"
                }}>
                    {item.icon}
                    <p className={styles.sidebarItemName}>{item.name}</p>
                </div>
                {item.open ? <ExpandLess /> : <ExpandMore />}
            </div>
            <Collapse in={item.open} timeout="auto" unmountOnExit>
                <div style={{ paddingLeft: "16px" }}>
                    {item.children.map(child => {
                        if (roleList.includes(`${child?.link?.replace("/", "")}`)) {

                            if (child.children?.length) {
                                return renderRouterHasChildren(child)
                            }
                            else {
                                if (roleList.includes(`${child.link.replace("/", "")}`)) {
                                    return <div key={child.link}>
                                        {
                                            roleList.includes(child.link.replace("/", "")) && <NavLink
                                                className={({ isActive }) => clsx(styles.sidebarItem, isActive ? styles.active : undefined)}
                                                to={child.link}
                                            >
                                                {child.icon}
                                                <p className={styles.sidebarItemName}>{child.name}</p>
                                            </NavLink>
                                        }
                                    </div>
                                }
                            }
                        }
                    })}
                </div>
            </Collapse>
        </div>
    }

    return (
        <div
            className={styles.sidebar}
            style={{
                transform: openSidebar ? undefined : "translateX(-100%)"
            }}
            onClick={e => {
                e.preventDefault();
                e.stopPropagation()
            }}
        >

            <NavLink
                className={({ isActive }) => clsx(styles.sidebarItem, isActive ? styles.active : undefined)}
                to={"/"}
                key={"/"}
            >
                <GridViewIcon className={styles.icon} />
                <p className={styles.sidebarItemName}>Dashboard</p>
            </NavLink>
            {
                linkList.map(item => {
                    if (item.children?.length) {
                        return renderRouterHasChildren(item)
                    }
                    else {
                        return <div key={item.link}>
                            {
                                roleList.includes(item.link.replace("/", "")) && <NavLink
                                    className={({ isActive }) => clsx(styles.sidebarItem, isActive ? styles.active : undefined)}
                                    to={item.link}
                                >
                                    {item.icon}
                                    <p className={styles.sidebarItemName}>{item.name}</p>
                                </NavLink>
                            }
                        </div>
                    }

                })
            }

        </div >
    );
}

export default SideBar;