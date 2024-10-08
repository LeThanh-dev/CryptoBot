import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
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
import { NavLink, useLocation } from "react-router-dom"
import clsx from "clsx";
import styles from "./SideBar.module.scss"
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Collapse, Menu, MenuItem, Popover } from '@mui/material';
import { useState } from 'react';
import bybitIcon from "../../../../assets/bybit-logo.png"
import OKXIcon from "../../../../assets/okx_logo.svg"

function SideBar({
    openSidebar,
    roleList
}, ref) {


    const [openAll, setOpenAll] = useState({
        Config: {
            open: false,
            children: {
                ByBit: "",
                OKX: "",
            }
        },
        Position: {
            open: false,
            children: {
                ByBit: "",
                OKX: "",
            }
        },
        Coins: {
            open: false,
            children: {
                ByBit: "",
                OKX: "",
            }
        },
        Instruments: {
            open: false,
            children: {
                ByBit: "",
                OKX: "",
            }
        },
    });

    const linkList = [

        {
            link: "Users",
            name: "Users",
            icon: <PersonIcon className={styles.icon} />
        },
        {
            link: "Groups",
            name: "Groups",
            icon: <GroupsIcon className={styles.icon} />
        },
        {
            link: "Bots",
            name: "Bots",
            icon: <SmartToyIcon className={styles.icon} />
        },
        {
            link: "BotTypes",
            name: "BotTypes",
            icon: <PrecisionManufacturingIcon className={styles.icon} />
        },
        {
            link: "Configs",
            name: "Configs",
            icon: <PermDataSettingIcon className={styles.icon} />,
            open: openAll.Config.open,
            openFunc: () => {
                setOpenAll(data => {
                    const newData = { ...data }
                    newData.Config.open = !newData.Config.open
                    return newData
                })
            },
            children: [
                {
                    link: "Configs/ByBit",
                    name: "ByBit",
                    // icon: <RadarIcon className={styles.icon} />,
                    icon: <img src={bybitIcon} width={"24px"} />,
                    open: openAll.Config.children.ByBit,
                    openFunc: (target) => {
                        setOpenAll(data => {
                            const newData = { ...data }
                            newData.Config.children.ByBit = target
                            return newData
                        })
                    },
                    children: [
                        {
                            link: "Configs/ByBit/V1/Spot",
                            name: "V1",
                        },
                        {
                            link: "Configs/ByBit/V3/Config",
                            name: "V3",
                        },
                    ]
                },
                {
                    link: "Configs/OKX",
                    name: "OKX",
                    icon: <img src={OKXIcon} width={"24px"} />,
                    open: openAll.Config.children.OKX,
                    openFunc: (target) => {
                        setOpenAll(data => {
                            const newData = { ...data }
                            newData.Config.children.OKX = target
                            return newData
                        })
                    },
                    children: [
                        {
                            link: "Configs/OKX/V1/Spot",
                            name: "V1",
                        },
                        {
                            link: "Configs/OKX/V3/Config",
                            name: "V3",
                        },
                    ]
                },

            ]
        },

        {
            link: "Positions",
            name: "Positions",
            icon: <ControlCameraIcon className={styles.icon} />,
            open: openAll.Position.open,
            openFunc: () => {
                setOpenAll(data => {
                    const newData = { ...data }
                    newData.Position.open = !newData.Position.open
                    return newData
                })
            },
            children: [
                {
                    link: "Positions/ByBit",
                    name: "ByBit",
                    icon: <img src={bybitIcon} width={"24px"} />,
                    open: openAll.Position.children.ByBit,
                    openFunc: (target) => {
                        setOpenAll(data => {
                            const newData = { ...data }
                            newData.Position.children.ByBit = target
                            return newData
                        })
                    },
                    children: [
                        {
                            link: "Positions/ByBit/V1",
                            name: "V1",
                        },
                        {
                            link: "Positions/ByBit/V3",
                            name: "V3",
                        },
                    ]
                },
                {
                    link: "Positions/OKX",
                    name: "OKX",
                    icon: <img src={OKXIcon} width={"24px"} />,
                    open: openAll.Position.children.OKX,
                    openFunc: (target) => {
                        setOpenAll(data => {
                            const newData = { ...data }
                            newData.Position.children.OKX = target
                            return newData
                        })
                    },
                    children: [
                        {
                            link: "Positions/OKX/V1",
                            name: "V1",
                        },
                        {
                            link: "Positions/OKX/V3",
                            name: "V3",
                        },
                    ]
                },

            ]
        },

        {
            link: "Coins",
            name: "Coins",
            icon: <CurrencyExchangeIcon className={styles.icon} />,
            open: openAll.Coins.open,
            openFunc: () => {
                setOpenAll(data => {
                    const newData = { ...data }
                    newData.Coins.open = !newData.Coins.open
                    return newData
                })
            },
            children: [
                {
                    link: "Coins/ByBit",
                    name: "ByBit",
                    icon: <RadarIcon className={styles.icon} />,
                },
                {
                    link: "Coins/OKX",
                    name: "OKX",
                    icon: <ViewInArIcon className={styles.icon} />,
                },

            ]
        },
        {
            link: "Instruments",
            name: "Instruments",
            icon: <PaymentsIcon className={styles.icon} />,
            open: openAll.Instruments.open,
            openFunc: () => {
                setOpenAll(data => {
                    const newData = { ...data }
                    newData.Instruments.open = !newData.Instruments.open
                    return newData
                })
            },
            children: [
                {
                    link: "Instruments/ByBit",
                    name: "ByBit",
                    icon: <RadarIcon className={styles.icon} />,
                },
                {
                    link: "Instruments/OKX",
                    name: "OKX",
                    icon: <ViewInArIcon className={styles.icon} />,
                },

            ]
        },
        // {
        //     link: "/Order",
        //     name: "Order",
        //     icon: <CreditCardIcon className={styles.icon} />
        // },
    ]

    const location = useLocation()

    const checkRoleList = link => {
        return roleList?.includes(link)
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
                    if (item.children?.length && checkRoleList(item.link)) {
                        return <div key={item.link} >
                            <div
                                className={clsx(styles.sidebarItem, location.pathname.includes(item.link) && styles.active)}
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
                                        if (roleList.includes(`${child.link}`)) {

                                            if (child.children?.length && checkRoleList(child.link)) {
                                                return <>
                                                    <div
                                                        className={clsx(styles.sidebarItem, location.pathname.includes(child.link) && styles.active)}
                                                        onClick={e => {
                                                            child.openFunc(e.currentTarget)
                                                        }}
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
                                                            {child.icon}
                                                            <p className={styles.sidebarItemName}>{child.name}</p>
                                                        </div>
                                                        <KeyboardArrowRightIcon />
                                                    </div>
                                                    <Popover
                                                        open={child.open}
                                                        anchorEl={child.open}
                                                        onClose={() => {
                                                            child.openFunc("")
                                                        }}
                                                        anchorOrigin={{
                                                            vertical: 'top',
                                                            horizontal: 'right',
                                                        }}
                                                        sx={{
                                                            ".MuiPopover-paper": {
                                                                boxShadow: "0 5px 25px 0 #60606033"
                                                            }
                                                        }}
                                                    >
                                                        {child.children.map(childItem => (
                                                            checkRoleList(childItem.link) && <NavLink
                                                                className={({ isActive }) => clsx(styles.sidebarItem, isActive ? styles.active : undefined)}
                                                                to={childItem.link}
                                                                style={{ margin: 0 }}
                                                                onClick={() => {
                                                                    child.openFunc("")
                                                                }}
                                                            >
                                                                {childItem.name}
                                                            </NavLink>
                                                        ))}
                                                    </Popover>
                                                </>
                                            }
                                            else {
                                                if (checkRoleList(child.link)) {
                                                    return <div key={child.link}>
                                                        {
                                                            roleList.includes(child.link) && <NavLink
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
                    else {
                        return <div key={item.link}>
                            {
                                checkRoleList(item.link) && <NavLink
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