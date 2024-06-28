const { invoke } = window.__TAURI__.tauri;

let greetInputEl;
let greetMsgEl;
const MinPropertiesWidth = 400;
const MinCanvasWidth = 300;
const DefaultCanvasHeight = `500px`;
const MainPageDefaultClass = "main-page";
const MainPageVerticalClass = "main-page_vertical";
const ScrollBarSize = 24;

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
}

function parseStrPxToInt(strValue = "") {
  strValue.replace(`px`, ``);
  return parseInt(strValue);
}

// Switches the element class to the specified one
function changeStateOfElement(
    htmlElement = new HTMLElement(),
    strStateName = "") {
  if(htmlElement.classList.length === 0
      || strStateName === "")
    return;

  let currentClassName = htmlElement.classList[0];

  if(!htmlElement.classList.contains(strStateName))
    htmlElement.classList.add(strStateName);

  htmlElement.classList.toggle(currentClassName);
}

// Changes the canvas value after each window resize
function onResizeWindow(window) {
  let windowSize=  {
    'width': window.frames.innerWidth,
    'height': window.frames.innerHeight
  };

  // Adjusts canvas depending on screen view: desktop, tablet view
  let canvasWidth = windowSize.width - propertiesPanel.clientWidth;
  if(mainPage.className === MainPageVerticalClass) {  // tablet view
    let canvasHeight = windowSize.height - propertiesPanel.clientHeight;
    if(windowSize.width < MinPropertiesWidth) {       // enabled horizontal scrollbar
      mainPage.style.overflowX = `scroll`;
      drawingPanelCanvas.style.height = (canvasHeight - ScrollBarSize) + `px`;
    } else {                                          // disabled horizontal scrollbar
      drawingPanelCanvas.style.width = windowSize.width + `px`;
      drawingPanelCanvas.style.height = canvasHeight + `px`;
      if(mainPage.style.overflowX === `scroll`)
        mainPage.style.overflowX = `hidden`;
    }
  } else {                                            // desktop view
    drawingPanelCanvas.style.width = canvasWidth + `px`;
    drawingPanelCanvas.style.height = windowSize.height + `px`;
  }

  // If the width of the canvas is less than the minimum,
  // then turn on main-page the vertical mode
  if(mainPage.className === MainPageDefaultClass && canvasWidth < MinCanvasWidth)
    changeStateOfElement(mainPage, MainPageVerticalClass)
  else if(mainPage.className === MainPageVerticalClass && canvasWidth >= MinCanvasWidth)
    changeStateOfElement(mainPage, MainPageDefaultClass);
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  document.querySelector("#greet-form").addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });
});

// Creating a canvas and window change listener
let mainPage = document.getElementById("mainPage");
let drawingPanelCanvas = document.getElementById("drawingPanelCanvas");
let propertiesPanel = document.getElementById("propertiesPanel");

// Idle call to rebuild drawingCanvas
onResizeWindow(window);
window.addEventListener("resize", (e) => onResizeWindow(e.target));