const width = 500;
const height = 500;

let colors = ["#4D004B", "#D1E1FF"];

let arcIndex = 0;

let clocks = new Map();

let timer = null

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

init() 

function init(){
  for(let i of d3.range(3)){
    addData(arcIndex.toString(),5)
    arcIndex +=1
  }
  createClock(layerClocks, clocks);
  createColorBar(layerColorBar, colors);
  clockList(clocks);
  timer = d3.timer(tick)
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
  if (colors.length == 2) {
    colors[1] = this.value;
  } else if (colors.length == 3) {
    colors[2] = this.value;
  }
  createColorBar(layerColorBar, colors);
});

d3.select("#color-middle").on("change", function () {
  if (colors.length == 2) {
    colors.splice(1, 0, this.value);
  } else if (colors.length == 3) {
    colors[1] = this.value;
  }
  createColorBar(layerColorBar, colors);
});

// APPLY-SETTINGS

d3.select("#apply-settings").on("click", function () {
  sortClocks()
  createClock(layerClocks, clocks);
  createColorBar(layerColorBar, colors);
  clockList(clocks);
  timer = d3.timer(tick)
});

// FUNCTIONS

function addData(id, length) {
  clocks.set(id, { id: id, length: length });
}

function sortClocks(){
  clocks = new Map(
    [...clocks.entries()].sort((a, b) => b[1].length - a[1].length)
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
  const colorScale = setColorScale(colors);
  d3.selectAll("#g-clock").remove();
  selection
    .data(mapObject.values())
    .enter()
    .append("g")
    .attr("id", "g-clock")
    .attr("transform", `translate(${width / 2}, ${height / 2})`)
    .append("path")
    .attr("class", (d) => {
      return "arc" + d.id;
    })
    .attr("fill", (d, i) => {
      return colorScale(i / (mapObject.size - 1));
    });
}

function updateClockList(){
  sortClocks()
  clockList(clocks)
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
    clockList.append("div").html("clock " + object.id.toString());
    clockList
      .append("div")
      .append("input")
      .attr("id", object.id)
      .attr("class", "input-clock")
      .attr("type", "number")
      .attr("min", 1)
      .attr("max", 60)
      .attr("value", object.length)
      .on("change",function(event){
        timer.stop()
        clocks.set(this.id,{id:this.id,length:this.value})
        updateClockList()
      })
    clockList
      .append("div")
      .attr("class", "remove-clock")
      .append("button")
      .attr("id", object.id)
      .on("click", function (event) {
        const clockId = this.id.toString();
        if (clocks.has(clockId)) {
          d3.select(".arc" + clockId).remove();
          clocks.delete(clockId);
          d3.select("#path" + this.id).remove();
        }
      })
      .html("-");
  });
}

function tick(elapsed) {
  let i = 0;
  clocks.forEach((obj) => {
    d3.select(".arc" + obj.id).attr(
      "d",
      arc(50 + i * 30, ((elapsed / 1000) % obj.length) / obj.length)
    );
    i += 1;
  });
}
