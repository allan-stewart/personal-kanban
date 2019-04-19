let allCards = [
    { text: "Test card 1", column: "ready" },
    { text: "Do something great today!", column: "ready" },
    { text: "Thing I'm working on", column: "inProgress" }
]
let draggingCard = null
let dropTarget = null
const columns = {
    ready: { wip: 5 },
    inProgress: { wip: 2 },
    done: { wip: 1000 }
}

const init = () => {
    // TODO: Get all cards and wip limits from local storage
    setupColumns()
    allCards.forEach(createCard)
}

const setupColumns = () => {
    const columnNames = ['ready', 'inProgress', 'done']
    columnNames.forEach(x => {
        columns[x].div = document.getElementById(`${x}Cards`)
        columns[x].div.ondrop = event => drop_handler(event, x)
        columns[x].div.ondragover = event => dragover_handler(event)
        columns[x].div.ondragenter = event => dragenter_handler(event, x)
        columns[x].div.ondragleave = event => dragleave_handler(event)
    })
}

const createCard = (cardData) => {
    const div = document.createElement('div')
    div.setAttribute('draggable', true)
    div.classList.add('card')
    div.ondragstart = event => dragstart_handler(event, cardData)
    div.ondragend = event => dragend_handler(event, cardData)
    div.innerHTML = cardData.text
    
    cardData.div = div
    columns[cardData.column].div.appendChild(div)
}

const canMoveCardToColumn = (column) => {
    if (allCards.filter(x => x.column == column).length >= columns[column].wip) {
        return false
    }
    return true
}

const dragstart_handler = (event, cardData) => {
    draggingCard = cardData
}

const dragend_handler = (event, cardData) => {
    if (dropTarget) {
        cardData.column = dropTarget.column
        dropTarget.div.appendChild(cardData.div)
    }
    dropTarget = null
    draggingCard = null
}

const dragover_handler = event => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move";
}

const drop_handler = (event, column) => {
    event.preventDefault()
    clearCssClass('drop-ok')
    clearCssClass('drop-invalid')
    if (canMoveCardToColumn(column)) {
        dropTarget = { column, div: event.target }
    }
}

const dragenter_handler = (event, column) => {
    if (event.target.classList.contains('card-container') && draggingCard.column !== column) {
        event.target.classList.add(canMoveCardToColumn(column) ? 'drop-ok' : 'drop-invalid')
    }
}

const dragleave_handler = event => {
    event.target.classList.remove('drop-ok')
    event.target.classList.remove('drop-invalid')
    dropTarget = null
}

const clearCssClass = (className) => {
    Array.from(document.getElementsByClassName(className)).forEach(x => x.classList.remove(className))
}
