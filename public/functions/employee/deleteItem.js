window.deleteItem = async function deleteItem(button) {
    const itemname = button.getAttribute("data-name");
    
    try {
        const response = await fetch(`/prep-table/delete/${itemname}`, {
            method: 'POST'
        });

        const row = button.closest('tr');
        row.remove();
    } catch (err) {
        console.error(err);
    }
}