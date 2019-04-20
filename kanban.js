let allCards = []
let draggingCard = null
let dropTarget = null
const columnNames = ['ready', 'inProgress', 'done']
const columns = {
    ready: { wip: 5 },
    inProgress: { wip: 2 },
    done: { wip: 1000 }
}
let editingCard = null
let newCardButton

const init = () => {
    newCardButton = document.getElementById('newCardButton')
    load()
    setupColumns()
    allCards.forEach(createCard)
    updateNewButtonState()
}

const load = () => {
    allCards = JSON.parse(window.localStorage.getItem('allCards')) || []
    const wipLimits = JSON.parse(window.localStorage.getItem('wipLimits')) || []
    wipLimits.forEach(x => columns[x.column].wip = x.wip)
}

const save = () => {
    window.localStorage.setItem('allCards', JSON.stringify(allCards))
    window.localStorage.setItem('wipLimits', JSON.stringify(columnNames.map(column => ({ column, wip: columns[column].wip }))))
    updateNewButtonState()
}

const setupColumns = () => {
    columnNames.forEach(x => {
        columns[x].div = document.getElementById(`${x}Cards`)
        columns[x].div.ondrop = event => drop_handler(event, x)
        columns[x].div.ondragover = event => dragover_handler(event)
        columns[x].div.ondragenter = event => dragenter_handler(event, x)
        columns[x].div.ondragleave = event => dragleave_handler(event)
        
        const wipElement = document.getElementById(`${x}Wip`)
        if (wipElement) {
            wipElement.value = columns[x].wip
            wipElement.onchange = event => {
                columns[x].wip = wipElement.value
                save()
            }
        }
    })
}

const createCard = (cardData) => {
    const div = document.createElement('div')
    div.setAttribute('draggable', true)
    div.classList.add('card')
    div.ondragstart = event => dragstart_handler(event, cardData)
    div.ondragend = event => dragend_handler(event, cardData)
    div.innerHTML = cardData.text
    div.addEventListener('dblclick', event => editCard(cardData))
    
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
        save()
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

const newCard = () => showModal()

const showModal = () => {
    document.getElementById('modal').classList.remove('hidden')
    document.getElementById('cardTextInput').focus()
}

const editCard = (cardData) => {
    editingCard = cardData
    document.getElementById('cardTextInput').value = cardData.text
    showModal()
}

const cancelModal = () => {
    document.getElementById('modal').classList.add('hidden')
    document.getElementById('cardTextInput').value = ''
    editingCard = null
}

const saveCard = () => {
    var newText = document.getElementById('cardTextInput').value
    if (!editingCard) {
        const newCard = { text: newText, column: "ready" }
        allCards.push(newCard)
        createCard(newCard)
    } else {
        editingCard.text = newText
        editingCard.div.innerHTML = newText
    }
    save()
    cancelModal()
}

const updateNewButtonState = () => {
    newCardButton.disabled = !canMoveCardToColumn("ready")
}
