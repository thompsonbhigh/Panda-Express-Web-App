/**
 * Represents a single menu item selected by the user.
 * @class
 */
class MenuItem {
    /**
     * Creates an instance of MenuItem.
     * @param {string|number} id - The unique identifier of the item.
     * @param {string} name - The name of the item.
     * @param {string} category - The category of the item (e.g., Entree, Side, Drink).
     */
    constructor(id, name, category) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.count = 0;
    }
}

/**
 * Retrieves and increments the unique ID for a new entree/entry from local storage.
 * @returns {number} The new unique entry ID.
 */
function getEntreeId() {
    let id = localStorage.getItem("entreeId") || 0;
    id = parseInt(id) + 1;
    localStorage.setItem("entreeId", id);
    return id;
}

/**
 * Represents a complete entry (e.g., a Bowl, Plate, or Al a Carte item) within an order.
 * @class
 */
class Entry {
    /**
     * Creates an instance of Entry.
     * @param {string|number} orderId - The ID of the parent order.
     * @param {string} size - The size or type of the meal (e.g., "Bowl", "Plate", "Small").
     * @param {MenuItem[]} menuItems - List of menu items included in this entry.
     * @param {number} [price=0.0] - The calculated price of this entry.
     */
    constructor(orderId, size, menuItems, price=0.0) {
        this.entryId = getEntreeId();
        this.orderId = orderId;
        this.size = size;
        this.menuItems = menuItems;
        this.price = price;
    }
}

/**
 * Represents the aggregate order containing all entries and total cost.
 * @class
 */
class TotalOrder {
    /**
     * Creates an instance of TotalOrder.
     * @param {Entry[]} entries - Array of entries in the order.
     * @param {number} totalPrice - The total accumulated price.
     */
    constructor (entries, totalPrice) {
        this.orderId = localStorage.getItem("orderId");
        this.entries = entries;
        this.totalPrice = totalPrice;
    }
}

/**
 * Initializes event listeners when the DOM is fully loaded.
 * Sets up button click handlers and loads existing selections if editing.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Your code to run after the DOM is fully loaded
    document.querySelectorAll(".menu-item-button").forEach(button => {
        button.addEventListener("click", () => selectItem(button));
    });

    window.sizePopup = document.getElementById("sizePopup");

    loadSelections();
});

/** @type {Object} Limits for sides and entrees based on meal type. */
const limits = window.selectionLimits;
/** @type {string} The current meal type (e.g., "Bowl", "Plate", "Al a Carte"). */
let mealType = window.mealType;
/** @type {number[]} Destructured limits for sides and entrees. */
let [sideLimit, entreeLimit] = limits[mealType] || [0, 0];

/** @type {MenuItem[]} Array of currently selected items. */
let selectedItems  = [];
/** @type {number} Counter for selected entrees. */
let entrees = 0;
/** @type {number} Counter for selected sides. */
let sides = 0;
/** @type {number} Counter for substitutions (sides taking entree slots). */
let subs  = 0;

/**
 * Handles the selection of a size for "Al a Carte" items via the popup.
 * Creates a MenuItem with the selected size and updates the UI.
 * @param {string} size - The size selected (e.g., "Small", "Medium", "Large").
 */
function selectSize(size) {
    sizePopup.style.display = "none";
    if (pending) {
        const {id, name, button} = pending;

        selectedItems.push(new MenuItem(id, name, size));
        button.classList.add("selected");
        button.querySelector("#item-count").innerText = size;
        button.querySelector("#item-count").style.display = "inline";
        pending = null;
    }
}

/**
 * Displays the size selection popup if available.
 */
function showPopup() {
    if (!sizePopup) return; 
    sizePopup.style.display = "block";
}

/** @type {Object|null} Temporary storage for an item pending size selection. */
let pending = null;

/**
 * Handles the click event for a menu item button.
 * Manages selection logic, including:
 * - "Al a Carte" popup triggering.
 * - Toggling drinks and appetizers.
 * - Enforcing limits for entrees and sides.
 * - Handling substitutions (extra sides in place of entrees).
 * @async
 * @param {HTMLElement} button - The DOM element representing the clicked menu item.
 */
async function selectItem(button) {
    const itemId = button.getAttribute("data-id");
    const itemCategory = button.getAttribute("data-category");
    const itemName = button.getAttribute("data-name");

    if (mealType === "Al a Carte") {

        if (button.classList.contains("selected")) {
            // Deselect the item
            button.classList.remove("selected");
            button.querySelector("#item-count").innerText = "0";
            button.querySelector("#item-count").style.display = "none";
            selectedItems = selectedItems.filter(item => item.id !== itemId);
            pending = null;
            return;
        }
        
        if (selectedItems.length >= 1 || pending) {
            return;
        }
        pending = {id : itemId, name: itemName, button: button};
        showPopup();
        return;
    }

    if (itemCategory === "Drink") {
        if (button.classList.contains("selected")) {
            // Deselect the item
            button.classList.remove("selected");
            selectedItems = selectedItems.filter(item => item.id !== itemId);
        } 
        else {
            if (selectedItems.length >= 1) {
                document.querySelectorAll(".selected").forEach(btn => btn.classList.remove("selected"));
                selectedItems = [];
            }
            button.classList.add("selected");
            selectedItems.push(new MenuItem(itemId, itemName, itemCategory));
        }
        return;
    }
    else if (itemCategory === "Appetizer") {
        if (button.classList.contains("selected")) {
            // Deselect the item
            button.classList.remove("selected");
            selectedItems = selectedItems.filter(item => item.id !== itemId);
        }
        else {
            if (selectedItems.length >= 1) {
                document.querySelectorAll(".selected").forEach(btn => btn.classList.remove("selected"));
                selectedItems = [];
            }
            button.classList.add("selected");
            selectedItems.push(new MenuItem(itemId, itemName, itemCategory));
        }
    }    

    else if (mealType !== "Al a Carte") { // entree and side selection

            // Increase count or deselect

            let count = Number(button.querySelector("#item-count").innerText) || 0;
            if (itemCategory === "Entree" || itemCategory === "Premium Entree") {
                if ((entrees + subs) < entreeLimit) {
                    count++;
                    entrees++;
                    selectedItems.push(new MenuItem(itemId, itemName, itemCategory));
                    button.querySelector("#item-count").innerText = count;
                    if (button.classList.contains("selected") === false) {
                        button.classList.add("selected");
                        button.querySelector("#item-count").style.display = "inline";
                    }
                }
                else {
                    // Deselect
                    button.classList.remove("selected");
                    selectedItems = selectedItems.filter(item => item.id !== itemId);
                    button.querySelector("#item-count").innerText = "0";
                    button.querySelector("#item-count").style.display = "none";
                    entrees = entrees - count;
                }
            } 
            else if (itemCategory === "Side") {
                if (sides < sideLimit) {
                    count++;
                    sides++;
                    selectedItems.push(new MenuItem(itemId, itemName, itemCategory));
                    button.querySelector("#item-count").innerText = count;
                    if (button.classList.contains("selected") === false) {
                        button.classList.add("selected");
                        button.querySelector("#item-count").style.display = "inline";
                    }
                }
                else {
                    if ((entrees + subs) < entreeLimit) {
                        subs++;
                        count++;

                        selectedItems.push(new MenuItem(itemId, itemName, itemCategory));
                        button.querySelector("#item-count").innerText = count;
                        if (button.classList.contains("selected") === false) {
                            button.classList.add("selected");
                            button.querySelector("#item-count").style.display = "inline";
                        }
                    }
                    else {
                        // Deselect 
                        button.classList.remove("selected");
                        selectedItems = selectedItems.filter(item => item.id !== itemId);
                        button.querySelector("#item-count").innerText = "0";
                        button.querySelector("#item-count").style.display = "none";

                        if (subs < count) {
                            sides = sides - (count - subs);
                            subs = 0;
                        }
                        else {subs = subs - count;}                
                    }
                }
            }
            console.log("entrees:", entrees, "sides:", sides, "subs:", subs);
        
        
    }
}

/**
 * Calculates the total price for the selected items, including premium upcharges.
 * Fetches base price from the server based on meal type.
 * @async
 * @param {string} mealType - The type of meal (e.g., "Bowl", "Plate").
 * @returns {Promise<number>} The calculated total price.
 */
async function calcPrice(mealType) {
    try {
        const response = await fetch(`get-price?item=${mealType}`);
        const data = await response.json();
        console.log("Calculated price:", data.price);
        totalPrice = Number(data.price);

        for (let item of selectedItems) {
            if (item.category === "Premium Entree") {
                totalPrice += 1.50;
            }
        }
        return totalPrice;
    } catch (error) {
        console.error("Error calculating price:", error);
        return 0;
    }
}

/**
 * Validates the order and proceeds to the order summary.
 * Creates an Entry object, adds it to the TotalOrder in localStorage,
 * syncs with the server, and redirects the user.
 * @async
 */
async function proceed(){
    if (selectedItems.length === 0) {
        alert("Please select at least one item to proceed.");
        return;
    }

    if (mealType === "Al a Carte") {
        mealType = selectedItems[0].category;
    }
    let totalPrice = await calcPrice(mealType);

    const orderId = localStorage.getItem("orderId");
    let orderEntry = new Entry(orderId, mealType, selectedItems, totalPrice);

    let Totalorder = JSON.parse(localStorage.getItem("Totalorder")) || {
        orderId: localStorage.getItem("orderId"),
        entries: [],
        totalPrice: 0.0
    };


    Totalorder.entries.push(orderEntry);
    Totalorder.totalPrice += totalPrice;
    localStorage.setItem("Totalorder", JSON.stringify(Totalorder));
    
    await fetch('/customer/store-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(Totalorder)
    });

    entrees = 0;
    sides = 0;
    selectedItems = [];
    window.location.href = '../customer/order-details';
}

/**
 * Cancels the current selection and returns to the main item selection page.
 * @async
 */
async function goBack() {
    window.location.href = '/customer/item-selection';
}

/**
 * Loads previously selected items if the user is editing an existing entry.
 * Checks sessionStorage for 'editEntry' data and programmatically updates
 * the UI buttons and internal counters to match the preserved state.
 */
function loadSelections() {
    const edit = JSON.parse(sessionStorage.getItem('editEntry'));
    if (edit) {

        if (edit.size === "Appetizer || Drink") {
            edit.menuItems.forEach(item => {
                const button = document.querySelector(`button[data-id='${item.id}']`);
                if (button) {
                    button.classList.add("selected");
                    selectedItems.push(new MenuItem(item.id, item.name, item.category));
                }
            });
        }
        else if (edit.size === 'Small' || edit.size === 'Medium' || edit.size === 'Large') {
            edit.menuItems.forEach(item => {
                const button = document.querySelector(`button[data-id='${item.id}']`);
                if (button) {
                    button.classList.add("selected");
                    selectedItems.push(new MenuItem(item.id, item.name, item.category));
                    button.querySelector("#item-count").innerText = edit.size;
                    button.querySelector("#item-count").style.display = "inline";
                }
            });
        }
        else {
            edit.menuItems.forEach(item => {
                const button = document.querySelector(`button[data-id='${item.id}']`);
                if (button) {
                    button.classList.add("selected");
                    selectedItems.push(new MenuItem(item.id, item.name, item.category));
                    count = Number(button.querySelector("#item-count").innerText) || 0;
                    count++;
                    button.querySelector("#item-count").innerText = count;
                    button.querySelector("#item-count").style.display = "inline";
                    if (item.category === "Entree" || item.category == "Premium Entree") {
                        entrees++;
                    } else if (item.category === "Side") {
                        sides++;
                        if (sides > sideLimit) {
                            subs++;
                        }
                    }
                }
            });
        }
    }
    sessionStorage.removeItem('editEntry');
}

/**
 * Window load event handler.
 * Ensures selections are loaded when the window finishes loading.
 */
window.onload = function() {
    loadSelections();
}