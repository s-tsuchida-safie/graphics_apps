const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 600
const MARGIN_TOP = 60
const MARGIN_RIGHT = 30
const MARGIN_LEFT = 80
const MARGIN_BOTTOM = 60
const FRAME_WIDTH = CANVAS_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const FRAME_HEIGHT = CANVAS_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM

const FIRST_YEAR = 1990

let offsetX = 0
let scaleX = 3
let mouseDown = false
let mousePosX = 0

const getChartLimitAmount = (data) => {
}

const getScaleYDivisionCount = () => {
}


const getBarHeight = (amount) => {
}

const getBarWidth = (dataSize) => {
}

const formatWithUnit = (value) => {
}

const yearToCanvasX = (year) => {
  return MARGIN_LEFT + (year - offsetX) * scaleX
}

const drawBarChart = (data) => {
  // グラフのフレームを描画

  // 横のグリッドを描画


  // X軸の目盛りを描画

  // 棒グラフを描画

  // はみ出た分を塗りつぶす

  // Y軸の目盛りの数字を描画

  // グラフのタイトルを描画
}

const init = () => {
  const canvas = document.getElementById('barChart')

  canvas.addEventListener("mousedown", function(e) {
    mouseDown = true
  })
  canvas.addEventListener("mouseup", function(e) {
    mouseDown = false
  })
  canvas.addEventListener("mousemove", function(e) {
    if (mouseDown) {
      // offsetXの更新

      // グラフの再描画
    }
    // 現在のマウスの位置を保存
  })

  canvas.addEventListener("wheel", function(e) {
    // scaleの更新
    
    // グラフの再描画
  })
  
  drawBarChart(data)
    
}

