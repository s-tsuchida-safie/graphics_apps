import { parse } from "csv-parse/browser/esm/sync"
import { StackedBarChart } from "./stackedBarChart"

const chart = new StackedBarChart()
const target = document.getElementById("barChart")
if (target) {
  chart.setTarget(target)
}

const handleFileLoad = async () => {
  if (typeof reader.result === "string") {
    const records = await parse(reader.result)
    const rawData: string[][] = []
    for (const record of records) {
      rawData.push(record)
    }
    const headers = rawData[0].map((value, index) => {
      if (index === 0) {
        return {
          value,
          xAxis: true,
        }
      }
      return {
        value,
      }
    })
    const data = rawData.slice(1)
    chart.setData({
      headers,
      data,
    })
    const select = document.getElementById("categorySelector")
    if (select) {
      select.innerHTML = ""
      const option = document.createElement("option")
      option.setAttribute("value", "all")
      option.innerHTML = "全て"
      select?.appendChild(option)
    }
    chart.categoryList.reverse().forEach((category) => {
      const option = document.createElement("option")
      option.setAttribute("value", category)
      option.innerHTML = category
      select?.appendChild(option)
    })
  }
}

const reader = new FileReader()
reader.addEventListener("load", handleFileLoad)

const handleFileInputChange = () => {
  const element = document.getElementById("fileInput") as HTMLInputElement
  const files = element?.files
  if (files && files?.length > 0) {
    const file = files[0]
    chart.setTitle(file.name.split(".")[0])
    reader.readAsText(file)
  }
}

const input = document.getElementById("fileInput")
input?.addEventListener("change", handleFileInputChange)

const handleChangeSelect = (e: Event) => {
  const target = e.target as HTMLSelectElement
  if (target.value === "all") {
    chart.setFilter(undefined)
    return
  }
  chart.setFilter(target.value)
}

const select = document.getElementById("categorySelector") as HTMLSelectElement
select?.addEventListener("change", handleChangeSelect)
