import Bot from "../pages/Bot"
import Strategies from "../pages/Configs/ByBit/V3/tabComponents/Config"
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
import StrategiesMargin from "../pages/Configs/ByBit/V1"
import Spot from "../pages/Configs/ByBit/V1/tabComponents/Spot"
import Margin from "../pages/Configs/ByBit/V1/tabComponents/Margin"
import Scanner from "../pages/Configs/ByBit/V1/tabComponents/Scanner"
import PositionV3 from "../pages/Position/ByBit/V3"
import StrategiesV3Tab from "../pages/Configs/ByBit/V3"
import ScannerV3 from "../pages/Configs/ByBit/V3/tabComponents/Scanner"
import { Outlet } from "react-router-dom"
import PositionV1 from "../pages/Position/ByBit/V1"
import StrategiesHistory from "../store/slices/StrategiesHistory"
import ConfigV1Tab from "../pages/Configs/OKX/V1"
import ConfigV3Tab from "../pages/Configs/OKX/V3"
import SpotOKX from "../pages/Configs/OKX/V1/tabComponents/Spot"
import ScannerV1OKX from "../pages/Configs/OKX/V1/tabComponents/Scanner"
import MarginOKX from "../pages/Configs/OKX/V1/tabComponents/Margin"
import InstrumentOKXV1 from "../pages/Instruments/OKX/V1"
import InstrumentsInfo from "../pages/Instruments/ByBit/V1"


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
                                                <ConfigV3Tab />
                                                <Strategies />
                                            </>,
                                    },
                                    {
                                        path: "Scanner",
                                        element:
                                            <>
                                                <ConfigV3Tab />
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
                                                <ConfigV1Tab />
                                                <SpotOKX />
                                            </>
                                    },
                                    {
                                        path: "Margin",
                                        element:
                                            <>
                                                <ConfigV1Tab />
                                                <MarginOKX />
                                            </>
                                    },
                                    {
                                        path: "Scanner",
                                        element:
                                            <>
                                                <ConfigV1Tab />
                                                <ScannerV1OKX />
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
                                element: <PositionV3 />
                            },
                            {
                                path: "V1",
                                element: <PositionV1 />
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
                                element: <PositionV3 />
                            },
                            {
                                path: "V1",
                                element: <PositionV1 />
                            },
                        ]
                    },

                ]
            },

            {
                path: "Instruments",
                element: <>
                    <Outlet />
                </>,
                children: [
                    {
                        path: "ByBit",
                        element: <InstrumentsInfo/>

                    },
                    {
                        path: "OKX",
                        element: <InstrumentOKXV1 />
                    },

                ]
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