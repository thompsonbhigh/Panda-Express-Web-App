/**
 * Handles the selection of a menu category or item type.
 * Triggers a visual transition overlay, waits for the animation,
 * and redirects the user to the corresponding specific menu page.
 * @async
 * @param {string} item - The category or type of item selected (e.g., "Appetizer", "Drink", "Bowl").
 * @returns {Promise<void>} Resolves after the transition delay and navigation initiation.
 */
async function menuItem(item) {
    console.log("Selected item: " + item);
    const overlay = document.getElementById('transition-overlay');
    
    if (overlay) {
        overlay.classList.add('active');
    }
    await new Promise(resolve => setTimeout(resolve, 320));

    if (item === "Appetizer") {
        window.location.href = `../customer/apps?item=${item}`;
    }
    else if (item === "Drink") {
        window.location.href = `../customer/drinks?item=${item}`;
    }
    else {
        window.location.href = `../customer/menu-items?item=${item}`;
    }
    if (overlay) overlay.classList.remove('active');
}

/**
 * Represents a simplified menu item with basic pricing and categorization.
 * @class
 */
class MenuItem {
    /**
     * Creates an instance of MenuItem.
     * @param {string} name - The name of the menu item.
     * @param {number} price - The price of the item.
     * @param {string} category - The category the item belongs to.
     */
    constructor(name, price, category) {
        this.name = name;
        this.price = price;
        this.category = category;
    }
}