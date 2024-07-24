const { invoke } = window.__TAURI__.tauri;

let greetInputEl;
let greetMsgEl;
const MinPropertiesWidth = 400;
const MinCanvasWidth = 300;
const MinCanvasHeight = 300;
const MainPageDefaultClass = "main-page";
const MainPageVerticalClass = "main-page_vertical";
const ClassPlusButton = "button-plus";
const ClassMinusButton = "button-minus";
const ClassInvalid = "invalid";
const ClassNumberInput = "number-input";
const IdStartQuantization = `start-quantization`;
const IdQuantizationProperties = "quantization-properties";
const IdSelectFormulaType = "formula-type";
const IdInputVariableX = "x-variable";
const IdInputVariableB = "b-variable";
const IdSelectQuantizationType = "quantization-type";
const IdInputQuantizationStep = "quantization-step";

const OldScrollBarSize = 24;

const FormulaType = {
    SinXAndB: `0`,
    CosXAndB: `1`,
    SinXPlusB: `2`,
    CosXPlusB: `3`,
}

// async function greet() {
//   // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//   greetMsgEl.textContent = await invoke("greet", { name: greetInputEl.value });
// }

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
        drawingPanelCanvas.style.height = canvasHeight + `px`;
        if(windowSize.width < MinPropertiesWidth) {       // enabled horizontal scrollbar
            document.body.style.overflowX = `scroll`;
        } else {                                          // disabled horizontal scrollbar
            drawingPanelCanvas.style.width = windowSize.width + `px`;
            if(document.body.style.overflowX === `scroll`)
                document.body.style.overflowX = `hidden`;
        }
    } else {                                            // desktop view
        drawingPanelCanvas.style.width = canvasWidth + `px`;
        drawingPanelCanvas.style.height = windowSize.height + `px`;
    }

    if(parseStrPxToInt(drawingPanelCanvas.style.height) < MinCanvasHeight) {
        drawingPanelCanvas.style.height = MinCanvasHeight + `px`;
        if(document.body.style.overflowY === `hidden` || mainPage.style.overflowY === ``) {
            document.body.style.overflowY = `scroll`;
        }
    } else if (document.body.style.overflowY === `scroll`) {
        document.body.style.overflowY = `hidden`;
    }

    // if(document.body.style.overflowX === `scroll`)
    //   drawingPanelCanvas.style.height =
    //       (parseStrPxToInt(drawingPanelCanvas.style.height) - ScrollBarSize) + `px`;

    // If the width of the canvas is less than the minimum,
    // then turn on main-page the vertical mode
    if(mainPage.className === MainPageDefaultClass && canvasWidth < MinCanvasWidth)
        changeStateOfElement(mainPage, MainPageVerticalClass)
    else if(mainPage.className === MainPageVerticalClass && canvasWidth >= MinCanvasWidth)
        changeStateOfElement(mainPage, MainPageDefaultClass);

    // TODO: Call function to draw coordinate system
}

function changeInputCounter(event) {
    let divParent = event.currentTarget.parentElement;
    let listInputElements = divParent.getElementsByTagName(`input`);
    if(listInputElements.length < 1)
        return;

    let inputElement = listInputElements[0];
    if(event.currentTarget.className.includes(ClassMinusButton))
        inputElement.stepDown(10);
    else
        inputElement.stepUp(10);
}

// Adds listeners to increment and decrement input counters
function addListenerToCounterButtons() {
    let listPlusButtons = document.getElementsByClassName(ClassPlusButton);
    let listMinusButton = document.getElementsByClassName(ClassMinusButton);
    if(listPlusButtons.length !== listMinusButton.length) {
        console.error("Insufficient number of buttons to increase and decrease the counter");
        return;
    }

    for(let i = 0; i < listMinusButton.length; i++) {
        listMinusButton[i].addEventListener(`click`, e => changeInputCounter(e));
        listPlusButtons[i].addEventListener(`click`, e => changeInputCounter(e));
    }
}

// Checks the correctness of the entered values and, if
// unsuccessful, displays incorrectly filled elements
// In case of correctly filled data - starts quantization
function OnStartQuantizationClicked(event) {
    let listInputElements = document.getElementsByClassName(ClassNumberInput);
    let isCorrectly = true;

    // Saving entered data
    window.sessionStorage.setItem(IdSelectFormulaType, selectFormulaType.value);
    window.sessionStorage.setItem(IdSelectQuantizationType, selectQuantizationType.value);

    // Check and displaying incorrectly entered elements
    for(let i = 0; i < listInputElements.length; i++)
        isCorrectly &= checkInputElement(listInputElements[i]);

    if(isCorrectly) {
        for (let i = 0; i < listInputElements.length; i++) {
            let parentElement = listInputElements[i].parentElement;
            parentElement.classList.toggle(ClassInvalid, false);
        }

        // TODO: Start Quantization
    }
}

// Checks the correctness of the entered values and saves the result
function checkInputElement(htmlInputElement) {
    let isCorrect = htmlInputElement.checkValidity();
    if(isCorrect) {
        window.sessionStorage.setItem(htmlInputElement.id, htmlInputElement.value);
        return true;
    } else {
        window.sessionStorage.setItem(htmlInputElement.id, `invalid`);
        return false;
    }
}

// If some values were entered in input and select,
// it is restored after pressing the submit button
function restoreSavedValues() {
    restoreItemValue(selectFormulaType, IdSelectFormulaType);
    restoreItemValue(inputVariableX, IdInputVariableX);
    restoreItemValue(inputVariableB, IdInputVariableB);
    restoreItemValue(inputQuantizationStep, IdInputQuantizationStep);
    restoreItemValue(selectQuantizationType, IdSelectQuantizationType);
}
// Restores the value of an item if any value was saved
function restoreItemValue(htmlElement, strKeyName) {
    let itemValue = window.sessionStorage.getItem(strKeyName);
    if(itemValue === null)
        return;
    switch(htmlElement.nodeName.toLowerCase()) {
        case `input`:
            if(itemValue === `invalid`) {
                let parentElement = htmlElement.parentElement;
                parentElement.classList.toggle(ClassInvalid, true);
            } else {
                htmlElement.value = itemValue;
            }
            break;
        case `select`:
            htmlElement.value = itemValue;
            let dropdownElement = MapSelectToDropdown.get(htmlElement);
            if(dropdownElement === null) {
                console.error("Dropdown list not found");
                return;
            }
            dropdownElement.innerHTML = htmlElement.options[htmlElement.selectedIndex].innerHTML;

            break;
        default:
            console.error("Not implemented type: " + htmlElement.nodeName.toLowerCase());
            return;
    }
}

// window.addEventListener("DOMContentLoaded", () => {
//   greetInputEl = document.querySelector("#greet-input");
//   greetMsgEl = document.querySelector("#greet-msg");
//   document.querySelector("#greet-form").addEventListener("submit", (e) => {
//     e.preventDefault();
//     greet();
//   });
// });

// Creating a canvas and window change listener
let mainPage = document.getElementById("mainPage");
let drawingPanelCanvas = document.getElementById("drawingPanelCanvas");
let propertiesPanel = document.getElementById("propertiesPanel");
// Idle call to rebuild drawingCanvas
onResizeWindow(window);
window.addEventListener("resize", (e) => onResizeWindow(e.target));

// Creating a listener for the input counter increment and decrement buttons
// Finding all counter increment and decrement buttons
addListenerToCounterButtons();

let buttonStartQuantization = document.getElementById(IdStartQuantization);
let formQuantizationProperties = document.getElementById(IdQuantizationProperties);

const MapSelectToDropdown = new Map();
let selectFormulaType = document.getElementById(IdSelectFormulaType);
let dropdownFormulaType = selectFormulaType.parentElement.children[1];
MapSelectToDropdown.set(selectFormulaType, dropdownFormulaType);

let selectQuantizationType = document.getElementById(IdSelectQuantizationType);
let dropdownQuantizationType = selectQuantizationType.parentElement.children[1];
MapSelectToDropdown.set(selectQuantizationType, dropdownQuantizationType);

let inputVariableX = document.getElementById(IdInputVariableX);
let inputVariableB = document.getElementById(IdInputVariableB);
let inputQuantizationStep = document.getElementById(IdInputQuantizationStep);
restoreSavedValues();

formQuantizationProperties.addEventListener(`submit`, event => OnStartQuantizationClicked(event));