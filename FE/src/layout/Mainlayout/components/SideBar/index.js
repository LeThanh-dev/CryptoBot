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
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { Link, NavLink } from "react-router-dom"
import clsx from "clsx";
import styles from "./SideBar.module.scss"
import { ExpandLess, ExpandMore, StarBorder } from '@mui/icons-material';
import { Collapse, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
import { useState } from 'react';


function SideBar({
    openSidebar,
    roleList
}, ref) {


    const linkList = [

        {
            linK: "/Users",
            name: "Users",
            icon: <PersonIcon className={styles.icon} />
        },
        {
            linK: "/Groups",
            name: "Groups",
            icon: <GroupsIcon className={styles.icon} />
        },
        {
            linK: "/Bots",
            name: "Bots",
            icon: <SmartToyIcon className={styles.icon} />
        },
        {
            linK: "/BotTypes",
            name: "BotTypes",
            icon: <PrecisionManufacturingIcon className={styles.icon} />
        },
        {
            name: "Strategies",
            icon: <PermDataSettingIcon className={styles.icon} />,
            children: [
                {
                    linK: "/Spot",
                    name: "V1",
                    icon: <ShoppingCartIcon className={styles.icon} />
                },
                {
                    linK: "/Strategies",
                    name: "V3",
                    icon: <LocalMallIcon className={styles.icon} />
                },
            ]
        },
        // {
        //     linK: "/Spot",
        //     name: "Strategies V1",
        //     icon: <ShoppingCartIcon className={styles.icon} />
        // },
        // {
        //     linK: "/Strategies",
        //     name: "Strategies V3",
        //     icon: <LocalMallIcon className={styles.icon} />
        // },
        {
            linK: "/Coin",
            name: "Coin",
            icon: <CurrencyExchangeIcon className={styles.icon} />
        },
        {
            linK: "/PositionV3",
            name: "Positions",
            icon: <ViewInArIcon className={styles.icon} />
        },
        {
            linK: "/InstrumentsInfo",
            name: "InstrumentsInfo",
            icon: <PaymentsIcon className={styles.icon} />
        },
        {
            linK: "/Order",
            name: "Order",
            icon: <CreditCardIcon className={styles.icon} />
        },
    ]
    const [openGroup1, setOpenGroup1] = useState(false);
    const handleGroup1Click = () => {
        setOpenGroup1(!openGroup1);
    };
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
                        return <div key={item.linK}>
                            <div
                                className={styles.sidebarItem}
                                onClick={handleGroup1Click}
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
                                {openGroup1 ? <ExpandLess /> : <ExpandMore />}
                            </div>
                            <Collapse in={openGroup1} timeout="auto" unmountOnExit>
                                <div style={{ paddingLeft: "20px" }}>
                                    {item.children.map(child => (
                                        <NavLink
                                            className={({ isActive }) => clsx(styles.sidebarItem, isActive ? styles.active : undefined)}
                                            to={child.linK}
                                        >
                                            {child.icon}
                                            <p className={styles.sidebarItemName}>{child.name}</p>
                                        </NavLink>
                                    ))}
                                </div>
                            </Collapse>
                        </div>
                    }
                    else {
                        return <div key={item.linK}>
                            {
                                roleList.includes(item.linK.replace("/", "")) && <NavLink
                                    className={({ isActive }) => clsx(styles.sidebarItem, isActive ? styles.active : undefined)}
                                    to={item.linK}
                                >
                                    {item.icon}
                                    <p className={styles.sidebarItemName}>{item.name}</p>
                                </NavLink>
                            }
                        </div>
                    }
                })
            }

            {/* {
                
                  <>
                    <ListItem  onClick={handleGroup1Click}>
                        <ListItemText primary="Strategies" />
                        {openGroup1 ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={openGroup1} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItem  component={Link} to="/route1">
                                <ListItemText primary="Route 1" />
                            </ListItem>
                            <ListItem  component={Link} to="/route2">
                                <ListItemText primary="Route 2" />
                            </ListItem>
                        </List>
                    </Collapse>
                  </>
            } */}

        </div >
    );
}

export default SideBar;