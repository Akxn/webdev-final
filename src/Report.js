import React, { useEffect, useState } from 'react'
import axios from 'axios'
import jwt_decode from "jwt-decode";
import { BarChart, LineChart } from "./JsChart";
import {
    Chart,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
} from "chart.js";
Chart.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement
);
function Report({ id, accessToken, setAccessToken, refreshToken }) {
    const [reportTable, setReportTable] = useState("");

    useEffect(() => {
        const updateTable = (data) => {
            switch (id) {
                case 1:
                    var title = "Unique API users over the last 7 days";
                    var trackingDates = data.map((item) => item.tracking_date);
                    var userCount = data.map((item) => item.count);
                    var config = {
                        labels: trackingDates,
                        datasets: [
                            {
                                label: "Unique users",
                                data: userCount,
                                borderWidth: 1,
                                backgroundColor: ["#526760"],
                                borderColor: ["#374B4A"],
                            },
                        ],
                    };
                    return <LineChart data={config} title={title} />;
                case 2:
                    var title = "Top API users over the last 7 days";
                    var trackingDates = data.map((item) => item.user);
                    var userCount = data.map((item) => item.count);
                    var config = {
                        labels: trackingDates,
                        datasets: [
                            {
                                label: "API calls",
                                data: userCount,
                                borderWidth: 1,
                                backgroundColor: ["#526760"],
                                borderColor: ["#374B4A"],
                            },
                        ],
                    };
                    return <BarChart data={config} title={title} />;
                case 3:
                    var keysArray = Object.keys(data[0]);
                    return (
                        <table>
                            <thead>
                                <tr key="report-3-header">
                                    <th></th>
                                    {keysArray.map((key) => (
                                        <th colSpan="2" key={key}>
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                <tr key={`report-3-${1}`}>
                                    <td>1</td>
                                    {keysArray.map((key) => (
                                        <React.Fragment key={`report-3-${1}-${key}-user`}>
                                            <td>{data[0][key][0].user}</td>
                                            <td>{data[0][key][0].count}</td>
                                        </React.Fragment>
                                    ))}
                                </tr>
                                <tr key={`report-3-${2}`}>
                                    <td>2</td>
                                    {keysArray.map((key) => (
                                        <React.Fragment key={`report-3-${2}-${key}-user`}>
                                            <td>{data}</td>
                                            <td>{data[0][key][1].count}</td>
                                        </React.Fragment>
                                    ))}
                                </tr>
                                <tr key={`report-3-${3}`}>
                                    <td>3</td>
                                    {keysArray.map((key) => (
                                        <React.Fragment key={`report-3-${3}-${key}-user`}>
                                            <td>{data[0][key][2].user}</td>
                                            <td>{data[0][key][2].count}</td>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    );
                case 4:
                    console.log("case4", data)
                    var keysArray = Object.keys(data[0]);

                    return (
                        <table>
                            <thead>
                                <tr key="report-4-header">
                                    <th>Endpoint</th>
                                    <th>Error Code</th>
                                    <th>Message</th>
                                    <th>Count</th>
                                </tr>
                            </thead>

                            <tbody>
                                {keysArray.map((key) => (
                                    <React.Fragment key={`report-4-${key}`}>
                                        {data[0][key].map((item, index) => (
                                            <tr key={`report-4-${key}-${index}`}>
                                                <td
                                                    rowSpan={data[0][key].length}
                                                    style={{ display: index != 0 ? "none" : "" }}
                                                >
                                                    {key}
                                                </td>
                                                <td>{item.error_code}</td>
                                                <td>{item.message}</td>
                                                <td>{item.count}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    );
                case 5:
                    console.log("case5", data)
                    const options = {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                    };
                    return (
                        <table>
                            <thead>
                                <tr key="report-5-header">
                                    <th>Timestamp</th>
                                    <th>Endpoint</th>
                                    <th>Error Code</th>
                                    <th>Error Message</th>
                                    <th>User</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.map((item) => (
                                    <tr key={`report-5-${item.timestamp}`}>
                                        <td>
                                            {new Date(item.timestamp).toLocaleString(
                                                "en-us",
                                                options
                                            )}
                                        </td>
                                        <td>{item.endpoint}</td>
                                        <td>{item.response_code}</td>
                                        <td>{item.message}</td>
                                        <td>{item.user}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    );
                default:
                    return "No chart available";
            }
        };
        const start = async () => {
            try {
                console.log(accessToken);
                const res = await axiosJWT.get(`https://whateverbackend.onrender.com/report?id=${id}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken} Refresh ${refreshToken}`
                    }
                })
                const reportTable = updateTable(res.data);
                console.log(updateTable)
                setReportTable(reportTable);
            }
            catch (err) {
                console.log(err);
            }
        };
        start();
    }, [accessToken, refreshToken]);

    const refreshAccessToken = async () => {
        try {
            const res = await axios.post(
                `https://whateverbackend.onrender.com/requestNewAccessToken`,
                {},
                {
                    headers: {
                        authorization: "Bearer=" + accessToken + ";Refresh=" + refreshToken,
                    },
                }
            );
            return res.headers.authorization;
        } catch (err) {
            console.log(err);
        }
    };

    const axiosJWT = axios.create();

    axiosJWT.interceptors.request.use(
        async (config) => {
            let currentDate = new Date();
            const decodedToken = jwt_decode(accessToken);
            if (decodedToken.exp * 1000 < currentDate.getTime()) {
                const newToken = await refreshAccessToken();
                var newUserObj = JSON.parse(sessionStorage.getItem("user"));
                newUserObj.authToken = newToken;
                sessionStorage.setItem("user", JSON.stringify(newUserObj));
                config.headers["authorization"] = newToken;
                const newAccessToken = newToken.split(";")[0].replace("Bearer=", "");
                setAccessToken(newAccessToken);
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );



    return (
        <>
            <div> {reportTable && reportTable}</div>
        </>
    );
}

export default Report