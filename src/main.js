const { invoke } = window.__TAURI__.tauri;

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
const IdInputVariableK = "k-variable";
const IdInputVariableB = "b-variable";
const IdSelectQuantizationType = "quantization-type";
const IdInputQuantizationStep = "quantization-step";

const OldScrollBarSize = 24;
const MaxValueT = 20.0;
let valueTOnScreen = MaxValueT;

let quantizedFunction = {
    functionPoints: [[0.0, 0.0]],
    quantizedSignal: [[0.0, 0.0]],
    minValueN: 0.0,
    maxValueN: 0.0
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

    // If the width of the canvas is less than the minimum,
    // then turn on main-page the vertical mode
    if(mainPage.className === MainPageDefaultClass && canvasWidth < MinCanvasWidth)
        changeStateOfElement(mainPage, MainPageVerticalClass)
    else if(mainPage.className === MainPageVerticalClass && canvasWidth >= MinCanvasWidth)
        changeStateOfElement(mainPage, MainPageDefaultClass);

    if(mainPage.className === MainPageVerticalClass) {  // tablet view
        let canvasHeight = windowSize.height - propertiesPanel.clientHeight;
        drawingPanelCanvas.style.height = canvasHeight + `px`;
        if(windowSize.width < MinPropertiesWidth) {       // enabled horizontal scrollbar
            document.body.style.overflowX = `scroll`;
            if(canvasWidth < MinPropertiesWidth)
                drawingPanelCanvas.style.width = MinPropertiesWidth + `px`;
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

    drawCoordinateSystem();
}

function changeInputCounter(event) {
    let divParent = event.currentTarget.parentElement;
    let listInputElements = divParent.getElementsByTagName(`input`);
    if(listInputElements.length < 1)
        return;

    let inputElement = listInputElements[0];
    if(event.currentTarget.className.includes(ClassMinusButton))
        inputElement.stepDown(100);
    else
        inputElement.stepUp(100);
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

        // Calling the start_quantization command in rust
        invoke(`start_quantization`, {
            formulaType: selectFormulaType.value,
            variableK: parseFloat(inputVariableK.value),
            variableB: parseFloat(inputVariableB.value),
            quantizationType: selectQuantizationType.value,
            quantizationStep: parseFloat(inputQuantizationStep.value),
            maxValueT: valueTOnScreen
        }).then(response => saveQuantizedFunction(response));
    }
}

// Stores the quantized function into temporary memory
function saveQuantizedFunction(responseObject) {
    if (responseObject !== null) {
        quantizedFunction = responseObject;
        window.sessionStorage.setItem(`functionPoints`, JSON.stringify(quantizedFunction.functionPoints));
        window.sessionStorage.setItem(`quantizedSignal`, JSON.stringify(quantizedFunction.quantizedSignal));
        window.sessionStorage.setItem(`minValueN`, quantizedFunction.minValueN);
        window.sessionStorage.setItem(`maxValueN`, quantizedFunction.maxValueN);
    }

    location.reload();
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
    restoreItemValue(inputVariableK, IdInputVariableK);
    restoreItemValue(inputVariableB, IdInputVariableB);
    restoreItemValue(inputQuantizationStep, IdInputQuantizationStep);
    restoreItemValue(selectQuantizationType, IdSelectQuantizationType);

    let strFunctionPoints = window.sessionStorage.getItem(`functionPoints`);
    let arrFunctionPoints = JSON.parse(strFunctionPoints);
    let strQuantizedSignal = window.sessionStorage.getItem(`quantizedSignal`);
    let arrQuantizedSignal = JSON.parse(strQuantizedSignal);
    quantizedFunction = {
        functionPoints: arrFunctionPoints,
        quantizedSignal: arrQuantizedSignal,
        minValueN: window.sessionStorage.getItem(`minValueN`),
        maxValueN: window.sessionStorage.getItem(`maxValueN`)
    }
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

let pixelPerUnitT = 1.0;
let pixelPerUnitN = 1.0;
let ptBase = {
    x: 5.0,
    y: MinCanvasHeight / 2.0
}
// Returns the unit value in pixels, converting from the function coordinate system to canvas coordinates
// Function overloaded! Accepts either one ptUnit parameter containing the x value and the y value;
// or takes the value x in ptUnit and the value y in ptY as the second argument
function parseUnitInPixelCoord(ptUnit, ptY) {
    if(typeof ptY !== "undefined") {
        return {
            x: ptUnit * pixelPerUnitT + ptBase.x,
            y: ptBase.y - ptY * pixelPerUnitN
        };
    }

    return {
        x: ptUnit[0] * pixelPerUnitT + ptBase.x,
        y: ptBase.y - ptUnit[1] * pixelPerUnitN
    };
}

// Draws a coordinate system in the drawingCanvas, given its length and width
function drawCoordinateSystem() {
    let drawingSize = {
        width: parseStrPxToInt(drawingPanelCanvas.style.width),
        height: parseStrPxToInt(drawingPanelCanvas.style.height)
    }
    drawingPanelCanvas.width = drawingSize.width;
    drawingPanelCanvas.height = drawingSize.height;

    // Determining the dimensions of a coordinate system
    let rPadding = 35;
    let rTextPadding = 40;
    const rTolerance = 1e-6;
    let rTextMargin = 10;

    // Divisions
    const MaxDivisionNumber = 10;
    let MinValuePositiveN = 5.0;
    let MinValueNegativeN = -5.0;
    const ArrowWidth = 15;
    const DivisionLineWidth = 15;
    let iDivisionStepT = Math.trunc(MaxValueT / MaxDivisionNumber);
    let iDivisionStepN = Math.trunc((MinValuePositiveN + Math.abs(MinValueNegativeN) + 1) / MaxDivisionNumber);
    valueTOnScreen = MaxValueT + iDivisionStepT;

    // Text size
    let iFontAxisNameSize = 18;
    let iFontDivisionValueSize = 13;
    const StandardSizeCanvas = 400;

    // Determining the dimensions of a coordinate system and calculation
    // of values, taking into account the scale of the canvas
    let iMinWidth = Math.min(drawingSize.width, drawingSize.height);
    let rScale = iMinWidth / StandardSizeCanvas;
    iFontAxisNameSize *= rScale;
    iFontDivisionValueSize *= rScale;
    rTextMargin *= rScale;
    rPadding *= rScale;
    rTextPadding *= rScale;
    let coordSystemSize = {
        width: iMinWidth - rPadding - rTextPadding - ArrowWidth,
        height: iMinWidth - rPadding * 2.0
    }

    // Defining global variables
    pixelPerUnitT = coordSystemSize.width / valueTOnScreen;
    pixelPerUnitN = coordSystemSize.height / (Math.abs(MinValueNegativeN) + MinValuePositiveN + iDivisionStepN);
    ptBase.x = (drawingSize.width - iMinWidth) / 2.0 + rTextPadding + ArrowWidth;
    // ptBase.y = (drawingSize.height - iMinWidth) / 2.0 + Margin + pixelPerUnitN * (MinValuePositiveN + 1 + iDivisionStepN);
    ptBase.y = (drawingSize.height - iMinWidth) / 2.0 + rPadding + pixelPerUnitN * (MinValuePositiveN + iDivisionStepN);

    //..................................................................................................................
    // If a quantized function has been calculated, display it and the main function
    if(quantizedFunction.quantizedSignal !== null && quantizedFunction.quantizedSignal.length > 1)
        drawQuantizedFunctions()
    //..................................................................................................................

    let context = drawingPanelCanvas.getContext(`2d`);
    // let context = new CanvasRenderingContext2D();

    //.............................................................................................
    // Draw coordinate system
    context.strokeStyle = `#131313`;
    context.lineWidth = 5;
    context.lineJoin = `miter`;
    // Axis T
    context.beginPath();
    context.moveTo(ptBase.x, ptBase.y);
    let bufferPoint = parseUnitInPixelCoord(valueTOnScreen, 0.0);
    context.lineTo(bufferPoint.x, bufferPoint.y);
    context.moveTo(bufferPoint.x - ArrowWidth, bufferPoint.y - ArrowWidth);
    context.lineTo(bufferPoint.x, bufferPoint.y);
    context.lineTo(bufferPoint.x - ArrowWidth, bufferPoint.y + ArrowWidth);
    context.stroke();
    // Text T
    context.font = `bold ` + iFontAxisNameSize + `px Rubik-VariableFont_wght`;
    context.fillText(`t`, bufferPoint.x + rTextMargin, bufferPoint.y + rTextMargin);

    // Axis N
    context.beginPath();
    bufferPoint = parseUnitInPixelCoord(0.0, MinValueNegativeN);
    context.moveTo(bufferPoint.x, bufferPoint.y);
    bufferPoint = parseUnitInPixelCoord(0.0, MinValuePositiveN + iDivisionStepN);
    context.lineTo(bufferPoint.x, bufferPoint.y);
    context.moveTo(bufferPoint.x - ArrowWidth, bufferPoint.y + ArrowWidth);
    context.lineTo(bufferPoint.x, bufferPoint.y);
    context.lineTo(bufferPoint.x + ArrowWidth, bufferPoint.y + ArrowWidth);
    context.stroke();
    // Text N
    context.fillText(`N`, bufferPoint.x - rTextMargin - iFontAxisNameSize / 2.0, bufferPoint.y - rTextMargin + iFontAxisNameSize / 2.0);

    //.............................................................................................
    // Draw divisions on the coordinate axes
    context.lineWidth = 2;
    context.font = iFontDivisionValueSize + `px Rubik-VariableFont_wght`;
    context.textAlign = `center`;
    context.textBaseline = `middle`;
    // T axis
    for(let i = iDivisionStepT; i <= MaxValueT; i += iDivisionStepT) {
        bufferPoint = parseUnitInPixelCoord(i, 0);
        context.beginPath();
        context.moveTo(bufferPoint.x, bufferPoint.y - DivisionLineWidth / 2.0);
        context.lineTo(bufferPoint.x, bufferPoint.y + DivisionLineWidth / 2.0);
        context.stroke();

        // Text division
        context.fillText(i.toString(), bufferPoint.x, bufferPoint.y + DivisionLineWidth * rScale);
    }
    // N axis
    for(let i = MinValueNegativeN; i <= MinValuePositiveN; i += iDivisionStepN) {
        bufferPoint = parseUnitInPixelCoord(0, i);
        // Text division
        if(Math.abs(i) < rTolerance) {
            context.fillText(i.toString(), bufferPoint.x - DivisionLineWidth / 1.5 * rScale, bufferPoint.y);
            continue;
        }

        context.beginPath();
        context.moveTo(bufferPoint.x - DivisionLineWidth / 2.0, bufferPoint.y);
        context.lineTo(bufferPoint.x + DivisionLineWidth / 2.0, bufferPoint.y);
        context.stroke();

        context.fillText(i.toString(), bufferPoint.x - DivisionLineWidth * rScale, bufferPoint.y);
    }

    //.............................................................................................
    // Drawing a coordinate system grid
    context.strokeStyle = `#343434`;
    context.lineWidth = 1;
    context.setLineDash([3, 5]);
    // T axis
    for(let i = iDivisionStepT; i <= valueTOnScreen; i += iDivisionStepT) {
        bufferPoint = parseUnitInPixelCoord(i, MinValueNegativeN);
        context.beginPath();
        context.moveTo(bufferPoint.x, bufferPoint.y);
        bufferPoint = parseUnitInPixelCoord(i, MinValuePositiveN + iDivisionStepN);
        context.lineTo(bufferPoint.x, bufferPoint.y);
        context.stroke();
    }
    // N axis
    for(let i = MinValueNegativeN; i <= MinValuePositiveN + iDivisionStepN; i += iDivisionStepN) {
        if(Math.abs(i) < rTolerance)
            continue;

        bufferPoint = parseUnitInPixelCoord(0, i);
        context.beginPath();
        context.moveTo(bufferPoint.x, bufferPoint.y);
        bufferPoint = parseUnitInPixelCoord(valueTOnScreen, i);
        context.lineTo(bufferPoint.x, bufferPoint.y);
        context.stroke();
    }
}

// Draws the calculated function, the quantized signal, and the difference
// between the quantized signal and the function
function drawQuantizedFunctions() {
    if(quantizedFunction.functionPoints.length < 1
        || quantizedFunction.quantizedSignal.length < 1)
        return;

    let context = drawingPanelCanvas.getContext(`2d`);
    // let context = new CanvasRenderingContext2D();
    context.strokeStyle = `#ae23ae`;
    context.lineWidth = 2;
    context.lineJoin = `miter`;
    context.setLineDash([]);

    drawFunction(context, quantizedFunction.functionPoints);

    context.strokeStyle = "#5aa216";
    drawFunction(context, quantizedFunction.quantizedSignal);
}

// Draws array points in drawingCanvas
function drawFunction(context, arrFunctionPoints) {
    if(arrFunctionPoints === null || arrFunctionPoints.length === 0)
        return;

    let isFirstPoint = true;
    context.beginPath();
    for(let i = 0; i < arrFunctionPoints.length; i++) {
        let point = arrFunctionPoints[i];

        let ptCanvas = parseUnitInPixelCoord(point);
        if(isFirstPoint) {
            isFirstPoint = false;
            context.moveTo(ptCanvas.x, ptCanvas.y);
        }
        else
            context.lineTo(ptCanvas.x, ptCanvas.y);
    }
    context.stroke();
}

// main:

// Creating a canvas and window change listener
let mainPage = document.getElementById("mainPage");
let drawingPanelCanvas = document.getElementById("drawingPanelCanvas");
let propertiesPanel = document.getElementById("propertiesPanel");

// Creating a listener for the input counter increment and decrement buttons
// Finding all counter increment and decrement buttons
addListenerToCounterButtons();

let buttonStartQuantization = document.getElementById(IdStartQuantization);

const MapSelectToDropdown = new Map();
let selectFormulaType = document.getElementById(IdSelectFormulaType);
let dropdownFormulaType = selectFormulaType.parentElement.children[1];
MapSelectToDropdown.set(selectFormulaType, dropdownFormulaType);

let selectQuantizationType = document.getElementById(IdSelectQuantizationType);
let dropdownQuantizationType = selectQuantizationType.parentElement.children[1];
MapSelectToDropdown.set(selectQuantizationType, dropdownQuantizationType);

let inputVariableK = document.getElementById(IdInputVariableK);
let inputVariableB = document.getElementById(IdInputVariableB);
let inputQuantizationStep = document.getElementById(IdInputQuantizationStep);
restoreSavedValues();

window.addEventListener("resize", (e) => onResizeWindow(e.target));
// Idle call to rebuild drawingCanvas
onResizeWindow(window);

buttonStartQuantization.addEventListener(`click`, event => OnStartQuantizationClicked(event));