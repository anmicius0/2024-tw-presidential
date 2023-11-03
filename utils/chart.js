const calculateMovingAverage = (polls, windowSize = 7) => {
  // Group polls by date
  const groupedPolls = polls.reduce((acc, poll) => {
    (acc[poll.date] = acc[poll.date] || []).push(poll);
    return acc;
  }, {});

  // Calculate the daily average for each option
  const dailyAverages = Object.entries(groupedPolls).map(
    ([date, datePolls]) => {
      const sums = datePolls.reduce((sum, poll) => {
        ["dpp", "kmt", "tpp", "gtm", "undecided"].forEach((key) => {
          sum[key] = (sum[key] || 0) + poll[key];
        });
        return sum;
      }, {});

      const averages = { date: date.split("T")[0] }; // Format date to 'yyyy-mm-dd'
      ["dpp", "kmt", "tpp", "gtm", "undecided"].forEach((key) => {
        averages[key] = sums[key] / datePolls.length;
      });

      return averages;
    },
  );

  // Sort by date
  dailyAverages.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate the moving average
  const movingAverages = dailyAverages.map((_, index, array) => {
    const start = Math.max(0, index - windowSize + 1);
    const end = index + 1;
    const slice = array.slice(start, end);

    const movingAvg = { date: array[index].date };
    ["dpp", "kmt", "tpp", "gtm", "undecided"].forEach((key) => {
      movingAvg[key] =
        slice.reduce((sum, current) => sum + current[key], 0) / slice.length;
    });

    return movingAvg;
  });

  return movingAverages;
};

export const drawChart = (chart, data) => {
  chart.setOption({
    tooltip: {
      trigger: "axis",
      valueFormatter: (value) => parseFloat(value).toFixed(1) + "%",
    },
    xAxis: {
      type: "time",
      axisPointer: { show: true },
      max: "2024-1-13",
    },
    yAxis: {},
    series: data,
  });
};

import color from "assets/color.json";

const createDataset = (data, type, name) => {
  const { t } = useI18n();
  if (type === "scatter") {
    return {
      type,
      data: data.map((d) => [d.date, d[name]]),
      itemStyle: {
        color: color[name],
        opacity: 0.2,
      },
      symbolSize: 5,
      tooltip: {
        show: false,
      },
    };
  } else if (type === "line") {
    return {
      type,
      data: data.map((d) => [d.date, d[name]]),
      name: t(`data.candidates.${name}`),
      showSymbol: false,
      itemStyle: {
        color: color[name],
      },
      smooth: true,
    };
  }
};

export const getData = (data, filter) => {
  const pdata = data.filter((item) => !filter.includes(item.institution));
  const adata = calculateMovingAverage(pdata, 7);

  return ["dpp", "tpp", "kmt", "gtm"].flatMap((name) => [
    createDataset(adata, "line", name),
    createDataset(pdata, "scatter", name),
  ]);
};

export const getFilter = (state) => {
  let temp = [];
  for (const i in state) {
    if (!state[i].value) {
      temp.push(state[i].code);
    }
  }

  return temp;
};