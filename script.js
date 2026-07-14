const textInput = document.getElementById("text-input");
const showTextButton = document.getElementById("show-text-button");
const changeColorButton = document.getElementById("change-color-button");
const resetButton = document.getElementById("reset-button");
const returnButton = document.getElementById("return-button");
const outputArea = document.getElementById("output-area");

const selectionColors = ["#d7263d", "#1d6f42", "#b35c00", "#0b5ed7"];
let currentColorIndex = 0;

let isSelectingWithRectangle = false;
let dragStartX = 0;
let dragStartY = 0;
let draggedCharacters = [];
let originalCharacters = [];
let freeDragGroupCounter = 0;
const characterOriginalState = new Map();

const selectionRectangle = document.createElement("div");
selectionRectangle.classList.add("selection-rectangle");

function placeDraggedCharactersOnPage(dropX, dropY) {
  const characterGap = 14;
  const freeGroupId = "free-group-" + freeDragGroupCounter;

  freeDragGroupCounter += 1;

  for (let i = 0; i < draggedCharacters.length; i++) {
    const sourceCharacter = draggedCharacters[i];

    sourceCharacter.classList.add("free-character");
    sourceCharacter.dataset.freeGroupId = freeGroupId;
    sourceCharacter.style.left = dropX + i * characterGap + "px";
    sourceCharacter.style.top = dropY + "px";
    document.body.appendChild(sourceCharacter);
  }
}

function clearCurrentDragState() {
  for (let i = 0; i < draggedCharacters.length; i++) {
    draggedCharacters[i].classList.remove("dragging-character");
  }

  draggedCharacters = [];
}

function getInsertReferenceByOriginalIndex(originalIndex) {
  for (let i = 0; i < originalCharacters.length; i++) {
    const candidate = originalCharacters[i];
    const candidateState = characterOriginalState.get(candidate);

    if (!candidateState) {
      continue;
    }

    if (candidateState.index > originalIndex && candidate.parentElement === outputArea) {
      return candidate;
    }
  }

  return null;
}

function returnDraggedLettersToOutputContainer() {
  const movedCharacters = [];

  for (let i = 0; i < originalCharacters.length; i++) {
    const character = originalCharacters[i];
    const originalState = characterOriginalState.get(character);

    if (!originalState) {
      continue;
    }

    if (character.parentElement !== originalState.parent) {
      movedCharacters.push(character);
    }
  }

  movedCharacters.sort(function (a, b) {
    const firstState = characterOriginalState.get(a);
    const secondState = characterOriginalState.get(b);

    return firstState.index - secondState.index;
  });

  for (let i = 0; i < movedCharacters.length; i++) {
    const character = movedCharacters[i];
    const originalState = characterOriginalState.get(character);
    const insertBeforeElement = getInsertReferenceByOriginalIndex(originalState.index);

    character.classList.remove("free-character");
    character.classList.remove("dragging-character");
    character.style.left = "";
    character.style.top = "";
    character.style.transform = "";

    if (insertBeforeElement) {
      originalState.parent.insertBefore(character, insertBeforeElement);
    } else {
      originalState.parent.appendChild(character);
    }
  }
}

function resetCharactersToOriginalState() {
  for (let i = 0; i < originalCharacters.length; i++) {
    const character = originalCharacters[i];

    character.classList.remove("free-character");
    character.classList.remove("selected");
    character.classList.remove("dragging-character");
    character.style.left = "";
    character.style.top = "";

    outputArea.appendChild(character);
  }
}

outputArea.addEventListener("click", function (event) {
  const clickedElement = event.target;

  if (!clickedElement.classList.contains("character")) {
    return;
  }

  if (event.ctrlKey) {
    clickedElement.classList.toggle("selected");
  }
});

outputArea.addEventListener("mousedown", function (event) {
  if (event.button !== 0) {
    return;
  }

  if (event.target.classList.contains("character")) {
    return;
  }

  isSelectingWithRectangle = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;

  if (!event.ctrlKey) {
    const selectedCharacters = outputArea.querySelectorAll(".character.selected");

    for (let i = 0; i < selectedCharacters.length; i++) {
      selectedCharacters[i].classList.remove("selected");
    }
  }

  selectionRectangle.style.left = dragStartX + "px";
  selectionRectangle.style.top = dragStartY + "px";
  selectionRectangle.style.width = "0px";
  selectionRectangle.style.height = "0px";

  document.body.appendChild(selectionRectangle);
  document.body.classList.add("disable-text-selection");
  event.preventDefault();
});

document.addEventListener("dragstart", function (event) {
  const draggedElement = event.target;

  if (!(draggedElement instanceof Element) || !draggedElement.classList.contains("character")) {
    return;
  }

  clearCurrentDragState();

  const selectedCharacters = Array.from(document.querySelectorAll(".character.selected"));
  let selectedCharactersInSameParent = selectedCharacters.filter(function (character) {
    return character.parentElement === draggedElement.parentElement;
  });

  if (draggedElement.classList.contains("free-character")) {
    const draggedElementGroupId = draggedElement.dataset.freeGroupId;

    selectedCharactersInSameParent = selectedCharactersInSameParent.filter(function (character) {
      return character.dataset.freeGroupId === draggedElementGroupId;
    });
  }

  if (draggedElement.classList.contains("selected") && selectedCharactersInSameParent.length > 1) {
    draggedCharacters = selectedCharactersInSameParent;
  } else {
    draggedCharacters = [draggedElement];
  }

  for (let i = 0; i < draggedCharacters.length; i++) {
    draggedCharacters[i].classList.add("dragging-character");
  }

  event.dataTransfer.setData("text/plain", "dragging");
});

document.addEventListener("dragend", function () {
  clearCurrentDragState();
});

outputArea.addEventListener("dragover", function (event) {
  if (draggedCharacters.length === 0) {
    return;
  }

  event.preventDefault();
});

outputArea.addEventListener("drop", function (event) {
  if (draggedCharacters.length === 0) {
    return;
  }

  const outputRect = outputArea.getBoundingClientRect();
  const isInsideOutputArea =
    event.clientX >= outputRect.left &&
    event.clientX <= outputRect.right &&
    event.clientY >= outputRect.top &&
    event.clientY <= outputRect.bottom;

  if (!isInsideOutputArea) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  for (let i = 0; i < draggedCharacters.length; i++) {
    const character = draggedCharacters[i];

    character.classList.remove("free-character");
    delete character.dataset.freeGroupId;
    character.classList.remove("dragging-character");
    character.style.left = "";
    character.style.top = "";
    character.style.transform = "";
  }

  const dropTarget = event.target.closest(".character");

  if (dropTarget && draggedCharacters.includes(dropTarget)) {
    return;
  }

  if (dropTarget && draggedCharacters.length === 1) {
    const draggedCharacter = draggedCharacters[0];

    if (draggedCharacter.parentElement === outputArea) {
      const placeholder = document.createElement("span");

      outputArea.insertBefore(placeholder, draggedCharacter);
      outputArea.insertBefore(draggedCharacter, dropTarget);
      outputArea.insertBefore(dropTarget, placeholder);
      placeholder.remove();
    } else {
      outputArea.insertBefore(draggedCharacter, dropTarget);
    }

    return;
  }

  if (!dropTarget) {
    for (let i = 0; i < draggedCharacters.length; i++) {
      outputArea.appendChild(draggedCharacters[i]);
    }
    return;
  }

  for (let i = 0; i < draggedCharacters.length; i++) {
    outputArea.insertBefore(draggedCharacters[i], dropTarget);
  }
});

document.addEventListener("dragover", function (event) {
  if (draggedCharacters.length === 0) {
    return;
  }

  event.preventDefault();
});

document.addEventListener("drop", function (event) {
  if (draggedCharacters.length === 0) {
    return;
  }

  const outputRect = outputArea.getBoundingClientRect();
  const isInsideOutputArea =
    event.clientX >= outputRect.left &&
    event.clientX <= outputRect.right &&
    event.clientY >= outputRect.top &&
    event.clientY <= outputRect.bottom;

  if (isInsideOutputArea) {
    return;
  }

  event.preventDefault();
  placeDraggedCharactersOnPage(event.pageX, event.pageY);
});

document.addEventListener("mousemove", function (event) {
  if (!isSelectingWithRectangle) {
    return;
  }

  const rectangleLeft = Math.min(dragStartX, event.clientX);
  const rectangleTop = Math.min(dragStartY, event.clientY);
  const rectangleWidth = Math.abs(event.clientX - dragStartX);
  const rectangleHeight = Math.abs(event.clientY - dragStartY);

  selectionRectangle.style.left = rectangleLeft + "px";
  selectionRectangle.style.top = rectangleTop + "px";
  selectionRectangle.style.width = rectangleWidth + "px";
  selectionRectangle.style.height = rectangleHeight + "px";

  const selectionRect = selectionRectangle.getBoundingClientRect();
  const characters = outputArea.querySelectorAll(".character");

  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    const characterRect = character.getBoundingClientRect();

    if (
      selectionRect.left < characterRect.right &&
      selectionRect.right > characterRect.left &&
      selectionRect.top < characterRect.bottom &&
      selectionRect.bottom > characterRect.top
    ) {
      character.classList.add("selected");
    } else if (!event.ctrlKey) {
      character.classList.remove("selected");
    }
  }
});

document.addEventListener("mouseup", function () {
  if (!isSelectingWithRectangle) {
    return;
  }

  isSelectingWithRectangle = false;
  selectionRectangle.remove();
  document.body.classList.remove("disable-text-selection");
});

changeColorButton.addEventListener("click", function () {
  const selectedCharacters = outputArea.querySelectorAll(".character.selected");
  const newColor = selectionColors[currentColorIndex];

  for (let i = 0; i < selectedCharacters.length; i++) {
    selectedCharacters[i].style.color = newColor;
  }

  currentColorIndex = (currentColorIndex + 1) % selectionColors.length;
});

resetButton.addEventListener("click", function () {
  resetCharactersToOriginalState();
});

returnButton.addEventListener("click", function () {
  returnDraggedLettersToOutputContainer();
});

showTextButton.addEventListener("click", function () {
  const enteredText = textInput.value;
  const lettersInOutput = Array.from(outputArea.querySelectorAll(".character"));

  for (let i = 0; i < lettersInOutput.length; i++) {
    lettersInOutput[i].remove();
    characterOriginalState.delete(lettersInOutput[i]);
  }

  originalCharacters = originalCharacters.filter(function (character) {
    return !lettersInOutput.includes(character);
  });

  let nextOriginalIndex = 0;

  for (let i = 0; i < originalCharacters.length; i++) {
    const state = characterOriginalState.get(originalCharacters[i]);

    if (state && state.index >= nextOriginalIndex) {
      nextOriginalIndex = state.index + 1;
    }
  }

  for (let i = 0; i < enteredText.length; i++) {
    const characterSpan = document.createElement("span");
    const originalIndex = nextOriginalIndex;
    nextOriginalIndex += 1;

    characterSpan.classList.add("character");
    characterSpan.draggable = true;
    characterSpan.textContent = enteredText[i];

    originalCharacters.push(characterSpan);
    characterOriginalState.set(characterSpan, {
      parent: outputArea,
      index: originalIndex,
    });

    outputArea.appendChild(characterSpan);
  }
});
