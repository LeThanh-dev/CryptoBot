import Bot from "../pages/Bot"
import Strategies from "../pages/StrategiesV3Tab/tabComponents/StrategiesV3"
import Coin from "../pages/Coin"
import Order from "../pages/Order"
import MainLayout from "../layout/Mainlayout"
import NotFound from "../pages/NotFound"
import BotDetail from "../pages/Bot/components/BotDetail"
import MyProfile from "../pages/MyProfile"
import LoginPage from "../pages/LoginPage"
import Group from "../pages/Group"
import BotType from "../pages/BotType"
import User from "../pages/User"
import Dashboard from "../pages/Dashboard"
import StrategiesMargin from "../pages/StrategiesMargin"
import Spot from "../pages/StrategiesMargin/tabComponents/Spot"
import Margin from "../pages/StrategiesMargin/tabComponents/Margin"
import Scanner from "../pages/StrategiesMargin/tabComponents/Scanner"
import PositionV3 from "../pages/Position/Position-V3"
import PositionV1 from "../pages/Position/Position-V1"
import StrategiesHistory from "../pages/StrategiesHistory"
import InstrumentsInfo from "../pages/InstrumentsInfo"
import StrategiesV3Tab from "../pages/StrategiesV3Tab"
import ScannerV3 from "../pages/StrategiesV3Tab/tabComponents/ScannerV3"
import { Outlet } from "react-router-dom"


const routeList = [
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                path: "",
                element: <Dashboard />,
            },
            {
                path: "Users",
                element: <User />,
            },
            {
                path: "Groups",
                element: <Group />,
            },
            {
                path: "Bots",
                element: <Bot />,
            },
            {
                path: "BotTypes",
                element: <BotType />,
            },
            {
                path: "Bots",
                element: <>
                    <Outlet />
                </>,
                children: [
                    {
                        path: ":botID",
                        element: <BotDetail />,
                    }
                ]
            },
            {
                path: "Configs",
                element: <>
                    <Outlet />
                </>,
                children: [
                    {
                        path: "ByBit",
                        element: <>
                            <Outlet />
                        </>,
                        children: [
                            {
                                path: "V3",
                                element: <>
                                    <Outlet />
                                </>,
                                children: [
                                    {
                                        path: "Config",
                                        element:
                                            <>
                                                <StrategiesV3Tab />
                                                <Strategies />
                                            </>,
                                    },
                                    {
                                        path: "Scanner",
                                        element:
                                            <>
                                                <StrategiesV3Tab />
                                                <ScannerV3 />
                                            </>,
                                    },
                                    {
                                        path: "ConfigHistory",
                                        element: <StrategiesHistory />,
                                    },
                                ]
                            },
                            {
                                path: "V1",
                                element: <>
                                    <Outlet />
                                </>,
                                children: [
                                    {
                                        path: "Spot",
                                        element:
                                            <>
                                                <StrategiesMargin />
                                                <Spot />
                                            </>
                                    },
                                    {
                                        path: "Margin",
                                        element:
                                            <>
                                                <StrategiesMargin />
                                                <Margin />
                                            </>
                                    },
                                    {
                                        path: "Scanner",
                                        element:
                                            <>
                                                <StrategiesMargin />
                                                <Scanner />
                                            </>
                                    },
                                ]
                            }
                        ]
                    },
                    {
                        path: "OKX",
                        element: <>
                            <Outlet />
                        </>,
                        children: [
                            {
                                path: "V3",
                                element: <>
                                    <Outlet />
                                </>,
                                children: [
                                    {
                                        path: "Config",
                                        element:
                                            <>
                                                <StrategiesV3Tab />
                                                <Strategies />
                                            </>,
                                    },
                                    {
                                        path: "Scanner",
                                        element:
                                            <>
                                                <StrategiesV3Tab />
                                                <ScannerV3 />
                                            </>,
                                    },
                                    {
                                        path: "ConfigHistory",
                                        element: <StrategiesHistory />,
                                    },
                                ]
                            },
                            {
                                path: "V1",
                                element: <>
                                    <Outlet />
                                </>,
                                children: [
                                    {
                                        path: "Spot",
                                        element:
                                            <>
                                                <StrategiesMargin />
                                                <Spot />
                                            </>
                                    },
                                    {
                                        path: "Margin",
                                        element:
                                            <>
                                                <StrategiesMargin />
                                                <Margin />
                                            </>
                                    },
                                    {
                                        path: "Scanner",
                                        element:
                                            <>
                                                <StrategiesMargin />
                                                <Scanner />
                                            </>
                                    },
                                ]
                            }
                        ]
                    },

                ]
            },

            {
                path: "Positions",
                element: <>
                    <Outlet />
                </>,
                children: [
                    {
                        path: "ByBit",
                        element: <>
                            <Outlet />
                        </>,
                        children: [
                            {
                                path: "V3",
                                element:<PositionV3/>
                            },
                            {
                                path: "V1",
                                element:<PositionV1/>
                            },
                        ]
                    },
                    {
                        path: "OKX",
                        element: <>
                            <Outlet />
                        </>,
                        children: [
                            {
                                path: "V3",
                                element:<PositionV3/>
                            },
                            {
                                path: "V1",
                                element:<PositionV1/>
                            },
                        ]
                    },

                ]
            },

            {
                path: "InstrumentsInfo",
                element: <InstrumentsInfo />,
            },
            {
                path: "Coin",
                element: <Coin />,
            },
            {
                path: "Order",
                element: <Order />,
            },
            {
                path: "MyProfile",
                element: <MyProfile />,
            },

        ]
    },
    {
        path: "login",
        element: <LoginPage />,
    },
    {
        path: "*",
        element: <NotFound />,
    },

]

export default routeList