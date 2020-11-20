let allCards = []
let draggingCard = null
let dropTarget = null
const columnNames = ['ready', 'inProgress', 'done']
const columns = {
    ready: { wip: 5 },
    inProgress: { wip: 2 },
    done: { wip: 1000 }
}
const removeCardsAfterDays = 14
const removeCardsAfterMilliseconds = removeCardsAfterDays * 24 * 60 * 60 * 1000
let editingCard = null
let newCardButton

const init = () => {
    newCardButton = document.getElementById('newCardButton')
    load()
    setupColumns()
    allCards.forEach(createCard)
    updateNewButtonState()
    fadeCardsInDone()
    sortDoneColumn()
}

const load = () => {
    allCards = JSON.parse(window.localStorage.getItem('allCards')) || []
    allCards.forEach(x => {
        if (x.doneAt) {
            x.doneAt = new Date(x.doneAt)
        }
    })
    const wipLimits = JSON.parse(window.localStorage.getItem('wipLimits')) || []
    wipLimits.forEach(x => columns[x.column].wip = x.wip)
}

const save = () => {
    const now = new Date()
    const cardsToSave = allCards.filter(x => getCardOpacity(now, x) > 0)
    window.localStorage.setItem('allCards', JSON.stringify(cardsToSave))
    window.localStorage.setItem('wipLimits', JSON.stringify(columnNames.map(column => ({ column, wip: columns[column].wip }))))
    updateNewButtonState()
    fadeCardsInDone()
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
        if (dropTarget.column === 'done') {
            cardData.doneAt = new Date()
        }
        dropTarget.div.appendChild(cardData.div)
        sortDoneColumn()
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
    const deleteButton = document.getElementById('deleteButton')
    if (editingCard) {
        deleteButton.classList.remove('hidden')
    } else {
        deleteButton.classList.add('hidden')
    }
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

const deleteCard = () => {
    if (editingCard) {
        allCards = allCards.filter(x => x !== editingCard)
        save()
    }
}

const updateNewButtonState = () => {
    newCardButton.disabled = !canMoveCardToColumn("ready")
}

const fadeCardsInDone = () => {
    const now = new Date()
    allCards
        .filter(x => x.column === 'done' && x.doneAt)
        .forEach(x => x.div.setAttribute('style', `opacity: ${getCardOpacity(now, x)}%;`))
}

const getCardOpacity = (referenceTime, card) => {
    if (!card.doneAt || card.column !== 'done') {
        return 100
    }
    const doneMs = referenceTime.valueOf() - card.doneAt.valueOf()
    return 100 - Math.round(doneMs / removeCardsAfterMilliseconds * 100);
}

const sortDoneColumn = () => {
    const doneCards = allCards.filter(x => x.column === 'done')
    doneCards.sort((a, b) => b.doneAt - a.doneAt)
    doneCards.forEach(x => document.getElementById('doneCards').appendChild(x.div))
}