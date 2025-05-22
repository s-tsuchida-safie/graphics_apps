type StackedBarChartData = {
  headers: {
    value: string
    xAxis?: boolean
  }[]
  data: string[][]
}

type ChartPosition = {
  x: {
    key: string
    start: number
    end: number
  }
  y: {
    key: string
    start: number
    end: number
  }[]
}

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 500

const MARGIN_TOP = 60
const MARGIN_RIGHT = 60
const MARGIN_LEFT = 80
const MARGIN_BOTTOM = 60
const Y_GRID_COUNT = 6

const FRAME_WIDTH = CANVAS_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const FRAME_HEIGHT = CANVAS_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM

const CHART_BAR_WIDTH = 50

const UNIT_LIST = [
  {
    unit: "兆",
    value: 1000000000,
  },
  {
    unit: "億",
    value: 1000000,
  },
  {
    unit: "万",
    value: 10000,
  },
  {
    unit: "",
    value: 1,
  },
]

type Color = {
  r: number
  g: number
  b: number
}

const getColorList = (num: number): Color[] => {
  const colorList: Color[] = []

  for (let i = 0; i < num; i++) {
    const max = 130
    const baseColor = {
      r: Math.floor(Math.random() * max),
      g: Math.floor(Math.random() * max),
      b: Math.floor(Math.random() * max),
    }
    if (i % 3 === 0) {
      colorList.push({
        ...baseColor,
        r: baseColor.r + 255 - max,
      })
    } else if (i % 3 === 1) {
      colorList.push({
        ...baseColor,
        g: baseColor.g + 255 - max,
      })
    } else {
      colorList.push({
        ...baseColor,
        b: baseColor.b + 255 - max,
      })
    }
  }

  return colorList
}

class StackedBarChart {
  private _canvas: HTMLCanvasElement
  private _data: StackedBarChartData
  private _filteredCategory: string | undefined
  private _currentChartPosition: ChartPosition[]
  private _mousePosX: number
  private _isMouseDown: boolean
  private _offsetX: number
  private _scaleX: number
  private _title: string
  private _categoryColor: {
    [category: string]: Color
  }

  constructor() {
    this._offsetX = 0
    this._scaleX = 1
    this._title = "CSVファイルを選択してください"
    this._canvas = document.createElement("canvas")
    this._canvas.width = CANVAS_WIDTH
    this._canvas.height = CANVAS_HEIGHT
    this._data = {
      headers: [],
      data: [],
    }
    this._handleMouseDown = this._handleMouseDown.bind(this)
    this._handleMouseUp = this._handleMouseUp.bind(this)
    this._handleWheel = this._handleWheel.bind(this)
    this._handleMouseMove = this._handleMouseMove.bind(this)
    this._canvas.addEventListener("mousedown", this._handleMouseDown)
    this._canvas.addEventListener("mouseup", this._handleMouseUp)
    this._canvas.addEventListener("wheel", this._handleWheel)
    this._canvas.addEventListener("mousemove", this._handleMouseMove)
    this._currentChartPosition = []
    this._categoryColor = {}
  }

  setTarget(element: Element) {
    element.appendChild(this._canvas)
  }

  setData(data: StackedBarChartData) {
    this._data = data
    const colors = getColorList(this.categoryList.length)
    this.categoryList.forEach((category, index) => {
      this._categoryColor[category] = colors[index]
    })
    this._drowStackedBarChart()
  }

  setFilter(category: string | undefined) {
    this._filteredCategory = category
    this._drowStackedBarChart()
  }

  setTitle(title: string) {
    this._title = title
  }

  get categoryList() {
    return this._data.headers
      .filter((headerKey) => !headerKey.xAxis)
      .map((headerKey) => headerKey.value)
  }

  get chartData(): {
    key: string
    categoryDataList: {
      category: string
      value: number
    }[]
  }[] {
    const xAxisIndex = this._data.headers.findIndex((header) => header.xAxis)
    return this._data.data.map((rowData) => {
      const newRowData = [...rowData]
      const key = newRowData[xAxisIndex]
      newRowData.splice(xAxisIndex, 1)
      return {
        key,
        categoryDataList: this.categoryList.map((category, index) => ({
          category,
          value: Number(newRowData[index].split(",").join("")),
        })),
      }
    })
  }

  get lastDataPosX() {
    return this.chartData.length * CHART_BAR_WIDTH
  }

  private _getChartLimitY = () => {
    const baseNum = Math.pow(10, Math.floor(Math.log10(this._yMax)))
    const num = Math.ceil(this._yMax / baseNum)
    return num * baseNum
  }

  private _getYWithUnit = (y) => {
    let tempY = y
    let texts: string[] = []
    for (const yUnit of UNIT_LIST) {
      const y = Math.floor(tempY / yUnit.value)
      if (y > 0) {
        texts.push(y + yUnit.unit)
        tempY -= y * yUnit.value
      }
    }
    return texts
  }

  private get _yMax() {
    if (this._filteredCategory === undefined) {
      return Math.max(
        ...this.chartData.map((rowData) => {
          const max = rowData.categoryDataList.reduce((prev, curr) => {
            return prev + curr.value
          }, 0)
          return max
        })
      )
    }
    const filteredData = this.chartData.map(({ key, categoryDataList }) => {
      return {
        key,
        categoryDataList: categoryDataList.filter(
          ({ category }) => category === this._filteredCategory
        ),
      }
    })
    return Math.max(
      ...filteredData.map((rowData) => {
        const max = rowData.categoryDataList.reduce((prev, curr) => {
          return prev + curr.value
        }, 0)
        return max
      })
    )
  }

  private _xToCanvasX(x: number) {
    return this._scaleX * (x + this._offsetX)
  }

  private _yToCanvasY(y: number) {
    return (
      FRAME_HEIGHT - (y / this._getChartLimitY()) * FRAME_HEIGHT + MARGIN_TOP
    )
  }

  private _canvasXToX(canvasX: number) {
    return canvasX / this._scaleX - this._offsetX
  }

  private _canvasYToY(canvasY: number) {
    return (
      ((FRAME_HEIGHT - canvasY + MARGIN_TOP) / FRAME_HEIGHT) *
      this._getChartLimitY()
    )
  }

  private _filterChartDataByCategory() {
    if (this._filteredCategory === undefined) {
      return this.chartData
    }

    return this.chartData.map(({ key, categoryDataList }) => {
      return {
        key,
        categoryDataList: categoryDataList.filter(
          ({ category }) => category === this._filteredCategory
        ),
      }
    })
  }

  private _handleMouseMove(e: MouseEvent) {
    if (this._isMouseDown) {
      const prevOffsetX = this._offsetX
      const diffX = e.offsetX - this._mousePosX
      this._offsetX = diffX + prevOffsetX
      if (diffX < 0 && this._xToCanvasX(this.lastDataPosX) < MARGIN_LEFT + FRAME_WIDTH - 20) {
        this._offsetX = prevOffsetX
      }
      if (diffX > 0 && this._xToCanvasX(0) > MARGIN_LEFT + 20) {
        this._offsetX = prevOffsetX
      }
      this._drowStackedBarChart()
    }
    this._mousePosX = e.offsetX
    const x = this._canvasXToX(this._mousePosX)
    const hoveredBarData = this._currentChartPosition.find((item) => {
      return x >= item.x.start && x <= item.x.end
    })
    const y = this._canvasYToY(e.offsetY)
    const hoveredYData = hoveredBarData?.y?.find((item) => {
      return y >= item.start && y <= item.end
    })
    if (hoveredYData && hoveredBarData && this._filteredCategory === undefined) {
      this._drowStackedBarChart()
      const tooltipText = [
          `${hoveredBarData.x.key}`,
          `${hoveredYData.key}`,
          `${this._getYWithUnit(hoveredYData.end - hoveredYData.start).join("")}`,
        ]
      this._drawTooltip(
        this._xToCanvasX(hoveredBarData.x.end),
        this._yToCanvasY((hoveredYData.end + hoveredYData.start) / 2),
        tooltipText
      )
    } else {
      this._drowStackedBarChart()
    }
  }

  private _handleWheel(e: WheelEvent) {
    const prevScale = this._scaleX
    const prevOffsetX = this._offsetX
    let newScaleX = this._scaleX
    if (e.deltaY > 0) {
      newScaleX -= 0.1
    } else {
      newScaleX += 0.1
    }
    const newOffsetX =
      (1 / newScaleX - 1 / this._scaleX) * this._mousePosX + this._offsetX
    this._offsetX = newOffsetX
    this._scaleX = newScaleX
    if (e.deltaY > 0 && (this._xToCanvasX(this.lastDataPosX) < MARGIN_LEFT + FRAME_WIDTH - 20 && this._xToCanvasX(0) > MARGIN_LEFT + 20)) {
      this._scaleX = prevScale
      this._offsetX = prevOffsetX
    }
    this._drowStackedBarChart()
  }

  private _handleMouseDown(e: MouseEvent) {
    this._isMouseDown = true
  }

  private _handleMouseUp(e: MouseEvent) {
    this._isMouseDown = false
  }

  private _drowStackedBarChart() {
    const chartData = this._filterChartDataByCategory()
    const ctx = this._canvas.getContext("2d") as CanvasRenderingContext2D
    this._currentChartPosition = []

    // グラフのフレームを描画
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.beginPath()
    ctx.rect(MARGIN_LEFT, MARGIN_TOP, FRAME_WIDTH, FRAME_HEIGHT)
    ctx.stroke()

    // y軸のグリッドを描画
    const yLimit = this._getChartLimitY()
    for (let i = 1; i <= Y_GRID_COUNT; i++) {
      const canvasX = MARGIN_LEFT
      const y = (i * yLimit) / Y_GRID_COUNT
      const canvasY = this._yToCanvasY(y)
      ctx.beginPath()
      ctx.moveTo(canvasX, canvasY)
      ctx.lineTo(canvasX + FRAME_WIDTH, canvasY)
      ctx.stroke()
    }

    // 積み上げ棒グラフを描画
    for (let i = 0; i < chartData.length; i++) {
      const x = CHART_BAR_WIDTH * i
      const canvasX = this._xToCanvasX(x)
      const nextX = CHART_BAR_WIDTH * (i + 1)
      const barWidth = (this._xToCanvasX(nextX) - canvasX) / 2
      let y = 0
      const yList: ChartPosition["y"] = []

      for (const { category, value } of chartData[i].categoryDataList) {
        ctx.beginPath()
        const canvasY = this._yToCanvasY(y)
        const categoryHeight = this._yToCanvasY(y + value) - canvasY
        ctx.rect(canvasX, canvasY, barWidth, categoryHeight)
        const color = this._categoryColor[category]
        ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`
        ctx.fill()
        yList.push({
          key: category,
          start: y,
          end: y + value,
        })
        y += value
      }
      this._currentChartPosition.push({
        x: {
          key: chartData[i].key,
          start: x,
          end: this._canvasXToX(canvasX + barWidth),
        },
        y: yList,
      })

      // X軸の目盛りを描画
      ctx.font = "12px Arial"
      ctx.fillStyle = "#000"
      ctx.textAlign = "center"
      const graphScalePos = {
        x: canvasX + barWidth / 2,
        y: MARGIN_TOP + FRAME_HEIGHT + 15,
      }
      ctx.fillText(`${chartData[i].key}`, graphScalePos.x, graphScalePos.y)
    }

    // はみ出た分を塗りつぶす
    ctx.beginPath()
    ctx.rect(
      MARGIN_LEFT + FRAME_WIDTH,
      MARGIN_TOP,
      MARGIN_RIGHT,
      FRAME_HEIGHT + MARGIN_BOTTOM
    )
    ctx.rect(0, 0, MARGIN_LEFT, CANVAS_HEIGHT)
    ctx.fillStyle = "#fff"
    ctx.fill()

    // Y軸の目盛りを描画
    for (let i = 1; i <= Y_GRID_COUNT; i++) {
      ctx.font = "12px Arial"
      ctx.fillStyle = "#000"
      ctx.textAlign = "right"
      const y = (i * yLimit) / Y_GRID_COUNT
      const yGraphScaleText = this._getYWithUnit(y)[0]
      const canvasX = MARGIN_LEFT
      const canvasY = this._yToCanvasY(y)
      ctx.fillText(yGraphScaleText, canvasX - 15, canvasY)
    }

    // グラフのタイトルを描画
    ctx.font = "16px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    ctx.fillText(this._title, CANVAS_WIDTH / 2, MARGIN_TOP - 20)

    // X軸のタイトルを描画
    ctx.font = "12px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    const text = this._data.headers
        .find((header) => header.xAxis)?.value
    ctx.fillText(
      text ?? "",
      MARGIN_LEFT + FRAME_WIDTH + 10,
      MARGIN_TOP + FRAME_HEIGHT + 15
    )
  }
  private _drawTooltip = (canvasX, canvasY, textList) => {
    const ctx = this._canvas.getContext("2d") as CanvasRenderingContext2D
    ctx.beginPath()
    ctx.moveTo(canvasX, canvasY)
    ctx.lineTo(canvasX + 10, canvasY - 5)
    ctx.lineTo(canvasX + 10, canvasY + 5)
    ctx.closePath()
    ctx.fillStyle = "rgba(0, 0, 0, 1)"
    ctx.fill()
    ctx.beginPath()

     
    const textWidth = Math.max(...textList.map((text) => {
      const span = document.createElement("div")
      span.style.fontSize = "12px"
      span.style.width = 'fit-content'
      span.style.padding = "0.5rem"
      span.textContent = text
      document.body.appendChild(span)
      const width = span.offsetWidth
      document.body.removeChild(span)
      return width
    }))
    const size = {
      width: textWidth,
      height: 75,
    }
    const topLeft = {
      x: canvasX + 10,
      y: canvasY - size.height / 2,
    }
    const radius = 7
    ctx.moveTo(topLeft.x + radius, topLeft.y)
    ctx.lineTo(topLeft.x + size.width - radius, topLeft.y)
    ctx.quadraticCurveTo(
      topLeft.x + size.width,
      topLeft.y,
      topLeft.x + size.width,
      topLeft.y + radius
    )
    ctx.lineTo(topLeft.x + size.width, topLeft.y + size.height - radius)
    ctx.quadraticCurveTo(
      topLeft.x + size.width,
      topLeft.y + size.height,
      topLeft.x + size.width - radius,
      topLeft.y + size.height
    )
    ctx.lineTo(topLeft.x + radius, topLeft.y + size.height)
    ctx.quadraticCurveTo(
      topLeft.x,
      topLeft.y + size.height,
      topLeft.x,
      topLeft.y + size.height - radius
    )
    ctx.lineTo(topLeft.x, topLeft.y + radius)
    ctx.quadraticCurveTo(topLeft.x, topLeft.y, topLeft.x + radius, topLeft.y)
    ctx.fillStyle = "rgba(0, 0, 0, 1)"
    ctx.fill()

    let textCanvasY = topLeft.y + 25
    for (const text of textList) {
      ctx.fillStyle = "#fff"
      ctx.font = "12px Arial"
      ctx.textAlign = "left"
      ctx.fillText(text, canvasX + 17, textCanvasY)
      textCanvasY += 17
    }
  }
}

export { StackedBarChart }
