const width = 500;
const height = 500;

let colors = ["#4D004B", "#D1E1FF"];

let arcIndex = 0;

let clocks = new Map();

let timer = null;

const Clock = d3
  .select("#clock")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("background-color", "whitesmoke");

const ColorBar = d3
  .select("#color-bar")
  .append("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 150 15");

const layerColorBar = ColorBar.append("g");

const layerClocks = Clock.append("g").selectAll("g");

Clock.append("g").append("text").attr("class", "dummy-date");

init();

function init() {
  for (let i of [5,31,60]) {
    addData(arcIndex.toString(), i);
    arcIndex += 1;
  }
  sortClocks();
  createClock(layerClocks, clocks);
  createColorBar(layerColorBar, colors);
  clockList(clocks);
  timer = d3.timer(tick);
}

// INTERACTIONS

// ADD CLOCK

d3.select("#add-clock").on("click", function () {
  addData(arcIndex.toString(), 5);
  clockList(clocks);
  arcIndex += 1;
});

// COLOR-SETTINGS

d3.select("#color-inner").on("change", function () {
  colors[0] = this.value;
  createColorBar(layerColorBar, colors);
});

d3.select("#color-outer").on("change", function () {
  colors[1] = this.value;
  createColorBar(layerColorBar, colors);
});

// APPLY-SETTINGS

d3.select("#apply-settings").on("click", function () {
  sortClocks();
  createClock(layerClocks, clocks);
  createColorBar(layerColorBar, colors);
  clockList(clocks);
  timer = d3.timer(tick);
});

// FUNCTIONS

function addData(id, length) {
  if (clocks.size < 5) {
    clocks.set(id, { id: id, length: length, unit: "sec" });
  }
}

function sortClocks() {
  clocks = new Map(
    [...clocks.entries()].sort((a, b) => {
      const valueA = a[1].unit === "sec"? a[1].length:a[1].length*60
      const valueB = b[1].unit === "sec"? b[1].length:b[1].length*60
      return valueB - valueA
    })
  );
}

function setColorScale(colors) {
  const domain = colors.length == 2 ? [0, 1] : [0, 0.5, 1];
  return d3.scaleLinear().domain(domain).range(colors);
}

function createColorBar(selection, colors) {
  d3.select("#color-bar-rect").remove();
  d3.select("#gradient").remove();

  const gradient = selection
    .append("defs")
    .append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  gradient
    .selectAll("stop")
    .data(colors)
    .enter()
    .append("stop")
    .style("stop-color", function (d) {
      return d;
    })
    .attr("offset", function (d, i) {
      return 100 * (i / (colors.length - 1)) + "%";
    });

  selection
    .append("rect")
    .attr("id", "color-bar-rect")
    .attr("x", "0")
    .attr("y", "0")
    .attr("width", 150)
    .attr("height", 15)
    .attr("fill", "url(#gradient)");
}

function arc(radius, fraction) {
  const arc = d3
    .arc()
    .innerRadius(radius)
    .outerRadius(radius + 20)
    .cornerRadius(20)
    .startAngle(0)
    .endAngle(2 * Math.PI * fraction);
  return arc();
}

function createClock(selection, mapObject) {
  d3.selectAll("#g-clock").remove();
  const gClocks = selection
    .data(mapObject.values())
    .enter()
    .append("g")
    .attr("id", "g-clock")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);
  gClocks.append("path").attr("class", (d) => {
    return "arc" + d.id;
  });
  gClocks.append("text").attr("class", (d) => {
    return "text" + d.id;
  });
}

function updateClockList() {
  sortClocks();
  clockList(clocks);
}

function clockList(mapObjects) {
  d3.selectAll(".clock-li").remove();

  mapObjects.forEach((object) => {
    const clockList = d3
      .select("#clock-setting")
      .append("li")
      .attr("id", "path" + object.id.toString())
      .attr("class", "clock-li")
      .attr("val", object.id);
    clockList
      .append("div")
      .append("input")
      .attr("id", object.id)
      .attr("class", "input-clock")
      .attr("type", "number")
      .attr("min", 1)
      .attr("max", 60)
      .attr("value", object.length)
      .on("change", function (event) {
        let clock = clocks.get(object.id);
        clock.length = this.value;
        clocks.set(object.id, clock);
        updateClockList();
      });
    clockList
      .append("div")
      .append("select")
      .attr("size", 2)
      .attr("id", "time-unit-" + object.id)
      .html(
        `<option value="sec">Sec</option>
        <option value="min">Min</option>`
      )
      .on("change", function () {
        let clock = clocks.get(object.id);
        clock.unit = this.value;
        clocks.set(object.id, clock);
      });

    clockList
      .append("div")
      .attr("class", "remove-clock")
      .append("button")
      .attr("id", object.id)
      .html("-")
      .on("click", function (event) {
        const clockId = this.id.toString();
        if (clocks.has(clockId)) {
          d3.select(".arc" + clockId).remove();
          d3.select(".text" + clockId).remove();
          clocks.delete(clockId);
          d3.select("#path" + this.id).remove();
        }
      });
  });
}

function tick(elapsed) {
  let i = 0;

  const now = new Date();

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const timeInMillisec = now.getTime();
  const timeInSeconds = timeInMillisec / 1000;
  const timeInMinutes = timeInMillisec / 1000 / 60;

  colorScale = setColorScale(colors);

  clocks.forEach((obj) => {

    const arcLength = obj.unit === "sec"?
      (timeInSeconds % obj.length) / obj.length:
      (timeInMinutes % obj.length) / obj.length;

    const timeText = obj.unit === "sec"? 
      `${Math.floor(timeInSeconds % obj.length)}s`:
      `${Math.floor(timeInMinutes % obj.length)}m`;
    
      d3.select(".arc" + obj.id)
      .attr("d", arc(50 + i * 30, arcLength))
      .attr("fill", colorScale(arcLength));
    d3.select(".text" + obj.id)
      .text(timeText)
      .attr("transform", `translate(${4},${-54 - 30 * i})`);
    i += 1;
  });

  d3.select(".dummy-date")
    .text(`${hours}:${minutes}:${seconds}`)
    .attr("transform", () => {
      return `translate(${width / 2 - 30},${height / 2})`;
    });
}
