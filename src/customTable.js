import React from 'react';

const CustomTable = ({ id, header1, header2, header3, reportTable }) => {
    console.log(reportTable)
    const chartData = Object.values(reportTable);
    console.log(chartData);
    let rows = 1;

    if(id == 3){
    const dataArray = chartData.map(({ _id, topUser }) => ({
        id: _id,
        username: topUser.username,
        count: topUser.count,
    }));


    return (
        <div className="table-wrapper">
            <table className="table-container">
                    <thead>
                        <tr>
                        <th>{header1}</th>
                        <th>{header2}</th>
                        <th>{header3}</th>
                        </tr>
                </thead>
                    <tbody>
                        {dataArray.map((row, index) => (
                            <tr key={index}>
                                <td>{row.id}</td>
                                <td>{row.username}</td>
                                <td>{row.count}</td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    );
    }else if(id == 4){
        const dataArray = chartData.flatMap(({ _id, errors }) =>
            errors.map((error) => ({
                id: _id,
                status: error.status,
                count: error.count,
            }))
        );

        return (
            <div className="table-wrapper">
                <table className="table-container">
                    <thead>
                        <tr>
                            <th>{header1}</th>
                            <th>{header2}</th>
                            <th>{header3}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataArray.map((row, index) => (
                            <tr key={index}>
                                <td>{row.id}</td>
                                <td>{row.status}</td>
                                <td>{row.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }else if(id == 5){
        return (
            <div className="table-wrapper">
                <table className="table-container">
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>{header1}</th>
                            <th>{header2}</th>
                            <th>{header3}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chartData.map((row, index) => (
                            <tr key={index}>
                                <td>{row.endpoint}</td>
                                <td>{row.timestamp}</td>
                                <td>{row.method}</td>
                                <td>{row.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
};

export default CustomTable;