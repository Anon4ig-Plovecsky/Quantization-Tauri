// by Anon4ig Plov

const ClassDropdown = "dropdown";
const ClassDropdownMenu = "dropdown__menu";
const ClassDropdownItem = "dropdown__item";
const ClassDropdownPressed = "dropdown_pressed";
const ClassDropdownSelected = "dropdown_selected";
const ClassDropdownMenuHidden = "dropdown__menu_hidden";
const ClassFirstItem = "first";
const ClassLastItem = "last";
let giMaxCounter = 2;
let gcMenuIsOpened = giMaxCounter; // Determines whether a dropdown menu has just been opened or not; 2 - Menu is hided; 0 - Menu is shown

const ItemType = {
    First: 0,
    Standard: 1,
    Last: 2
}

// When an item is selected, the dropdown menu changes it for the
// standard select, and also changes the display of the dropdownSelected item
function onItemClicked(event, dropdownSelect, dropdownSelected) {
    let clickedItem = event.currentTarget;
    let strSelectedItem = clickedItem.innerHTML;
    dropdownSelected.innerHTML = strSelectedItem;

    for(let i = 0; i < dropdownSelect.options.length; i++)
        if(strSelectedItem === dropdownSelect.options[i].innerHTML
                && dropdownSelect.value !== dropdownSelect.options[i].value) {
            dropdownSelect.value = dropdownSelect.options[i].value;
            dropdownSelect.dispatchEvent(new Event(`change`));
        }
}

// when clicked on the dropdown, shows/hides the menu
function onSelectedItemClicked(event, dropdownMenu, dropdownSelected) {
    let bMenuIsOpened = !dropdownMenu.classList.contains(ClassDropdownMenuHidden);
    if(!bMenuIsOpened)
        closeAllDropdowns();

    if(event.currentTarget.className === ClassDropdownSelected) {
        dropdownMenu.classList.toggle(ClassDropdownMenuHidden);
        dropdownSelected.classList.toggle(ClassDropdownPressed);
        bMenuIsOpened = !bMenuIsOpened;
        if(bMenuIsOpened)
            gcMenuIsOpened = giMaxCounter;
    }
}

// Adds an item to the dropdown menu
function addItemInDropdown(dropdownMenu, strItemName, itemType = ItemType.Standard) {
    let dropdownItem = document.createElement(`div`);
    dropdownItem.classList.add(ClassDropdownItem);
    dropdownMenu.appendChild(dropdownItem);
    dropdownItem.innerHTML = strItemName;
    switch (itemType) {
        case ItemType.First:
            dropdownItem.classList.toggle(ClassFirstItem, true);
            break;
        case ItemType.Last:
            dropdownItem.classList.toggle(ClassLastItem, true);
            break;
        default:
            break;
    }

    return dropdownItem;
}

// Creates its own select and fills it with all the data it takes from the standard select
function fillDropdown(dropdown = new Element()) {
    if(dropdown === null)
        return;

    // Getting elements in select
    let dropdownSelect = dropdown.firstElementChild;
    let dropdownOptions = dropdownSelect.options;

    // Create own select, with a custom style
    let dropdownSelected = document.createElement("div");
    dropdownSelected.classList.add(ClassDropdownSelected);
    dropdown.appendChild(dropdownSelected);
    dropdownSelected.innerHTML = dropdownOptions[dropdownSelect.selectedIndex].innerHTML;

    // Filling out the drop-down list and setting listeners to select a subject
    let dropdownMenu = document.createElement(`div`);
    dropdownMenu.classList.add(ClassDropdownMenu, ClassDropdownMenuHidden);
    dropdown.appendChild(dropdownMenu);
    for(let i = 0; i < dropdownOptions.length; i++) {
        let strItemName = dropdownOptions[i].innerHTML;
        let itemType = ItemType.Standard;
        if(i === 0)
            itemType = ItemType.First;
        if(i === dropdownOptions.length - 1)
            itemType = ItemType.Last;

        let dropdownItem = addItemInDropdown(dropdownMenu, strItemName, itemType);
        dropdownItem.addEventListener(`click`, event => onItemClicked(event, dropdownSelect, dropdownSelected));
    }

    dropdownSelected.addEventListener(`click`, event => onSelectedItemClicked(event, dropdownMenu, dropdownSelected));
}

// if clicked in any other part of the document - hides the menu
// Counter logic:
// In order to close the dropdown when clicking on any part of the document after opening the document,
// two listeners were added: for the dropdown and for the entire document
// After clicking on a document, the dropdown list always closes
// When opening a drop-down list, two additional listeners are always triggered, so we skip them
function closeAllDropdowns() {
    if(gcMenuIsOpened === 0) {
        let dropdownMenuList = document.getElementsByClassName(ClassDropdownMenu);
        let dropdownSelectedList = document.getElementsByClassName(ClassDropdownSelected);
        if(dropdownSelectedList.length !== dropdownMenuList.length)
            return;

        for(let i = 0; i < dropdownMenuList.length; i++) {
            dropdownMenuList[i].classList.toggle(ClassDropdownMenuHidden, true);
            dropdownSelectedList[i].classList.toggle(ClassDropdownPressed, false);
        }
        gcMenuIsOpened = giMaxCounter;
    }
    else
        gcMenuIsOpened--;
}

// main:
let dropdownList = document.getElementsByClassName(ClassDropdown);
for(let i = 0; i < dropdownList.length; i++)
    fillDropdown(dropdownList[i]);

document.addEventListener(`click`, () => closeAllDropdowns());