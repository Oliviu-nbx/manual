document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('data-table');
    const saveButton = document.getElementById('save-button');
    const csvFilePath = 'data.csv';  // Path to your CSV file

    function loadCSV() {
        Papa.parse(csvFilePath, {
            download: true,
            header: true, // Use headers from the CSV file
            complete: function(results) {
                const data = results.data;
                if (data.length > 0) {
                    // Create table headers
                    const headers = Object.keys(data[0]);
                    let theadRow = table.querySelector('thead tr');
                    theadRow.innerHTML = ''; // Clear existing elements
                    headers.forEach(headerText => {
                        let th = document.createElement('th');
                        th.textContent = headerText;
                        theadRow.appendChild(th);
                    });

                    // Create table rows with input fields
                    let tbody = table.querySelector('tbody');
                    tbody.innerHTML = ''; // Clear existing elements

                    data.forEach(rowData => {
                        let tr = document.createElement('tr');
                        headers.forEach(header => {
                            let td = document.createElement('td');
                            let input = document.createElement('input');
                            input.type = 'text';
                            input.value = rowData[header] || ''; // Handle empty cells
                            td.appendChild(input);
                            tr.appendChild(td);
                        });
                        tbody.appendChild(tr);
                    });
                }
            }
        });
    }

    function saveCSV() {
        const tableData = [];
        const headerRow = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
        tableData.push(headerRow);
        const tableRows = table.querySelectorAll('tbody tr');

        tableRows.forEach(row => {
            const rowData = Array.from(row.querySelectorAll('td input')).map(input => input.value);
            tableData.push(rowData);
        });

        const csvString = Papa.unparse(tableData);
        console.log(csvString); // Output the CSV string to the console
        alert("Data is printed in the console. Copy and paste the data into data.csv.");
    }

    loadCSV();
    saveButton.addEventListener('click', saveCSV);
});