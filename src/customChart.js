import React, { useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js/auto';
Chart.register(...registerables);

const CustomChart = ({ id, reportTable }) => {
    const chartRef = useRef();

    const chartData = Object.entries(reportTable);
    console.log(chartData);

    let labels, label, graphData;
    if(id == 1){
        labels = chartData.map((row, index) => row[1]._id);
        label = "Unique Users by Hour";
        graphData = chartData.map((row, index) => row[1].users.length);
    }else if (id == 2){
        labels = chartData.map((row, index) => row[1]._id.date);
        label = "Top API Users by Hour"
        graphData = chartData.map((row, index) => row[1].count);
    }

    const data = {
        labels: labels,
        datasets: [
            {
                label: label,
                data: graphData,
                backgroundColor: 'rgba(253, 203, 110, 0.4)',
                borderColor: 'rgba(253, 203, 110, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return <Bar ref={chartRef} data={data} options={options}/>;
};

export default CustomChart;