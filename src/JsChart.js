import { Bar, Line } from "react-chartjs-2";

function CustomBarChart({ data, title }) {
  return (
    <Bar
      data={data}
      options={{
        plugins: {
          title: {
            display: true,
            text: title,
          },
          legend: {
            display: false,
          },
        },
      }}
    />
  );
}

function CustomLineChart({ data, title }) {
  return (
    <Line
      data={data}
      options={{
        plugins: {
          title: {
            display: true,
            text: title,
          },
          legend: {
            display: false,
          },
        },
      }}
    />
  );
}

export { CustomBarChart as BarChart, CustomLineChart as LineChart };
